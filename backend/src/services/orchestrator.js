import { chatWithToolsOnce } from "./ollama.js";
import { financialTools, financialHandlers } from "../agents/financialAgent.js";
import { secretaryTools, secretaryHandlers } from "../agents/secretaryAgent.js";

const ALL_TOOLS = [...secretaryTools, ...financialTools];
const ALL_HANDLERS = { ...secretaryHandlers, ...financialHandlers };

const ORCHESTRATOR_SYSTEM_PROMPT = `Eres JARVIS, el orquestador de un asistente personal con dos agentes
especializados disponibles como herramientas: Secretaría (correos, tareas, agenda) y Finanzas
(transacciones, tarjetas, metas de ahorro).

REGLA MÁS IMPORTANTE: las herramientas SOLO existen para leer o modificar los datos personales
del usuario (sus tareas, correos, transacciones, tarjetas, metas). Para CUALQUIER OTRA COSA
—preguntas de conocimiento general, matemáticas, saludos, charla casual, opiniones, explicaciones—
respondes tú mismo directamente, en texto, SIN llamar ninguna herramienta. No existe ni debe
existir una herramienta para "responder preguntas generales"; si no hay una herramienta cuyo
propósito coincida exactamente con lo que el usuario pide, la respuesta correcta es no llamar
ninguna herramienta y contestar con tu propio conocimiento.

Ejemplos:
- "¿Cuánto es dos más dos?" → responde "4, señor." directamente, sin herramientas.
- "¿Cuánto dinero tengo disponible?" → usa get_balance_and_cashflow.
- "Hola, ¿cómo estás?" → responde directo, sin herramientas.
- "Registra un gasto de 20000 en transporte" → usa add_transaction.

FORMATO DE TU RESPUESTA FINAL AL USUARIO (muy importante): siempre es prosa natural en español,
como si un mayordomo hablara en voz alta. NUNCA escribas JSON, llaves {}, corchetes [], comillas
de código, nombres de funciones/herramientas, ni comentarios sobre si "es necesario llamar a una
herramienta" o no — eso es razonamiento interno que el usuario jamás debe ver. Ejemplo de lo que
está MAL: 'No es necesario llamar a ninguna herramienta, la respuesta es: {"answer": 4}'. Ejemplo
de lo que está BIEN: '4, señor.' Si en algún momento estás a punto de escribir un '{' o mencionar
una herramienta por su nombre en tu respuesta, detente y reescribe la frase como lenguaje natural.

Puedes usar varias herramientas, incluso de ambos agentes, si la pregunta lo requiere (ej. "reviso
mis correos y también cuánto dinero tengo"). Una vez tengas los resultados de las herramientas,
responde al usuario en español, de forma clara, concisa y en tono de mayordomo eficiente. Nunca
inventes datos financieros o de tareas: si una herramienta no tiene información, dilo. Nunca
digas que "no tienes una herramienta" para algo que puedes responder tú mismo con tu propio
conocimiento — eso solo aplica a datos personales del usuario que de verdad no tienes cómo consultar.`;

const MAX_TOOL_ROUNDS = 4;

/**
 * Red de seguridad: si el modelo igual se resbala y deja escapar JSON crudo o
 * menciona nombres de herramientas en la respuesta final, lo detectamos y
 * devolvemos algo razonable en vez de mostrarle basura al usuario.
 */
function sanitizeFinalContent(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return trimmed;

  // Si el texto es puro JSON (empieza con { o [ y termina con } o ]), es un
  // resbalón del modelo: no hay forma confiable de "traducirlo" a prosa aquí,
  // así que pedimos reformular en vez de mostrar el JSON.
  const looksLikePureJSON = /^[{[][\s\S]*[}\]]$/.test(trimmed);
  if (looksLikePureJSON) {
    return "Disculpe, tuve un problema formulando la respuesta con palabras. ¿Puede repetir la pregunta?";
  }

  // Si el JSON aparece pegado dentro de una frase (ej. "la respuesta es: {...}"),
  // cortamos todo desde la primera '{' o '[' que abre ese bloque.
  const jsonStart = trimmed.search(/[{[]/);
  if (jsonStart > 0) {
    const before = trimmed.slice(0, jsonStart).trim();
    if (before.length > 3) return before.replace(/[:,-]\s*$/, "").trim();
  }

  return trimmed;
}

/**
 * Corre el ciclo de function-calling: le manda el historial + las tools al modelo,
 * si pide ejecutar herramientas las corre localmente (agente correspondiente),
 * le devuelve los resultados como mensajes "tool", y repite hasta que el modelo
 * responda con texto final (o se llegue al límite de rondas).
 *
 * Devuelve { content, toolsUsed: string[] } para que la app pueda, si quiere,
 * mostrar qué agente(s) participaron.
 */
export async function runOrchestrator(userMessages) {
  const conversation = [...userMessages];
  const toolsUsed = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const message = await chatWithToolsOnce(conversation, {
      system: ORCHESTRATOR_SYSTEM_PROMPT,
      tools: ALL_TOOLS,
    });

    const calls = message.tool_calls || [];
    if (calls.length === 0) {
      return { content: sanitizeFinalContent(message.content), toolsUsed };
    }

    // El modelo pidió usar una o más herramientas: las ejecutamos y le devolvemos el resultado.
    conversation.push({ role: "assistant", content: message.content || "", tool_calls: calls });

    for (const call of calls) {
      const name = call.function?.name;
      let args = call.function?.arguments;
      if (typeof args === "string") {
        try {
          args = JSON.parse(args);
        } catch {
          args = {};
        }
      }
      args = args || {};

      const handler = ALL_HANDLERS[name];
      let result;
      if (!handler) {
        result = {
          ok: false,
          error: `No existe la herramienta '${name}'. No la vuelvas a llamar: si esto no es sobre datos personales del usuario (tareas/correos/finanzas), responde directamente con tu propio conocimiento.`,
        };
      } else {
        try {
          result = await handler(args);
          toolsUsed.push(name);
        } catch (err) {
          result = { ok: false, error: err.message };
        }
      }

      conversation.push({
        role: "tool",
        name,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    content: "Necesité varios pasos y no logré cerrar la respuesta a tiempo. ¿Puedes reformular la pregunta?",
    toolsUsed,
  };
}