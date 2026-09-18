export const colors = {
  background: "#050b12",
  backgroundPanel: "#08141c",
  border: "#0f3a4a",
  borderBright: "#28c9e8",
  cyan: "#2fe3ff",
  cyanDim: "#1691a8",
  cyanGlow: "rgba(47, 227, 255, 0.35)",
  amber: "#ffb027",
  success: "#2bff9e",
  danger: "#ff4655",
  purple: "#b06bff",
  pink: "#ff5fa8",
  textPrimary: "#eafcff",
  textSecondary: "#7fb8c9",
  textDim: "#3f6673",
};

// Cada pestaña tiene su propio color de acento, para que la app se sienta
// menos monocromática y cada sección tenga su propia "personalidad".
export const accents = {
  home: colors.purple,
  chat: colors.cyan,
  finance: colors.success,
  tasks: colors.amber,
};

export const typography = {
  mono: {
    fontFamily: "monospace",
    letterSpacing: 1.5,
  },
};

export const layout = {
  radius: 14,
  padding: 16,
};
