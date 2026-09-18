import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { accents, colors, typography } from "../theme/theme";
import { haptics } from "../utils/haptics";

const TABS = [
  { key: "Home", label: "INICIO", icon: "◆", accent: accents.home },
  { key: "Chat", label: "CHAT", icon: "◉", accent: accents.chat },
  { key: "Finance", label: "FINANZAS", icon: "◈", accent: accents.finance },
  { key: "Tasks", label: "TAREAS", icon: "▤", accent: accents.tasks },
];

export default function TabBar({ active, onChange }) {
  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => { haptics.tap(); onChange(tab.key); }}>
            <Text style={[styles.icon, { color: isActive ? tab.accent : colors.textDim }]}>{tab.icon}</Text>
            <Text style={[styles.label, { color: isActive ? tab.accent : colors.textDim }]}>{tab.label}</Text>
            {isActive ? <View style={[styles.indicator, { backgroundColor: tab.accent }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundPanel,
    paddingBottom: 18,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  icon: { fontSize: 18, marginBottom: 2 },
  label: { ...typography.mono, fontSize: 9 },
  indicator: {
    position: "absolute",
    top: -8,
    width: 26,
    height: 2,
    borderRadius: 1,
  },
});
