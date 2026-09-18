import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { colors, layout, typography } from "../theme/theme";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const showToast = useCallback(
    (message, tone = "success") => {
      setToast({ message, tone });
      if (timerRef.current) clearTimeout(timerRef.current);

      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
          setToast(null)
        );
      }, 1800);
    },
    [opacity]
  );

  const toneColor =
    toast?.tone === "error" ? colors.danger : toast?.tone === "warning" ? colors.amber : colors.success;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrap, { opacity, borderColor: toneColor }]}
        >
          <Text style={[styles.dot, { color: toneColor }]}>●</Text>
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.backgroundPanel,
    borderWidth: 1,
    borderRadius: layout.radius,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  dot: { fontSize: 10 },
  text: { ...typography.mono, color: colors.textPrimary, fontSize: 12 },
});
