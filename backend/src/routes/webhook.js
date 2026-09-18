import { Router } from "express";
import { chatJSON } from "../services/ollama.js";
import { financialHandlers } from "../agents/financialAgent.js";

const router = Router();

const EXTRACTION_SYSTEM_PROMPT = `Extraes datos de notificaciones o correos transaccionales de bancos
(Bancolombia, Davivienda, Nu, etc.). Del texto que te den, devuelve SOLO un objeto JSON con estas
claves exactas:
{
  "amount": number (monto positivo, sin símbolos de moneda),
  "currency": string (ej. "COP", "USD"; si no es claro usa "COP"),
  "merchant": string (comercio o motivo, o null si no aparece),
  "date": string en formato ISO (YYYY-MM-DD) si aparece, si no usa la fecha de hoy,
  "payment_method": string (ej. "tarjeta de crédito", "PSE", "transferencia", "efectivo"),
  "transaction_type": "income" | "expense",
  "category": una de "alimentacion" | "transporte" | "servicios" | "educacion" | "ocio" | "salud" | "otros"
}
Si el texto no parece una transacción bancaria, responde { "amount": null }.`;

async function processTransactionText(text) {
  if (!text || typeof text !== "string") {
    throw Object.assign(new Error("Falta 'text' con el contenido crudo de la notificación/correo."), {
      status: 400,
    });
  }

  const extracted = await chatJSON([{ role: "user", content: text }], {
    system: EXTRACTION_SYSTEM_PROMPT,
  });

  if (!extracted.amount) {
    return { ok: false, note: "No se detectó una transacción en el texto.", extracted };
  }

  const result = await financialHandlers.add_transaction({
    description: extracted.merchant || "Transacción automática",
    amount: extracted.amount,
    transaction_type: extracted.transaction_type || "expense",
    category: extracted.category || "otros",
  });

  return { ok: true, extracted, ...result };
}

// POST /api/webhook/transaction   { text: "<notificación o correo crudo>" }
// Pensado para recibir el POST que dispara Tasker / MacroDroid / NotificationListener /
// Apple Shortcuts cuando llega una notificación o correo bancario.
router.post("/transaction", async (req, res) => {
  try {
    const result = await processTransactionText((req.body || {}).text);
    res.json(result);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
});

// GET /api/webhook/transaction?text=...&key=...
// Igual que la de arriba pero disparable escribiendo una URL directo en el
// navegador del celular — útil para simular/demostrar la ingesta cero-fricción
// sin depender de una notificación real ni de MacroDroid.
// Ejemplo: http://<ip-tailscale>:8080/api/webhook/transaction?key=TU_CLAVE&text=Bancolombia%20compra%20%2445000%20Rappi
router.get("/transaction", async (req, res) => {
  try {
    const result = await processTransactionText(req.query.text);
    res.json(result);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
});

export default router;