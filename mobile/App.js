import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ArcReactor from "./src/components/ArcReactor";
import HudBackground from "./src/components/HudBackground";
import { SettingsProvider, useSettings } from "./src/context/SettingsContext";
import { ToastProvider } from "./src/context/ToastContext";
import SimpleNavigator from "./src/navigation/SimpleNavigator";
import MainTabs from "./src/navigation/MainTabs";
import SettingsScreen from "./src/screens/SettingsScreen";
import { colors, typography } from "./src/theme/theme";

function AppShell() {
  const { loaded } = useSettings();

  if (!loaded) {
    // Evita el "parpadeo" inicial mostrando valores por defecto antes de
    // terminar de leer la configuración guardada del teléfono.
    return (
      <HudBackground>
        <View style={styles.splash}>
          <ArcReactor size={120} status="thinking" />
          <Text style={styles.splashText}>INICIANDO SISTEMAS...</Text>
        </View>
      </HudBackground>
    );
  }

  return (
    <SimpleNavigator initialRoute="Main" screens={{ Main: MainTabs, Settings: SettingsScreen }} />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <AppShell />
        </ToastProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  splashText: { ...typography.mono, color: colors.textSecondary, fontSize: 12, letterSpacing: 3 },
});
