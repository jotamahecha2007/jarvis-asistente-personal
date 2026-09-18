# JARVIS — app (React Native, Expo SDK 57, Expo Go)

App estilo HUD/arc-reactor que habla con el backend del Mac mini
(ver carpeta `../backend`) para generar respuestas con Ollama (Gemma2:8b) y
mostrar contexto de Correos, Drive, WhatsApp y Github — igual que en el diagrama.

## Instalar y correr

```bash
cd app
npm install
npx expo start
```

Escanea el QR con la app **Expo Go** en tu Android (mismo requisito: tu celular
y el Mac mini deben estar en la misma tailnet de Tailscale para que la app
llegue al backend).

## Configurar la conexión

1. Abre la app → ícono ⚙ (Ajustes).
2. **URL del servidor**: la IP de Tailscale de tu Mac mini, ej. `http://100.101.102.103:8080`.
3. **Clave de API**: la misma `JARVIS_API_KEY` que pusiste en `backend/.env`.
4. Toca "PROBAR CONEXIÓN" — debe decir `OK · Ollama: conectado`.

## Estructura

```
App.js                        punto de entrada
src/theme/theme.js             colores/tipografía estilo Jarvis (cian sobre negro)
src/components/ArcReactor.js   núcleo animado tipo arc-reactor (SVG + Animated)
src/components/HudBackground.js  rejilla + esquinas tipo HUD
src/components/ChatBubble.js   burbujas de chat TU / JARVIS
src/context/SettingsContext.js guarda URL/clave con AsyncStorage
src/services/api.js            llamadas a /api/chat, /api/chat/stream, /api/integrations
src/screens/ChatScreen.js      pantalla principal (reactor + chat + voz)
src/screens/SettingsScreen.js  configuración y prueba de conexión
```

## Notas importantes

- **Voz**: usa `expo-speech` (funciona en Expo Go, solo texto-a-voz/TTS).
  Reconocimiento de voz (STT) requiere módulos nativos que **no** funcionan en
  Expo Go — para eso necesitarías un *development build* (`expo-dev-client` /
  EAS Build) más adelante. La app ya está lista para agregarlo sin rehacer nada.
- **Streaming**: `api.js` incluye `streamChat()` para respuestas token-a-token,
  pero la lectura de `ReadableStream` sobre `fetch` es inconsistente en algunos
  motores de React Native/Hermes dentro de Expo Go. Por eso `ChatScreen` usa por
  defecto el endpoint no-streaming (`/api/chat`), que es 100% confiable en Expo Go.
- **Navegación**: se usó un navegador propio minimalista (`SimpleNavigator.js`)
  en vez de `@react-navigation` para evitar el dolor de cabeza de sincronizar
  versiones de `react-native-screens`/`gesture-handler` con SDK 57 recién salido.
  Si más adelante agregas más pantallas, migrar a `@react-navigation/native-stack`
  es sencillo.
- Todas las dependencias listadas en `package.json` funcionan dentro de Expo Go
  (nada de módulos nativos custom fuera del set gestionado por Expo).
