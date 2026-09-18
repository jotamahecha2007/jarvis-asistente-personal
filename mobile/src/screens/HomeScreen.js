import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ArcReactor from "../components/ArcReactor";
import HudBackground from "../components/HudBackground";
import PressableScale from "../components/PressableScale";
import { accents, colors, layout, typography } from "../theme/theme";
import { useSettings } from "../context/SettingsContext";
import { haptics } from "../utils/haptics";
import { getBalance, getTasks } from "../services/api";

const QUIPS = [
  "Todos los sistemas operando dentro de parámetros normales.",
  "Listo para lo que necesite, cuando quiera.",
  "He estado vigilando sus finanzas mientras no miraba.",
  "Un día más al servicio de sus objetivos.",
  "Diagnóstico completo: todo en orden.",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function HomeScreen({ navigation, goToTab }) {
  const { settings } = useSettings();
  const [balance, setBalance] = useState(null);
  const [pendingTasks, setPendingTasks] = useState(null);
  const [error, setError] = useState(null);
  const [quip] = useState(QUIPS[Math.floor(Math.random() * QUIPS.length)]);

  const load = useCallback(async () => {
    try {
      const [bal, tasks] = await Promise.all([
        getBalance({ serverUrl: settings.serverUrl, apiKey: settings.apiKey }),
        getTasks({ serverUrl: settings.serverUrl, apiKey: settings.apiKey }),
      ]);
      setBalance(bal.balance);
      setPendingTasks((tasks.items || []).filter((t) => t.status !== "completado").length);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [settings.serverUrl, settings.apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  const go = (tab) => {
    haptics.tap();
    goToTab(tab);
  };

  return (
    <HudBackground>
      <ScrollView contentContainerStyle={styles.content} refreshControl={undefined}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting()}, señor.</Text>
            <Text style={styles.quip}>{quip}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate("Settings")} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.reactorWrap}>
          <ArcReactor size={150} status="idle" />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ No pude conectar con el servidor: {error}</Text>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <PressableScale style={[styles.statCard, { borderColor: accents.finance }]} onPress={() => go("Finance")}>
              <Text style={styles.statLabel}>SALDO</Text>
              <Text style={[styles.statValue, { color: accents.finance }]}>
                {balance == null
                  ? "···"
                  : balance.toLocaleString(undefined, { style: "currency", currency: "USD" })}
              </Text>
            </PressableScale>
            <PressableScale style={[styles.statCard, { borderColor: accents.tasks }]} onPress={() => go("Tasks")}>
              <Text style={styles.statLabel}>PENDIENTES</Text>
              <Text style={[styles.statValue, { color: accents.tasks }]}>
                {pendingTasks == null ? "···" : pendingTasks}
              </Text>
            </PressableScale>
          </View>
        )}

        <Text style={styles.sectionTitle}>ACCESOS RÁPIDOS</Text>
        <View style={styles.quickRow}>
          <QuickButton label="Hablar con JARVIS" icon="◉" accent={accents.chat} onPress={() => go("Chat")} />
          <QuickButton label="Registrar gasto" icon="◈" accent={accents.finance} onPress={() => go("Finance")} />
          <QuickButton label="Nueva tarea" icon="▤" accent={accents.tasks} onPress={() => go("Tasks")} />
        </View>
      </ScrollView>
    </HudBackground>
  );
}

function QuickButton({ label, icon, accent, onPress }) {
  return (
    <PressableScale style={[styles.quickBtn, { borderColor: accent }]} onPress={onPress}>
      <Text style={[styles.quickIcon, { color: accent }]}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.padding, paddingTop: 50, paddingBottom: 30 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { ...typography.mono, color: accents.home, fontSize: 20, fontWeight: "700" },
  quip: { ...typography.mono, color: colors.textSecondary, fontSize: 11, marginTop: 4, maxWidth: 230 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { color: accents.home, fontSize: 18 },
  reactorWrap: { alignItems: "center", marginVertical: 16 },
  errorBox: {
    backgroundColor: "rgba(255,70,85,0.1)",
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  errorText: { color: colors.danger, ...typography.mono, fontSize: 11 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: layout.radius,
    padding: 14,
    backgroundColor: colors.backgroundPanel,
    alignItems: "center",
  },
  statLabel: { ...typography.mono, color: colors.textSecondary, fontSize: 10 },
  statValue: { ...typography.mono, fontSize: 20, fontWeight: "700", marginTop: 4 },
  sectionTitle: { ...typography.mono, color: colors.textDim, fontSize: 11, marginBottom: 10 },
  quickRow: { gap: 10 },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: layout.radius,
    padding: 14,
    backgroundColor: colors.backgroundPanel,
  },
  quickIcon: { fontSize: 18 },
  quickLabel: { ...typography.mono, color: colors.textPrimary, fontSize: 13 },
});
