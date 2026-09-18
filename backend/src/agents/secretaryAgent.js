import { list, insert, update } from "../store/db.js";
import { fetchCorreosRaw } from "../routes/integrations.js";
import { chatWithOllama } from "../services/ollama.js";

const TASKS = "tasks";
const DRAFTS = "email_drafts";

export const secretaryTools = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Crea una tarea/pendiente con fecha límite opcional y prioridad.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string" },
          due_date: { type: "string", description: "Fecha límite en formato ISO (YYYY-MM-DD), opcional" },
          priority: { type: "string", enum: ["baja", "media", "alta"] },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "Lista las tareas del usuario, opcionalmente filtradas por estado.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pendiente", "en_progreso", "completado"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Actualiza el estado de una tarea existente buscándola por texto aproximado.",
      parameters: {
        type: "object",
        properties: {
          text_match: { type: "string", description: "Texto o parte del texto de la tarea a actualizar" },
          status: { type: "string", enum: ["pendiente", "en_progreso", "completado"] },
        },
        required: ["text_match", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_emails",
      description: "Revisa el buzón de correo del usuario y devuelve un resumen de mensajes no leídos o recientes.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Qué buscar, ej. 'correo del decano', 'mensajes urgentes'" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_email",
      description: "Redacta un borrador de correo según instrucciones del usuario. No lo envía, solo lo deja listo para revisión.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          instructions: { type: "string", description: "Qué debe decir el correo, tono, contexto" },
        },
        required: ["instructions"],
      },
    },
  },
];

export const secretaryHandlers = {
  create_task: async ({ text, due_date, priority = "media" }) => {
    const task = await insert(TASKS, { text, due_date: due_date || null, priority, status: "pendiente" });
    return { ok: true, task };
  },

  list_tasks: async ({ status }) => {
    let items = await list(TASKS);
    if (status) items = items.filter((t) => t.status === status);
    return { items };
  },

  update_task_status: async ({ text_match, status }) => {
    const items = await list(TASKS);
    const found = items.find((t) => t.text.toLowerCase().includes(String(text_match).toLowerCase()));
    if (!found) return { ok: false, error: `No encontré ninguna tarea que contenga '${text_match}'` };
    const updated = await update(TASKS, found.id, { status });
    return { ok: true, task: updated };
  },

  check_emails: async ({ query }) => {
    const result = await fetchCorreosRaw();
    return { query: query || null, ...result };
  },

  draft_email: async ({ to, subject, instructions }) => {
    const prompt = `Redacta un correo en español. Para: ${to || "(destinatario no especificado)"}. ` +
      `Asunto sugerido: ${subject || "(genera uno apropiado)"}. Instrucciones: ${instructions}. ` +
      `Devuelve solo el cuerpo del correo, tono profesional y conciso.`;
    const body = await chatWithOllama([{ role: "user", content: prompt }], {
      system: "Eres un asistente que redacta correos profesionales y concisos en español.",
    });
    const draft = await insert(DRAFTS, { to_address: to || null, subject: subject || null, body, status: "borrador" });
    return { ok: true, draft };
  },
};