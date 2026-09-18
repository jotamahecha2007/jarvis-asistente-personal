import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import HudBackground from "../components/HudBackground";
import { colors, layout, typography } from "../theme/theme";
import { useSettings } from "../context/SettingsContext";
import { haptics } from "../utils/haptics";
import { checkHealth, getIntegrationsSummary } from "../services/api";

export default function SettingsScreen({ navigation }) {
  const { settings, update } = useSettings();
  const [serverUrl, setServerUrl] = useState(settings.serverUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [status, setStatus] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [checking, setChecking] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await update({ serverUrl: serverUrl.trim(), apiKey: apiKey.trim() });
    haptics.tap();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Autoguardado: apenas el usuario deja de escribir 600ms, se persiste solo,
  // asi no depende de acordarse de tocar GUARDAR.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (serverUrl.trim() !== settings.serverUrl || apiKey.trim() !== settings.apiKey) {
        save();
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, apiKey]);

  const testConnection = async () => {
    setChecking(true);
    setStatus(null);
    try {
      const health = await checkHealth(serverUrl.trim());
      setStatus({ ok: true, health });
      haptics.success();
    } catch (err) {
      setStatus({ ok: false, error: err.message });
      haptics.error();
    } finally {
      setChecking(false);
    }
  };

  const loadIntegrations = async () => {
    try {
      const data = await getIntegrationsSummary({ serverUrl: settings.serverUrl, apiKey: settings.apiKey });
      setIntegrations(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <HudBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ VOLVER</Text>
          </Pressable>
          <Text style={styles.title}>AJUSTES</Text>
        </View>

        <Text style={styles.label}>URL del servidor (Tailscale)</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://100.x.x.x:8080"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Clave de API (x-jarvis-key)</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="tu-jarvis-api-key"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <View style={styles.row}>
          <Text style={styles.label}>Respuesta por voz</Text>
          <Switch
            value={settings.voiceEnabled}
            onValueChange={(v) => update({ voiceEnabled: v })}
            thumbColor={colors.cyan}
            trackColor={{ true: colors.cyanDim, false: colors.border }}
          />
        </View>

        <Pressable style={styles.primaryBtn} onPress={save}>
          <Text style={styles.primaryBtnText}>{saved ? "GUARDADO ✓" : "GUARDAR"}</Text>
        </Pressable>
        <Text style={styles.autosaveHint}>Los cambios también se guardan solos al dejar de escribir.</Text>

        <Pressable style={styles.secondaryBtn} onPress={testConnection} disabled={checking}>
          <Text style={styles.secondaryBtnText}>
            {checking ? "PROBANDO..." : "PROBAR CONEXIÓN"}
          </Text>
        </Pressable>

        {status ? (
          <View style={[styles.statusBox, { borderColor: status.ok ? colors.cyan : colors.danger }]}>
            <Text style={{ color: status.ok ? colors.cyan : colors.danger, ...typography.mono, fontSize: 12 }}>
              {status.ok
                ? `OK · Ollama: ${status.health.ollama.ok ? "conectado" : "no disponible"}`
                : `ERROR: ${status.error}`}
            </Text>
          </View>
        ) : null}

        <Pressable style={styles.secondaryBtn} onPress={loadIntegrations}>
          <Text style={styles.secondaryBtnText}>VER FUENTES (CORREOS · DRIVE · WHATSAPP · GITHUB)</Text>
        </Pressable>

        {integrations ? (
          <View style={styles.integrationsBox}>
            {Object.entries(integrations).map(([key, val]) => (
              <Text key={key} style={styles.integrationLine}>
                • {key.toUpperCase()}: {val.items?.length ?? 0} elemento(s) {val.note ? `— ${val.note}` : ""}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.padding, paddingTop: 50, paddingBottom: 60 },
  headerRow: { marginBottom: 24 },
  back: { color: colors.cyan, ...typography.mono, fontSize: 13, marginBottom: 10 },
  title: { color: colors.textPrimary, ...typography.mono, fontSize: 22, fontWeight: "700" },
  label: { color: colors.textSecondary, ...typography.mono, fontSize: 11, marginTop: 18, marginBottom: 6 },
  input: {
    backgroundColor: colors.backgroundPanel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    ...typography.mono,
    fontSize: 14,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18 },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: colors.cyan,
    borderRadius: layout.radius,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.background, ...typography.mono, fontWeight: "700" },
  autosaveHint: { color: colors.textDim, ...typography.mono, fontSize: 10, marginTop: 6, textAlign: "center" },
  secondaryBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: layout.radius,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.cyan, ...typography.mono, fontSize: 12 },
  statusBox: { marginTop: 14, borderWidth: 1, borderRadius: 10, padding: 10 },
  integrationsBox: { marginTop: 14, gap: 6 },
  integrationLine: { color: colors.textSecondary, ...typography.mono, fontSize: 11 },
});
