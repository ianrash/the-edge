"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileImage, Loader2, Edit3, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { addMultipleTrades } from "@/lib/trade-store";
import { Trade, TradeDirection, TradeSession } from "@/lib/types";

interface ExtractedRow {
  id: string;
  selected: boolean;
  symbol: string;
  direction: TradeDirection;
  volume: number;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  date: string;
  session: TradeSession;
  confidence: number;
  needsReview: boolean;
}

// Simulated AI extraction results
const SIMULATED_RESULTS: ExtractedRow[] = [
  {
    id: "ext-1",
    selected: true,
    symbol: "EURUSD",
    direction: "BUY",
    volume: 0.02,
    entryPrice: 1.1652,
    exitPrice: 1.1664,
    profit: 24.00,
    date: new Date().toISOString(),
    session: "London",
    confidence: 0.96,
    needsReview: false
  },
  {
    id: "ext-2",
    selected: true,
    symbol: "GBPUSD",
    direction: "SELL",
    volume: 0.03,
    entryPrice: 1.3540,
    exitPrice: 1.3528,
    profit: 36.00,
    date: new Date().toISOString(),
    session: "London",
    confidence: 0.94,
    needsReview: false
  },
  {
    id: "ext-3",
    selected: true,
    symbol: "XAUUSD",
    direction: "BUY",
    volume: 0.01,
    entryPrice: 2491.00,
    exitPrice: 2495.50,
    profit: 45.00,
    date: new Date().toISOString(),
    session: "New York",
    confidence: 0.72,
    needsReview: true
  },
  {
    id: "ext-4",
    selected: true,
    symbol: "NAS100",
    direction: "SELL",
    volume: 0.1,
    entryPrice: 19520.00,
    exitPrice: 19580.00,
    profit: -60.00,
    date: new Date().toISOString(),
    session: "New York",
    confidence: 0.88,
    needsReview: false
  }
];

