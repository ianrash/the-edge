"use client";

import { useState, useEffect } from "react";
import { TradeSession } from "./types";

export interface TradeSettings {
  displayName: string;
  email: string;
  accountCurrency: string;
  riskPerTrade: string;
  defaultSession: TradeSession;
  startingBalance: number;
  notifications: boolean;
  dailyReview: boolean;
  openAIApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const DEFAULT_SETTINGS: TradeSettings = {
  displayName: "Trader",
  email: "",
  accountCurrency: "USD",
  riskPerTrade: "1.0",
  defaultSession: "London",
  startingBalance: 10000,
  notifications: true,
  dailyReview: true,
  openAIApiKey: "",
  supabaseUrl: "",
  supabaseAnonKey: "",
};

const STORAGE_KEY = "the_edge_settings_v1";

export function getStoredSettings(): TradeSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Error reading settings from localStorage:", e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TradeSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("settings-updated"));
  } catch (e) {
    console.error("Error saving settings to localStorage:", e);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<TradeSettings>(() => getStoredSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getStoredSettings());
    };

    window.addEventListener("settings-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("settings-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return { settings, saveSettings };
}