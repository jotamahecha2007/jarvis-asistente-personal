import { Router } from "express";
import { runOrchestrator } from "../services/orchestrator.js";

const router = Router();

// POST /api/chat  { messages: [...] }
// Ya no es un chat "tonto" de un solo prompt: pasa por el orquestador multi-agente,
// que decide si necesita usar el Agente de Secretaría, el Agente Financiero, ambos,
// o simplemente responder directo.
router.post("/", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Falta 'messages' (array de {role, content})." });
  }

  try {
    const result = await runOrchestrator(messages);
    res.json({ role: "assistant", content: result.content, toolsUsed: result.toolsUsed });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