export default function ImportTradesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"IDLE" | "ANALYZING" | "REVIEW" | "SAVED">("IDLE");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [extractedTrades, setExtractedTrades] = useState<ExtractedRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const analysisSteps = [
    "Uploading image",
    "Detecting trading platform",
    "Reading trade history",
    "Extracting trade data",
    "Validating trades",
    "Preparing journal entries"
  ];

  const startAnalysis = async () => {
    if (!file) return;
    setStep("ANALYZING");
    setAnalysisStep(0);

    // Simulate progressive AI analysis steps
    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 700));
      setAnalysisStep(i + 1);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    setExtractedTrades(SIMULATED_RESULTS.map(r => ({ ...r })));
    setStep("REVIEW");
  };

  const toggleRow = (id: string) => {
    setExtractedTrades(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const updateField = (id: string, field: keyof ExtractedRow, value: string | number) => {
    setExtractedTrades(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, [field]: value, needsReview: false };
    }));
  };

  const handleConfirmAndSave = () => {
    const selected = extractedTrades.filter(r => r.selected);
    if (selected.length === 0) return;

    const toSave = selected.map((r): Omit<Trade, "id"> => ({
      symbol: r.symbol,
      direction: r.direction,
      volume: r.volume,
      entryPrice: r.entryPrice,
      exitPrice: r.exitPrice,
      profit: r.profit,
      netProfit: r.profit - 4,
      commission: -4,
      swap: 0,
      rMultiple: r.profit > 0 ? 2.0 : r.profit < 0 ? -1.0 : 0,
      openTime: r.date,
      closeTime: r.date,
      status: "CLOSED",
      session: r.session,
      setup: "AI Imported",
      rulesFollowed: true,
      emotion: "Disciplined",
      mistake: "None",
      notes: `Imported via AI screenshot analysis. Confidence: ${(r.confidence * 100).toFixed(0)}%`,
      confidence: r.confidence
    }));

    addMultipleTrades(toSave);
    setSavedCount(toSave.length);
    setStep("SAVED");
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setStep("IDLE");
    setAnalysisStep(0);
    setExtractedTrades([]);
    setEditingId(null);
    setSavedCount(0);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Trades</h1>
        <p className="text-muted-foreground mt-2">
          Upload a screenshot of your trading history and let AI do the journaling.
        </p>
      </div>

      {/* IDLE STATE - Upload Area */}
      {step === "IDLE" && (
        <Card className="bg-card border-dashed border-2 border-border mt-8">
          <CardContent 
            className="flex flex-col items-center justify-center py-24"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <div className="rounded-full bg-muted/50 p-6 mb-4">
              <UploadCloud className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drop your trading history screenshot here</h3>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              Support for MT5, MT4, TradingView, Exness, Deriv, XM and others. <br />
              (PNG, JPG, JPEG, WEBP)
            </p>
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
              <Button 
                size="lg" 
                className="font-semibold text-primary-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
            {file && (
              <div className="mt-8 flex items-center gap-4 bg-muted/30 p-4 rounded-md border border-border w-full max-w-md">
                {preview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview} alt="Preview" className="h-12 w-16 object-cover rounded border border-border" />
                ) : (
                  <FileImage className="h-8 w-8 text-primary shrink-0" />
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button onClick={startAnalysis} className="font-semibold">Analyze</Button>
              </div>
            )}

            {/* Supported platforms */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {["MT5", "MT4", "TradingView", "Exness", "Deriv", "XM"].map(p => (
                <span key={p} className="text-xs text-muted-foreground bg-muted/30 border border-border px-3 py-1 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ANALYZING STATE */}
      {step === "ANALYZING" && (
        <Card className="bg-card mt-8">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-6" />
            <h3 className="text-2xl font-bold mb-8">Analyzing screenshot...</h3>
            
            {preview && (
              <div className="mb-8 rounded-xl border border-border overflow-hidden max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Uploaded" className="w-full h-auto max-h-40 object-cover" />
              </div>
            )}

            <div className="w-full max-w-md space-y-4">
              {analysisSteps.map((s, i) => {
                const done = analysisStep > i;
                const active = analysisStep === i;
                return (
                  <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${
                    done ? "text-muted-foreground" : active ? "text-foreground font-medium" : "text-muted-foreground opacity-40"
                  }`}>
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
                    )}
                    <span>{s}</span>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md mt-8">
              <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(analysisStep / analysisSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* REVIEW STATE */}
      {step === "REVIEW" && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">Review Detected Trades</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {extractedTrades.filter(r => r.selected).length} of {extractedTrades.length} trades selected for import
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetAll}>Cancel</Button>
              <Button 
                className="font-semibold bg-primary text-primary-foreground" 
                onClick={handleConfirmAndSave}
                disabled={extractedTrades.filter(r => r.selected).length === 0}
              >
                Confirm & Save ({extractedTrades.filter(r => r.selected).length})
              </Button>
            </div>
          </div>

          {/* Screenshot preview */}
          {preview && (
            <div className="mb-6 rounded-xl border border-border overflow-hidden bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Source" className="w-full h-auto max-h-48 object-contain" />
            </div>
          )}
          
          <Card className="bg-card overflow-hidden border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-5 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={extractedTrades.every(r => r.selected)}
                          onChange={(e) => {
                            setExtractedTrades(prev => prev.map(r => ({ ...r, selected: e.target.checked })));
                          }}
                          className="accent-primary"
                        />
                      </th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Pair</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Lots</th>
                      <th className="px-5 py-4">Entry</th>
                      <th className="px-5 py-4">Exit</th>
                      <th className="px-5 py-4 text-right">P&L</th>
                      <th className="px-5 py-4">Confidence</th>
                      <th className="px-5 py-4 w-12">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedTrades.map((row) => {
                      const isEditing = editingId === row.id;
                      return (
                        <tr key={row.id} className={`border-b border-border transition-colors ${
                          row.needsReview ? "bg-amber-500/5" : "bg-background"
                        } hover:bg-muted/30`}>
                          {/* Checkbox */}
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => toggleRow(row.id)}
                              className="accent-primary"
                            />
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            {row.needsReview ? (
                              <div className="flex items-center gap-1.5 text-amber-500">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Review</span>
                              </div>
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </td>

                          {/* Pair */}
                          <td className="px-5 py-4">
                            {isEditing ? (
                              <Input
                                value={row.symbol}
                                onChange={(e) => updateField(row.id, "symbol", e.target.value.toUpperCase())}
                                className="font-mono font-bold h-8 w-24"
                              />
                            ) : (
                              <span className="font-bold font-mono">{row.symbol}</span>
                            )}
                          </td>

                          {/* Type */}
                          <td className="px-5 py-4">
                            {isEditing ? (
                              <select
                                value={row.direction}
                                onChange={(e) => updateField(row.id, "direction", e.target.value)}
                                className="bg-muted/40 border border-border rounded text-xs h-8 px-2"
                              >
                                <option value="BUY">BUY</option>
                                <option value="SELL">SELL</option>
                              </select>
                            ) : (
                              <span className={`font-mono text-xs font-bold ${row.direction === "BUY" ? "text-primary" : "text-destructive"}`}>
                                {row.direction}
                              </span>
                            )}
                          </td>

                          {/* Lots */}
                          <td className="px-5 py-4">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={row.volume}
                                onChange={(e) => updateField(row.id, "volume", parseFloat(e.target.value) || 0)}
                                className="font-mono h-8 w-20"
                              />
                            ) : (
                              <span className="font-mono">{row.volume}</span>
                            )}
                          </td>

                          {/* Entry */}
                          <td className="px-5 py-4">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="any"
                                value={row.entryPrice}
                                onChange={(e) => updateField(row.id, "entryPrice", parseFloat(e.target.value) || 0)}
                                className="font-mono h-8 w-28"
                              />
                            ) : (
                              <span className={`font-mono ${row.needsReview ? "bg-amber-500/10 border border-amber-500/50 rounded px-2 py-0.5 text-amber-500" : ""}`}>
                                {row.entryPrice}
                              </span>
                            )}
                          </td>

                          {/* Exit */}
                          <td className="px-5 py-4">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="any"
                                value={row.exitPrice}
                                onChange={(e) => updateField(row.id, "exitPrice", parseFloat(e.target.value) || 0)}
                                className="font-mono h-8 w-28"
                              />
                            ) : (
                              <span className="font-mono">{row.exitPrice}</span>
                            )}
                          </td>

                          {/* P&L */}
                          <td className="px-5 py-4 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="any"
                                value={row.profit}
                                onChange={(e) => updateField(row.id, "profit", parseFloat(e.target.value) || 0)}
                                className="font-mono h-8 w-24 ml-auto"
                              />
                            ) : (
                              <span className={`font-mono font-bold ${row.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                                {row.profit >= 0 ? `+$${row.profit.toFixed(2)}` : `-$${Math.abs(row.profit).toFixed(2)}`}
                              </span>
                            )}
                          </td>

                          {/* Confidence */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${row.confidence >= 0.85 ? "bg-primary" : row.confidence >= 0.7 ? "bg-amber-500" : "bg-destructive"}`}
                                  style={{ width: `${row.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">
                                {(row.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>

                          {/* Edit */}
                          <td className="px-5 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(isEditing ? null : row.id)}
                              className="h-7 w-7 p-0"
                            >
                              {isEditing ? <Save className="h-3.5 w-3.5 text-primary" /> : <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SAVED STATE */}
      {step === "SAVED" && (
        <Card className="bg-card mt-8">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <div className="p-6 bg-primary/10 rounded-full mb-6 border border-primary/30">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Trades Imported Successfully!</h3>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              {savedCount} trades have been saved to your journal. They will appear on your Dashboard, Calendar, and Analytics pages automatically.
            </p>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={resetAll}>Import More</Button>
              <Link href="/journal" className={cn(buttonVariants(), "font-semibold")}>
                View in Journal
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
