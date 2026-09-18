import { Router } from "express";
import { transcribeAudioBuffer } from "../services/whisper.js";
import { runOrchestrator } from "../services/orchestrator.js";

const router = Router();

// POST /api/transcribe  { audioBase64, extension?, history?, autoChat? }
// audioBase64: el archivo de audio grabado en el celular, en base64.
// Si autoChat=true (default), además de transcribir corre el orquestador con
// el texto resultante y devuelve la respuesta de JARVIS en el mismo viaje.
router.post("/", async (req, res) => {
  const { audioBase64, extension = "m4a", history = [], autoChat = true } = req.body || {};
  if (!audioBase64) {
    return res.status(400).json({ error: "Falta 'audioBase64' con el audio grabado." });
  }

  try {
    const buffer = Buffer.from(audioBase64, "base64");
    const transcript = await transcribeAudioBuffer(buffer, { extension });

    if (!transcript || !transcript.trim()) {
      return res.json({ transcript: "", reply: null, note: "No se detectó voz en el audio." });
    }

    if (!autoChat) {
      return res.json({ transcript });
    }

    const messages = [...history, { role: "user", content: transcript }];
    const result = await runOrchestrator(messages);
    res.json({ transcript, reply: result.content, toolsUsed: result.toolsUsed });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
