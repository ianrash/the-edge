"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resetTradesToDefault, getStoredTrades } from "@/lib/trade-store";
import { useSettings, getStoredSettings, TradeSettings } from "@/lib/settings-store";
import { TradeSession } from "@/lib/types";
import { 
  User, 
  Bell, 
  Key, 
  Database, 
  Download, 
  Trash2, 
  Globe, 
  Wallet, 
  Save, 
  CheckCircle2 
} from "lucide-react";

const sessionOptions: TradeSession[] = ["London", "New York", "Asian"];

export default function SettingsPage() {
  const { saveSettings } = useSettings();
  const [settings, setSettings] = useState<TradeSettings>(() => getStoredSettings());
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Settings saved successfully");
  const [sessionCount, setSessionCount] = useState(0);

  const field = <K extends keyof TradeSettings>(key: K) => ({
    value: settings[key],
    onChange: (v: TradeSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: v }));
      setSessionCount((c) => c + 1);
    },
  });

  const handleSave = () => {
    saveSettings(settings);
    setSavedMessage("Settings saved successfully");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportData = () => {
    const trades = getStoredTrades();
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `the_edge_trades_export_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const trades = getStoredTrades();
    const headers = [
      "id",
      "symbol",
      "direction",
      "volume",
      "entryPrice",
      "exitPrice",
      "stopLoss",
      "takeProfit",
      "profit",
      "netProfit",
      "rMultiple",
      "openTime",
      "closeTime",
      "status",
      "session",
      "setup",
      "rulesFollowed",
      "emotion",
      "mistake",
      "notes",
      "postReview",
    ];
    const escape = (value: unknown) => {
      const s = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = trades.map((t) =>
      headers.map((h) => escape((t as unknown as Record<string, unknown>)[h])).join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `the_edge_trades_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (confirm("This will permanently delete ALL journal data. This action cannot be undone. Continue?")) {
      resetTradesToDefault();
      setSavedMessage("All journal data cleared");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const dirty = sessionCount > 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account, preferences, and data.
          </p>
        </div>
        {dirty && (
          <Badge variant="outline" className="border-amber-500/40 text-amber-500">
            Unsaved changes
          </Badge>
        )}
      </div>

      {/* Save Confirmation Toast */}
      {saved && (
        <div className="fixed top-6 right-6 z-50 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {savedMessage}
        </div>
      )}

      {/* Profile Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Display Name</label>
              <Input
                value={settings.displayName}
                onChange={(e) => field("displayName").onChange(e.target.value)}
                placeholder="Your name"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Used for the dashboard greeting and avatar initials.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Email Address</label>
              <Input
                value={settings.email}
                onChange={(e) => field("email").onChange(e.target.value)}
                placeholder="email@example.com"
                type="email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Preferences */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Trading Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Account Currency</label>
              <select
                value={settings.accountCurrency}
                onChange={(e) => field("accountCurrency").onChange(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg text-sm h-10 px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Risk Per Trade (%)</label>
              <Input
                type="number"
                step="0.1"
                value={settings.riskPerTrade}
                onChange={(e) => field("riskPerTrade").onChange(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Default Session</label>
              <select
                value={settings.defaultSession}
                onChange={(e) => field("defaultSession").onChange(e.target.value as TradeSession)}
                className="w-full bg-muted/30 border border-border rounded-lg text-sm h-10 px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {sessionOptions.map((s) => (
                  <option key={s} value={s}>
                    {s} Session
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Starting Balance ($)</label>
              <Input
                type="number"
                step="100"
                value={settings.startingBalance}
                onChange={(e) => field("startingBalance").onChange(Number(e.target.value) || 0)}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Balances the dashboard equity curve from this amount.
              </p>
            </div>
          </div>

          {settings.openAIApiKey && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg text-xs text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              {settings.openAIApiKey.length > 8
                ? `OpenAI API key configured (sk-…${settings.openAIApiKey.slice(-4)})`
                : "OpenAI API key configured"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
            <div>
              <span className="text-sm font-medium">Trade Reminders</span>
              <p className="text-xs text-muted-foreground mt-0.5">Get notified to log journal entries</p>
            </div>
            <button
              onClick={() => field("notifications").onChange(!settings.notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications ? "bg-primary" : "bg-muted"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
            <div>
              <span className="text-sm font-medium">Daily Review Prompt</span>
              <p className="text-xs text-muted-foreground mt-0.5">Prompt for end-of-day trade reviews</p>
            </div>
            <button
              onClick={() => field("dailyReview").onChange(!settings.dailyReview)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.dailyReview ? "bg-primary" : "bg-muted"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.dailyReview ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* API & Security */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4 text-primary" />
            API Keys & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">OpenAI API Key (for AI Trade Extraction)</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={settings.openAIApiKey}
              onChange={(e) => field("openAIApiKey").onChange(e.target.value)}
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Your API key is stored locally in this browser and never sent to our servers. Used only for screenshot analysis.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Supabase Project URL</label>
              <Input
                type="url"
                placeholder="https://your-project.supabase.co"
                value={settings.supabaseUrl}
                onChange={(e) => field("supabaseUrl").onChange(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Supabase Anon Key</label>
              <Input
                type="password"
                placeholder="eyJ..."
                value={settings.supabaseAnonKey}
                onChange={(e) => field("supabaseAnonKey").onChange(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
            <div>
              <span className="text-sm font-medium">Export Journal Data</span>
              <p className="text-xs text-muted-foreground mt-0.5">Download all trades as JSON or CSV</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportData} className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/30">
            <div>
              <span className="text-sm font-medium text-destructive">Clear All Data</span>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently delete all journal entries</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClearAll} className="gap-1.5 text-xs">
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-primary text-primary-foreground font-semibold gap-2 px-6 shadow-lg shadow-primary/20">
          <Save className="h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}