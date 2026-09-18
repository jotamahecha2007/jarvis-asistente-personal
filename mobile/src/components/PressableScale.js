import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";

/**
 * Mismo API que Pressable, pero con un pequeño "hundido" al presionar —
 * le da sensación táctil a los botones sin tocar la estructura de nada.
 */
export default function PressableScale({ style, onPressIn, onPressOut, children, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e) => {
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
    onPressIn?.(e);
  };
  const handlePressOut = (e) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
