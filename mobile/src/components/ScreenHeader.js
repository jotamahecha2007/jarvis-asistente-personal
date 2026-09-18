import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, layout, typography } from "../theme/theme";

export default function ScreenHeader({ title, subtitle, onSettingsPress, accent = colors.cyan }) {
  return (
    <View style={styles.header}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: accent }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onSettingsPress ? (
        <Pressable onPress={onSettingsPress} style={[styles.settingsBtn, { borderColor: accent }]}>
          <Text style={[styles.settingsIcon, { color: accent }]}>⚙</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.padding,
    paddingTop: 50,
    paddingBottom: 8,
    gap: 10,
  },
  accentBar: { width: 3, height: 30, borderRadius: 2 },
  title: { ...typography.mono, fontSize: 22, fontWeight: "700" },
  subtitle: { ...typography.mono, color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { fontSize: 18 },
});
