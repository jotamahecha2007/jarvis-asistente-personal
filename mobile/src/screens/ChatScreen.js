import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import ArcReactor from "../components/ArcReactor";
import ChatBubble from "../components/ChatBubble";
import HudBackground from "../components/HudBackground";
import PressableScale from "../components/PressableScale";
import { accents, colors, layout, typography } from "../theme/theme";
import { useSettings } from "../context/SettingsContext";
import { haptics } from "../utils/haptics";
import { sendChat, transcribeAndChat } from "../services/api";

const GREETING = {
  role: "assistant",
  content: "En línea. Puede escribirme o pulsar el micrófono y hablarme, señor.",
};

export default function ChatScreen({ navigation }) {
  const { settings } = useSettings();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | recording | thinking | speaking
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const inputValueRef = useRef("");
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const speak = (text) => {
    if (!settings.voiceEnabled) return;
    setStatus("speaking");
    Speech.speak(text, {
      language: "es-ES",
      onDone: () => setStatus("idle"),
      onStopped: () => setStatus("idle"),
      onError: () => setStatus("idle"),
    });
  };

  const appendAssistant = (nextMessages, content, toolsUsed) => {
    const updated = [...nextMessages, { role: "assistant", content, toolsUsed }];
    setMessages(updated);
    speak(content);
    if (status !== "speaking") setStatus("idle");
  };

  const send = async () => {
    const trimmed = inputValueRef.current.trim();
    if (!trimmed || status === "thinking") return;

    haptics.tap();
    setError(null);
    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    inputValueRef.current = "";
    setInput("");
    setStatus("thinking");

    try {
      const reply = await sendChat({
        serverUrl: settings.serverUrl,
        apiKey: settings.apiKey,
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
      });
      appendAssistant(nextMessages, reply.content, reply.toolsUsed);
    } catch (err) {
      setError(err.message);
      haptics.error();
      setStatus("idle");
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError("Necesito permiso de micrófono para escucharte.");
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });

      // Si quedó una grabación "a medio preparar" de un intento anterior (por un
      // error, por ejemplo), prepareToRecordAsync() rechaza. La liberamos primero,
      // ignorando el error si no había ninguna activa.
      try {
        await audioRecorder.stop();
      } catch {
        // no había nada que detener, sigue normal
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      haptics.tap();
      setStatus("recording");
    } catch (err) {
      setError(
        `No pude activar el micrófono (${err.message}). Cierra otras apps que puedan estar usándolo e intenta de nuevo.`
      );
      haptics.error();
      setStatus("idle");
    }
  };

  const stopRecordingAndSend = async () => {
    haptics.tap();
    setStatus("thinking");

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) throw new Error("No se generó el archivo de audio.");
      const extension = uri.split(".").pop() || "m4a";
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await transcribeAndChat({
        serverUrl: settings.serverUrl,
        apiKey: settings.apiKey,
        audioBase64,
        extension,
        history: messages.map(({ role, content }) => ({ role, content })),
      });

      if (!result.transcript) {
        setError("No detecté ninguna voz en la grabación. Intenta de nuevo.");
        setStatus("idle");
        return;
      }

      const nextMessages = [...messages, { role: "user", content: result.transcript }];
      setMessages(nextMessages);
      appendAssistant(nextMessages, result.reply, result.toolsUsed);
    } catch (err) {
      setError(err.message);
      haptics.error();
      setStatus("idle");
    }
  };

  const onMicPress = () => {
    if (status === "recording") {
      stopRecordingAndSend();
    } else if (status === "idle") {
      startRecording();
    }
  };

  return (
    <HudBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>J.A.R.V.I.S.</Text>
            <Text style={styles.subtitle}>
              {status === "recording"
                ? "ESCUCHANDO..."
                : status === "thinking"
                ? "PROCESANDO..."
                : status === "speaking"
                ? "RESPONDIENDO..."
                : "SISTEMA EN LÍNEA"}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate("Settings")} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.reactorWrap}>
          <ArcReactor size={130} status={status === "recording" ? "listening" : status} />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <ChatBubble role={item.role} content={item.content} toolsUsed={item.toolsUsed} />
          )}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputRow}>
          <PressableScale
            style={[styles.micBtn, status === "recording" && styles.micBtnActive]}
            onPress={onMicPress}
            disabled={status === "thinking" || status === "speaking"}
          >
            <Text style={styles.micIcon}>{status === "recording" ? "■" : "🎙"}</Text>
          </PressableScale>
          <TextInput
            style={styles.input}
            placeholder="Escribe una orden..."
            placeholderTextColor={colors.textDim}
            value={input}
            onChangeText={(text) => {
              inputValueRef.current = text;
              setInput(text);
            }}
            multiline
            textAlignVertical="top"
          />
          <PressableScale style={styles.sendBtn} onPress={send} disabled={status === "thinking"}>
            {status === "thinking" ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.sendText}>➤</Text>
            )}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.padding,
    paddingTop: 50,
  },
  title: { ...typography.mono, color: accents.chat, fontSize: 22, fontWeight: "700" },
  subtitle: { ...typography.mono, color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { color: accents.chat, fontSize: 18 },
  reactorWrap: { alignItems: "center", marginVertical: 8 },
  errorBox: {
    marginHorizontal: layout.padding,
    backgroundColor: "rgba(255,70,85,0.1)",
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },
  errorText: { color: colors.danger, ...typography.mono, fontSize: 12 },
  listContent: { paddingHorizontal: layout.padding, paddingBottom: 10, flexGrow: 1 },
  inputRow: {
    flexDirection: "row",
    padding: layout.padding,
    gap: 8,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: accents.chat,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  micIcon: { fontSize: 18 },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundPanel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    ...typography.mono,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 150,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: accents.chat,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: colors.background, fontSize: 18, fontWeight: "700" },
});
