import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import { colors } from "../theme/theme";

/** Fondo tipo HUD: rejilla sutil + esquinas tipo "brackets" de mira. */
export default function HudBackground({ children }) {
  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Rect x="0" y="0" width="100%" height="100%" fill={colors.background} />
        {Array.from({ length: 14 }).map((_, i) => (
          <Line
            key={`h${i}`}
            x1="0"
            y1={`${(i / 14) * 100}%`}
            x2="100%"
            y2={`${(i / 14) * 100}%`}
            stroke={colors.border}
            strokeWidth={0.5}
            opacity={0.25}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <Line
            key={`v${i}`}
            x1={`${(i / 8) * 100}%`}
            y1="0"
            x2={`${(i / 8) * 100}%`}
            y2="100%"
            stroke={colors.border}
            strokeWidth={0.5}
            opacity={0.25}
          />
        ))}
      </Svg>
      <Corner style={{ top: 8, left: 8 }} />
      <Corner style={{ top: 8, right: 8, transform: [{ rotate: "90deg" }] }} />
      <Corner style={{ bottom: 8, left: 8, transform: [{ rotate: "-90deg" }] }} />
      <Corner style={{ bottom: 8, right: 8, transform: [{ rotate: "180deg" }] }} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

function Corner({ style }) {
  return (
    <View style={[styles.corner, style]}>
      <View style={styles.cornerH} />
      <View style={styles.cornerV} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  corner: { position: "absolute", width: 22, height: 22 },
  cornerH: { position: "absolute", top: 0, left: 0, width: 22, height: 2, backgroundColor: colors.cyanDim },
  cornerV: { position: "absolute", top: 0, left: 0, width: 2, height: 22, backgroundColor: colors.cyanDim },
});
