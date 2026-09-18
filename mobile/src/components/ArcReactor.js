import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { colors } from "../theme/theme";

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Nucleo visual estilo "arc reactor": anillos concentricos, un anillo giratorio
 * con marcas tipo radar, y un pulso de brillo. size en px.
 * status: "idle" | "listening" | "thinking" | "speaking"
 */
export default function ArcReactor({ size = 180, status = "idle" }) {
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: status === "thinking" ? 2200 : 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();
    return () => rotateLoop.stop();
  }, [status]);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: status === "listening" ? 500 : 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: status === "listening" ? 500 : 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [status]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  const statusColor =
    status === "thinking" ? colors.amber : status === "listening" ? colors.cyan : colors.cyan;

  const r = size / 2;
  const segments = 24;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: (size * 1.5) / 2,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
            backgroundColor: colors.cyanGlow,
          },
        ]}
      />
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={r} cy={r} r={r - 4} stroke={colors.border} strokeWidth={1.5} fill="none" />
        <Circle
          cx={r}
          cy={r}
          r={r - 18}
          stroke={statusColor}
          strokeWidth={1}
          fill="none"
          opacity={0.4}
        />
        <Circle cx={r} cy={r} r={r * 0.32} stroke={statusColor} strokeWidth={2} fill="#03141a" />
        <Circle cx={r} cy={r} r={r * 0.14} fill={statusColor} opacity={0.85} />

        <AnimatedG originX={r} originY={r} style={{ transform: [{ rotate: spin }] }}>
          {Array.from({ length: segments }).map((_, i) => {
            const angle = (i / segments) * 2 * Math.PI;
            const inner = r - 12;
            const outer = i % 3 === 0 ? r - 2 : r - 8;
            const x1 = r + inner * Math.cos(angle);
            const y1 = r + inner * Math.sin(angle);
            const x2 = r + outer * Math.cos(angle);
            const y2 = r + outer * Math.sin(angle);
            return (
              <Path
                key={i}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke={statusColor}
                strokeWidth={i % 3 === 0 ? 2 : 1}
                opacity={i % 3 === 0 ? 0.9 : 0.4}
              />
            );
          })}
        </AnimatedG>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute" },
});
