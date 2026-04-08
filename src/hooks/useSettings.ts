import { useState, useEffect } from "react";

export interface AppSettings {
  defaultMarkupPercent: number;
}

const STORAGE_KEY = "garden-settings";
const DEFAULT_SETTINGS: AppSettings = { defaultMarkupPercent: 40 };

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
}
