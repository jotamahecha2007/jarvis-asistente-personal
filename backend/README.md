# JARVIS backend — orquestador multi-agente

Servidor Express que corre en tu PC (el "Mac mini / servidor local único" del diagrama) y hace de:

- **Orquestador con function calling**: recibe el mensaje del usuario y `llama3.1` (vía Ollama)
  decide si debe usar el **Agente de Secretaría**, el **Agente Financiero**, ambos, o responder directo.
- **Agente de Secretaría**: tareas (crear/listar/actualizar estado), revisión de correos (stub,
  ver más abajo) y redacción de borradores de correo.
- **Agente Financiero**: transacciones categorizadas, saldo y flujo de caja, tarjetas de
  crédito/préstamos, metas de ahorro.
- **Ingesta cero-fricción**: un webhook (`/api/webhook/transaction`) que recibe texto crudo de una
  notificación o correo bancario y usa el LLM en modo *structured output* (JSON) para extraer
  monto/comercio/fecha/medio de pago y registrar la transacción sin intervención humana.
- Persistencia en **archivos JSON locales** (`backend/data/*.json`, se crean solos) — sin Supabase
  todavía, pero con una capa (`src/store/db.js`) pensada para migrar a Postgres sin tocar el resto
  del código.

## 1. Instalar Ollama y el modelo

```bash
ollama pull llama3.1
ollama serve
```

## 2. Instalar y correr el backend

```bash
cd backend
cp .env.example .env
# edita .env: pon una JARVIS_API_KEY larga
npm install
npm run dev
```

Verifica:
```bash
curl http://localhost:8080/api/health
```

## 3. Exponerlo por Tailscale

Igual que antes: Tailscale en el equipo y en el celular, misma tailnet, usa `tailscale ip -4`
para la IP que va en la app.

## Endpoints

| Método | Ruta                            | Descripción                                             |
|--------|----------------------------------|----------------------------------------------------------|
| GET    | `/api/health`                    | Estado del server y de Ollama                            |
| POST   | `/api/chat`                       | `{ messages }` → pasa por el orquestador multi-agente    |
| GET    | `/api/data/transactions`         | Lista transacciones                                       |
| POST   | `/api/data/transactions`         | Crea transacción                                           |
| DELETE | `/api/data/transactions/:id`     | Borra transacción                                           |
| GET    | `/api/data/balance`              | Saldo + flujo de caja del mes                              |
| GET    | `/api/data/credit-cards`         | Tarjetas de crédito/préstamos registrados                  |
| GET    | `/api/data/savings-goals`        | Metas de ahorro                                              |
| GET    | `/api/data/tasks`                | Lista tareas                                                |
| POST   | `/api/data/tasks`                | Crea tarea                                                  |
| PATCH  | `/api/data/tasks/:id`            | Actualiza estado de tarea                                    |
| DELETE | `/api/data/tasks/:id`            | Borra tarea                                                  |
| POST   | `/api/webhook/transaction`       | `{ text }` → extrae y registra transacción automáticamente   |
| GET    | `/api/integrations/all`          | Resumen de correos/drive/whatsapp/github (stubs)              |

Todas requieren el header `x-jarvis-key: <tu JARVIS_API_KEY>`.

## Probar el orquestador multi-agente

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -H "x-jarvis-key: TU_CLAVE" \
  -d '{"messages":[{"role":"user","content":"Registra un gasto de 45000 en mercado y dime cuánto me queda"}]}'
```
Debería usar `add_transaction` y `get_balance_and_cashflow`, y la respuesta trae `toolsUsed`
mostrando qué herramientas se llamaron — útil para el video/documento del taller.

## Probar la ingesta cero-fricción (sin automatización todavía)

```bash
curl -X POST http://localhost:8080/api/webhook/transaction \
  -H "Content-Type: application/json" \
  -H "x-jarvis-key: TU_CLAVE" \
  -d '{"text":"Bancolombia te informa compra por $85.000 en RAPPI*RESTAURANTE el 15/09/2026 con tarjeta terminada en 4521"}'
```

Para conectar esto de verdad a notificaciones reales de Android, la opción recomendada por el
taller (sin instalar nada aparte) es **NotificationListenerService** vía la librería
`react-native-android-notification-listener` en la app — pendiente de integrar. Alternativa sin
tocar código: una rutina de **Tasker/MacroDroid** que detecte notificaciones bancarias y haga un
POST a `http://<tu-ip-tailscale>:8080/api/webhook/transaction` con header `x-jarvis-key`.

## Conectar las integraciones reales (Correos, Drive, WhatsApp)

`src/routes/integrations.js` sigue con stubs documentados (`TODO`) para IMAP/Gmail API, Google
Drive API y whatsapp-web.js. Github ya funciona si defines `GITHUB_TOKEN`.

## Pendiente para cumplir 100% el taller

- [ ] Captura de voz real en la app (grabar audio) + transcripción en el backend.
- [ ] Conectar `check_emails` a un IMAP/Gmail real (hoy es un stub).
- [ ] `NotificationListenerService` en Android para disparar el webhook automáticamente.
- [ ] Migrar `src/store/db.js` de JSON a Supabase/PostgreSQL si se necesita persistencia
      compartida entre dispositivos.
- [ ] Diagrama de secuencia y esquema relacional para el documento técnico.
