import fetch from "node-fetch";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL || "gemma2:9b";

/**
 * Envia el historial de chat a Ollama y devuelve la respuesta completa (no streaming).
 * messages: [{ role: "user"|"assistant"|"system", content: string }]
 */
export async function chatWithOllama(messages, { system } = {}) {
  const payload = {
    model: MODEL,
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    stream: false,
  };

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama respondio ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.message?.content ?? "";
}

/**
 * Version streaming: llama onToken(chunk) por cada fragmento que llega de Ollama.
 */
export async function chatWithOllamaStream(messages, { system, onToken }) {
  const payload = {
    model: MODEL,
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    stream: true,
  };

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    const text = res.body ? await res.text() : "sin respuesta";
    throw new Error(`Ollama respondio ${res.status}: ${text}`);
  }

  let full = "";
  for await (const chunk of res.body) {
    const lines = chunk.toString("utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        const token = json.message?.content ?? "";
        if (token) {
          full += token;
          onToken?.(token);
        }
      } catch {
        // linea parcial, se ignora
      }
    }
  }
  return full;
}

/**
 * Chat con soporte de "tools" (function calling), formato compatible con la API
 * de Ollama para modelos que lo soportan (llama3.1, mistral, etc.).
 * Devuelve el mensaje completo del modelo: { content, tool_calls? }
 */
export async function chatWithToolsOnce(messages, { system, tools } = {}) {
  const payload = {
    model: MODEL,
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    tools,
    stream: false,
  };

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama respondio ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.message; // { role, content, tool_calls? }
}

/**
 * Fuerza al modelo a responder SOLO con JSON valido (usa el modo "format: json"
 * de Ollama). Se usa para extraer datos estructurados de texto crudo, como
 * notificaciones bancarias, sin intervencion humana.
 */
export async function chatJSON(messages, { system } = {}) {
  const payload = {
    model: MODEL,
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    format: "json",
    stream: false,
  };

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama respondio ${res.status}: ${text}`);
  }

  const data = await res.json();
  const raw = data.message?.content ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`El modelo no devolvió JSON válido: ${raw}`);
  }
}

export async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return { ok: false, error: `status ${res.status}` };
    const data = await res.json();
    const hasModel = (data.models || []).some((m) => m.name?.startsWith(MODEL.split(":")[0]));
    return { ok: true, model: MODEL, modelInstalled: hasModel };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
