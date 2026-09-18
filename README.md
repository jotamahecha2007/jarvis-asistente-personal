# JARVIS — Asistente Personal Móvil Multi-Agente con Control por Voz

Asistente personal con arquitectura multi-agente: control por voz desde el celular,
un backend auto-hospedado que orquesta un **Agente de Secretaría** y un **Agente
Financiero** usando *function calling* sobre un LLM local (Ollama), persistencia
relacional en Supabase, e ingesta automática ("zero-friction") de transacciones
bancarias.

```
                    ┌─────────────────────────────────────────────┐
                    │              BACKEND (Node/Express)          │
  Celular  ──────►  │  Orquestador (llama3.1 + function calling)   │ ──► Supabase
  (mobile/,         │   ├─ Agente de Secretaría (tareas, correos)  │     (Postgres,
  Tailscale,        │   └─ Agente Financiero (gastos, tarjetas,    │      esquema
  Expo Go)          │       metas de ahorro)                       │      relacional)
                    │  Whisper local (voz → texto)                  │
                    │  Webhook de ingesta cero-fricción             │
                    └─────────────────────────────────────────────┘
                                      ▲
                                      │ notificación bancaria / correo
                              MacroDroid / navegador (simulado)
```

## Estructura del repositorio

```
mobile/    App React Native (Expo SDK 57, corre en Expo Go) — estética "Jarvis"
backend/   Orquestador multi-agente (Node/Express + Ollama + Supabase + Whisper)
docs/      Documento técnico: diagrama de secuencia + esquema relacional
```

## Qué hace cada pieza

- **`backend/`** — Servidor Express auto-hospedado. Expone `http://localhost:8080/api/`,
  accesible desde el celular únicamente vía **Tailscale** (sin puertos públicos
  expuestos a internet). El orquestador usa `llama3.1` en Ollama con *function
  calling* para decidir si una petición del usuario necesita el Agente de
  Secretaría, el Financiero, ambos, o ninguno. La voz de entrada se transcribe
  localmente con Whisper (`@huggingface/transformers`, sin dependencias en la
  nube). Los datos persisten en **Supabase (PostgreSQL)** con un esquema
  relacional real (ver `backend/schema.sql` y `docs/`).
- **`mobile/`** — App React Native con estética tipo Jarvis (núcleo arc-reactor
  animado, HUD cian sobre negro). Pestañas: Inicio, Chat (con micrófono real),
  Finanzas (movimientos / tarjetas / metas) y Tareas.

## Puesta en marcha rápida

1. **Supabase**: crea un proyecto gratis, corre `backend/schema.sql` en su SQL Editor, copia la URL y la `service_role` key.
2. **Ollama** en el equipo que hará de backend: `ollama pull llama3.1 && ollama serve`.
3. **Backend**: `cd backend && cp .env.example .env` (edita las claves de Supabase, `JARVIS_API_KEY`, y opcionalmente `MAIL_*` para correo real) `&& npm install && npm run dev`.
4. **Tailscale**: instálalo en el equipo del backend y en el celular, misma tailnet.
5. **App**: `cd mobile && npm install && npx expo start`, escanea el QR con Expo Go.
6. En la app, Ajustes → pon la IP de Tailscale del backend y la clave → "Probar conexión".

Cada carpeta tiene su propio `README.md` con el detalle completo (incluyendo cómo
dejar el backend corriendo siempre en segundo plano con PM2, y cómo probar la
ingesta cero-fricción del webhook).

## Funcionalidades implementadas

- ✅ Control por voz real: grabar en la app → transcripción local con Whisper → respuesta hablada (TTS).
- ✅ Orquestador multi-agente con function calling (Secretaría + Finanzas).
- ✅ Agente de Secretaría: tareas con prioridad/estado, lectura real de correo (IMAP), borradores de correo.
- ✅ Agente Financiero: transacciones categorizadas, saldo y flujo de caja, tarjetas de crédito, metas de ahorro con historial de abonos.
- ✅ Ingesta cero-fricción: webhook que recibe texto crudo (notificación/correo) y usa el LLM en modo *structured output* (JSON) para registrar la transacción sin intervención humana.
- ✅ Conectividad exclusivamente vía Tailscale, autenticada con clave compartida.
- ✅ Persistencia en Supabase con integridad referencial (categorías, tarjetas, metas ↔ abonos).

