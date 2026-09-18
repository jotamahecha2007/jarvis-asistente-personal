import "dotenv/config";
import express from "express";
import cors from "cors";

import { requireApiKey } from "./src/middleware/auth.js";
import chatRouter from "./src/routes/chat.js";
import integrationsRouter from "./src/routes/integrations.js";
import webhookRouter from "./src/routes/webhook.js";
import dataRouter from "./src/routes/data.js";
import transcribeRouter from "./src/routes/transcribe.js";
import { checkOllamaHealth } from "./src/services/ollama.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const PORT = process.env.PORT || 8080;

// http://localhost:8080/api/health  (no requiere clave, util para diagnosticar)
app.get("/api/health", async (_req, res) => {
  const ollama = await checkOllamaHealth();
  res.json({ ok: true, ollama, time: new Date().toISOString() });
});

// Todo lo demás bajo /api/ requiere la clave x-jarvis-key (ver .env)
app.use("/api/chat", requireApiKey, chatRouter);
app.use("/api/integrations", requireApiKey, integrationsRouter);
app.use("/api/data", requireApiKey, dataRouter);

// El webhook de ingesta cero-fricción también requiere la clave (Tasker/Shortcuts
// deben mandarla en el header x-jarvis-key al configurar la automatización).
app.use("/api/webhook", requireApiKey, webhookRouter);

// Voz de entrada: recibe audio grabado en el celular, lo transcribe con Whisper local
// y corre el orquestador con el texto resultante.
app.use("/api/transcribe", requireApiKey, transcribeRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`JARVIS backend escuchando en http://localhost:${PORT}/api/`);
  console.log("Accesible remotamente por Tailscale usando la IP de este equipo (ej. 100.x.x.x).");
});
