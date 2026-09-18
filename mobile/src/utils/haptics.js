import * as Haptics from "expo-haptics";

async function safe(fn) {
  try {
    await fn();
  } catch {
    // dispositivos sin vibración (emuladores, web) simplemente no hacen nada
  }
}

export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
