import { Router } from "express";

const router = Router();

/**
 * Cada funcion "fetchX" es un stub. La idea es que reemplaces el cuerpo por la llamada
 * real (IMAP para Correos, Google Drive API, whatsapp-web.js, Github API) cuando quieras
 * conectar cada fuente. Mientras tanto devuelven datos de ejemplo para que el resto del
 * sistema (JARVIS + la app) ya funcione de punta a punta.
 */

export async function fetchCorreosRaw() {
  return fetchCorreos();
}

async function fetchCorreos() {
  // TODO: conectar via IMAP (MAIL_IMAP_HOST/PORT/USER/PASS en .env) con ej. "imapflow"
  return { source: "correos", items: [], note: "Integración de correo no configurada todavía." };
}

async function fetchDrive() {
  // TODO: conectar con Google Drive API usando GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN
  return { source: "drive", items: [], note: "Integración de Drive no configurada todavía." };
}

async function fetchWhatsApp() {
  // TODO: correr whatsapp-web.js (u otra lib) como proceso aparte que le haga POST
  // a un webhook de este servidor, y aquí solo leer lo último guardado.
  return { source: "whatsapp", items: [], note: "Integración de WhatsApp no configurada todavía." };
}

async function fetchGithub() {
  // TODO: usar GITHUB_TOKEN con la API REST/GraphQL de Github (notificaciones, PRs, issues)
  if (!process.env.GITHUB_TOKEN) {
    return { source: "github", items: [], note: "Falta GITHUB_TOKEN en .env." };
  }
  try {
    const res = await fetch("https://api.github.com/notifications", {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) return { source: "github", items: [], note: `Github respondió ${res.status}` };
    const data = await res.json();
    return { source: "github", items: data.slice(0, 5) };
  } catch (err) {
    return { source: "github", items: [], note: err.message };
  }
}

router.get("/correos", async (_req, res) => res.json(await fetchCorreos()));
router.get("/drive", async (_req, res) => res.json(await fetchDrive()));
router.get("/whatsapp", async (_req, res) => res.json(await fetchWhatsApp()));
router.get("/github", async (_req, res) => res.json(await fetchGithub()));

// Resumen combinado de todas las fuentes, para pantallas tipo "briefing"
router.get("/all", async (_req, res) => {
  const [correos, drive, whatsapp, github] = await Promise.all([
    fetchCorreos(),
    fetchDrive(),
    fetchWhatsApp(),
    fetchGithub(),
  ]);
  res.json({ correos, drive, whatsapp, github });
});

// Usado por /api/chat cuando useContext=true, para darle a Ollama algo de contexto real
export async function getAggregatedContext() {
  const [correos, drive, whatsapp, github] = await Promise.all([
    fetchCorreos(),
    fetchDrive(),
    fetchWhatsApp(),
    fetchGithub(),
  ]);
  const parts = [correos, drive, whatsapp, github].map(
    (s) => `- ${s.source}: ${s.items?.length || 0} elemento(s). ${s.note || ""}`
  );
  return parts.join("\n");
}

export default router;
