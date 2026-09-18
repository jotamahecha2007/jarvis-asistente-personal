import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "jarvis_settings_v1";

const SettingsContext = createContext(null);

const defaultSettings = {
  // IP de Tailscale del Mac mini, ej: "http://100.101.102.103:8080"
  serverUrl: "http://100.100.100.100:8080",
  apiKey: "",
  voiceEnabled: true,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(raw) });
        } catch {
          // ignora JSON invalido
        }
      }
      setLoaded(true);
    });
  }, []);

  const update = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <SettingsContext.Provider value={{ settings, update, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings debe usarse dentro de SettingsProvider");
  return ctx;
}
