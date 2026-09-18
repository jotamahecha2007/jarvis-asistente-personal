export function requireApiKey(req, res, next) {
  const expected = process.env.JARVIS_API_KEY;
  if (!expected) return next(); // si no configuraste clave, se salta (solo para pruebas locales)

  // Acepta la clave por header (uso normal de la app/automatizaciones) o por
  // query param ?key=... (para poder disparar una URL directo desde el navegador,
  // útil para simular la ingesta cero-fricción sin necesitar MacroDroid).
  const provided = req.header("x-jarvis-key") || req.query.key;
  if (provided !== expected) {
    return res.status(401).json({ error: "No autorizado. Falta o es invalida x-jarvis-key." });
  }
  next();
}