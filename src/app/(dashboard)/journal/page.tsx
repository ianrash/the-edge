"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Sparkles, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  Target, 
  ShieldCheck, 
  Image as ImageIcon,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileEdit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTrades, calculateStats } from "@/lib/trade-store";
import { getStoredSettings } from "@/lib/settings-store";
import { Trade, TradeDirection, TradeSession, TradeEmotion, TradeMistake } from "@/lib/types";
import { getEdgeInsights } from "@/lib/trading-insights";

export default function JournalPage() {
  const { trades, addTrade, updateTrade, deleteTrade } = useTrades();

  const insights = useMemo(() => getEdgeInsights(trades), [trades]);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<"ALL" | "WIN" | "LOSS" | "BE">("ALL");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [sessionFilter, setSessionFilter] = useState<"ALL" | TradeSession>("ALL");
  const [setupFilter] = useState<string>("ALL");
  const [rulesOnlyFilter, setRulesOnlyFilter] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards" | "daily">("table");

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // New Trade Form State
  const [newSymbol, setNewSymbol] = useState("XAUUSD");
  const [newDirection, setNewDirection] = useState<TradeDirection>("BUY");
  const [newVolume, setNewVolume] = useState("0.5");
  const [newEntryPrice, setNewEntryPrice] = useState("2490.00");
  const [newExitPrice, setNewExitPrice] = useState("2512.50");
  const [newStopLoss, setNewStopLoss] = useState("2482.00");
  const [newTakeProfit, setNewTakeProfit] = useState("2515.00");
  const [newProfit, setNewProfit] = useState("1125.00");
  const [newSession, setNewSession] = useState<TradeSession>(
    () => getStoredSettings().defaultSession,
  );
  const [newSetup, setNewSetup] = useState("Fair Value Gap");
  const [newCustomSetup, setNewCustomSetup] = useState("");
  const [newRulesFollowed, setNewRulesFollowed] = useState(true);
  const [newEmotion, setNewEmotion] = useState<TradeEmotion>("Disciplined");
  const [newMistake, setNewMistake] = useState<TradeMistake>("None");
  const [newNotes, setNewNotes] = useState("");
  const [newPostReview, setNewPostReview] = useState("");
  const [newScreenshotUrl, setNewScreenshotUrl] = useState("");

  // Edit Note in Detail Modal
  const [editNotes, setEditNotes] = useState("");
  const [editPostReview, setEditPostReview] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Quick pairs
  const popularPairs = ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD", "US30", "NAS100"];
  const standardSetups = [
    "Fair Value Gap", 
    "Order Block", 
    "Turtle Soup", 
    "Liquidity Sweep", 
    "Break & Retest", 
    "Trend Continuation",
    "Silver Bullet"
  ];

  // Dynamic R Multiple calculation for New Trade form
  const calculatedR = useMemo(() => {
    const entry = parseFloat(newEntryPrice);
    const exit = parseFloat(newExitPrice);
    const sl = parseFloat(newStopLoss);
    if (!isNaN(entry) && !isNaN(exit) && !isNaN(sl) && entry !== sl) {
      const risk = Math.abs(entry - sl);
      const reward = newDirection === "BUY" ? exit - entry : entry - exit;
      return (reward / risk).toFixed(2);
    }
    return "0.00";
  }, [newEntryPrice, newExitPrice, newStopLoss, newDirection]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSym = t.symbol.toLowerCase().includes(q);
        const matchesSetup = t.setup.toLowerCase().includes(q);
        const matchesNotes = (t.notes || "").toLowerCase().includes(q);
        if (!matchesSym && !matchesSetup && !matchesNotes) return false;
      }

      // Outcome
      const pnl = t.netProfit ?? t.profit;
      if (outcomeFilter === "WIN" && pnl <= 0) return false;
      if (outcomeFilter === "LOSS" && pnl >= 0) return false;
      if (outcomeFilter === "BE" && pnl !== 0) return false;

      // Direction
      if (directionFilter !== "ALL" && t.direction !== directionFilter) return false;

      // Session
      if (sessionFilter !== "ALL" && t.session !== sessionFilter) return false;

      // Setup
      if (setupFilter !== "ALL" && t.setup !== setupFilter) return false;

      // Rules Only
      if (rulesOnlyFilter && !t.rulesFollowed) return false;

      return true;
    });
  }, [trades, search, outcomeFilter, directionFilter, sessionFilter, setupFilter, rulesOnlyFilter]);

  // Stats for the currently filtered set
  const filteredStats = useMemo(() => calculateStats(filteredTrades), [filteredTrades]);

  // Group trades by date for Daily View
  const dailyGroups = useMemo(() => {
    const groups: Record<string, Trade[]> = {};
    filteredTrades.forEach((t) => {
      const dateKey = new Date(t.openTime).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).map(([date, items]) => {
      const dayNet = items.reduce((acc, curr) => acc + (curr.netProfit ?? curr.profit), 0);
      const dayR = items.reduce((acc, curr) => acc + (curr.rMultiple || 0), 0);
      const wins = items.filter((i) => (i.netProfit ?? i.profit) > 0).length;
      return {
        date,
        trades: items,
        dayNet,
        dayR,
        winRate: Math.round((wins / items.length) * 100)
      };
    });
  }, [filteredTrades]);

  // Handle Create Trade
  const handleCreateTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSetup = newCustomSetup.trim() ? newCustomSetup.trim() : newSetup;
    const profitVal = parseFloat(newProfit) || 0;
    const rVal = parseFloat(calculatedR) || (profitVal > 0 ? 2.0 : -1.0);

    addTrade({
      symbol: newSymbol.toUpperCase(),
      direction: newDirection,
      volume: parseFloat(newVolume) || 0.1,
      entryPrice: parseFloat(newEntryPrice) || 0,
      exitPrice: parseFloat(newExitPrice) || 0,
      stopLoss: parseFloat(newStopLoss) || undefined,
      takeProfit: parseFloat(newTakeProfit) || undefined,
      profit: profitVal,
      netProfit: profitVal - 4, // estimate commission
      commission: -4,
      swap: 0,
      rMultiple: rVal,
      openTime: new Date().toISOString(),
      closeTime: new Date().toISOString(),
      status: "CLOSED",
      session: newSession,
      setup: finalSetup,
      rulesFollowed: newRulesFollowed,
      emotion: newEmotion,
      mistake: newMistake,
      notes: newNotes,
      postReview: newPostReview,
      screenshotUrl: newScreenshotUrl.trim() || undefined
    });

    setIsLogModalOpen(false);
    // Reset form
    setNewNotes("");
    setNewPostReview("");
    setNewCustomSetup("");
  };

  const handleOpenDetail = (trade: Trade) => {
    setSelectedTrade(trade);
    setEditNotes(trade.notes || "");
    setEditPostReview(trade.postReview || "");
    setIsEditingNotes(false);
    setIsDetailModalOpen(true);
  };

  const handleSaveNotes = () => {
    if (!selectedTrade) return;
    const updated = updateTrade(selectedTrade.id, {
      notes: editNotes,
      postReview: editPostReview
    });
    if (updated) setSelectedTrade(updated);
    setIsEditingNotes(false);
  };

  const handleDeleteCurrentTrade = () => {
    if (!selectedTrade) return;
    if (confirm("Are you sure you want to delete this trade from your journal?")) {
      deleteTrade(selectedTrade.id);
      setIsDetailModalOpen(false);
      setSelectedTrade(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs">
              {trades.length} Logs
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Review detailed trade executions, psychological notes, and track your true trading edge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsAiCoachOpen(true)}
            className="border-primary/30 hover:border-primary/60 text-primary bg-primary/5 gap-2"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI Trading Coach</span>
          </Button>

          <Button 
            onClick={() => setIsLogModalOpen(true)}
            className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span>Log New Trade</span>
          </Button>
        </div>
      </div>

      {/* Filtered Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card/70 border-border backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-medium">Filtered Trades</div>
            <div className="text-2xl font-bold font-mono mt-1">{filteredStats.totalTrades}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {filteredStats.winningTrades}W - {filteredStats.losingTrades}L
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-medium">Win Rate</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${filteredStats.winRate >= 50 ? "text-primary" : "text-destructive"}`}>
              {filteredStats.winRate}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Target: 60%+</div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-medium">Net P&L</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${filteredStats.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              {filteredStats.netProfit >= 0 ? `+$${filteredStats.netProfit.toLocaleString()}` : `-$${Math.abs(filteredStats.netProfit).toLocaleString()}`}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Filtered period</div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-medium">Total R Gained</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${filteredStats.totalR >= 0 ? "text-primary" : "text-destructive"}`}>
              {filteredStats.totalR >= 0 ? `+${filteredStats.totalR}R` : `${filteredStats.totalR}R`}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Avg: {filteredStats.avgR}R / trade</div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-medium">Profit Factor</div>
            <div className="text-2xl font-bold font-mono mt-1 text-primary">
              {filteredStats.profitFactor}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Gross W / Gross L</div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase font-medium">Avg Win / Loss</div>
            <div className="text-lg font-bold font-mono mt-1 text-foreground">
              <span className="text-primary">+${filteredStats.avgWin}</span> / <span className="text-destructive">-${filteredStats.avgLoss}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Expected value</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & View Control Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-[280px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search symbol, setup, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 border-border text-sm h-9"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")} 
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Outcome Filter */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border text-xs">
              <button
                onClick={() => setOutcomeFilter("ALL")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${outcomeFilter === "ALL" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              <button
                onClick={() => setOutcomeFilter("WIN")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${outcomeFilter === "WIN" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Wins
              </button>
              <button
                onClick={() => setOutcomeFilter("LOSS")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${outcomeFilter === "LOSS" ? "bg-destructive/20 text-destructive" : "text-muted-foreground hover:text-foreground"}`}
              >
                Losses
              </button>
              <button
                onClick={() => setOutcomeFilter("BE")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${outcomeFilter === "BE" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                B/E
              </button>
            </div>

            {/* Direction Filter */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border text-xs">
              <button
                onClick={() => setDirectionFilter("ALL")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${directionFilter === "ALL" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              <button
                onClick={() => setDirectionFilter("BUY")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${directionFilter === "BUY" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                BUY
              </button>
              <button
                onClick={() => setDirectionFilter("SELL")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${directionFilter === "SELL" ? "bg-destructive/20 text-destructive" : "text-muted-foreground hover:text-foreground"}`}
              >
                SELL
              </button>
            </div>

            {/* Session Filter */}
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as TradeSession)}
              className="bg-muted/40 border border-border rounded-lg text-xs h-9 px-3 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Sessions</option>
              <option value="London">London Session</option>
              <option value="New York">New York Session</option>
              <option value="Asian">Asian Session</option>
            </select>

            {/* Rules Discipline Toggle */}
            <button
              onClick={() => setRulesOnlyFilter(!rulesOnlyFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                rulesOnlyFilter 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Disciplined Only</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border self-end lg:self-center">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "table" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "cards" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Cards View
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "daily" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Daily Logs
            </button>
          </div>
        </CardContent>
      </Card>

      {/* No Trades Found State */}
      {filteredTrades.length === 0 && (
        <Card className="bg-card border-dashed border-2 border-border py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="p-4 bg-muted/30 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Trades Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              No journal entries match your current search and filter criteria. Adjust your filters or log a new trade.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearch("");
                  setOutcomeFilter("ALL");
                  setDirectionFilter("ALL");
                  setSessionFilter("ALL");
                  setRulesOnlyFilter(false);
                }}
              >
                Reset Filters
              </Button>
              <Button onClick={() => setIsLogModalOpen(true)}>
                Log New Trade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1. TABLE VIEW */}
      {viewMode === "table" && filteredTrades.length > 0 && (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Outcome</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Pair</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Lots</th>
                  <th className="px-5 py-3.5">Entry / Exit</th>
                  <th className="px-5 py-3.5">Setup / Strategy</th>
                  <th className="px-5 py-3.5">Session</th>
                  <th className="px-5 py-3.5 text-right">R Multiple</th>
                  <th className="px-5 py-3.5 text-right">Net P&L</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTrades.map((trade) => {
                  const pnl = trade.netProfit ?? trade.profit;
                  const isWin = pnl > 0;
                  const isLoss = pnl < 0;
                  return (
                    <tr 
                      key={trade.id}
                      onClick={() => handleOpenDetail(trade)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* Outcome */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isWin ? (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          ) : isLoss ? (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
                          )}
                          <span className={`text-xs font-semibold ${isWin ? "text-primary" : isLoss ? "text-destructive" : "text-muted-foreground"}`}>
                            {isWin ? "WIN" : isLoss ? "LOSS" : "B/E"}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        <div>{new Date(trade.openTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                        <div className="text-[11px] text-muted-foreground/70">
                          {new Date(trade.openTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Pair */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold font-mono text-foreground group-hover:text-primary transition-colors">
                          {trade.symbol}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge 
                          variant={trade.direction === "BUY" ? "default" : "destructive"} 
                          className="text-[10px] px-2 py-0.5 font-mono"
                        >
                          {trade.direction}
                        </Badge>
                      </td>

                      {/* Lots */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-xs">
                        {trade.volume}
                      </td>

                      {/* Entry / Exit */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-xs">
                        <div>{trade.entryPrice}</div>
                        <div className="text-muted-foreground text-[11px]">→ {trade.exitPrice}</div>
                      </td>

                      {/* Setup */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-foreground">{trade.setup}</span>
                          {!trade.rulesFollowed && (
                            <span className="text-[10px] text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Rule Broken: {trade.mistake}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Session */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground bg-muted/40 border border-border px-2 py-1 rounded">
                          {trade.session}
                        </span>
                      </td>

                      {/* R Multiple */}
                      <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-xs">
                        <span className={trade.rMultiple >= 0 ? "text-primary" : "text-destructive"}>
                          {trade.rMultiple >= 0 ? `+${trade.rMultiple}R` : `${trade.rMultiple}R`}
                        </span>
                      </td>

                      {/* Net P&L */}
                      <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold">
                        <span className={isWin ? "text-primary" : isLoss ? "text-destructive" : "text-muted-foreground"}>
                          {isWin ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenDetail(trade)} 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              if (confirm("Delete trade?")) deleteTrade(trade.id);
                            }} 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. CARDS VIEW */}
      {viewMode === "cards" && filteredTrades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrades.map((trade) => {
            const pnl = trade.netProfit ?? trade.profit;
            const isWin = pnl > 0;
            const isLoss = pnl < 0;
            return (
              <Card 
                key={trade.id} 
                onClick={() => handleOpenDetail(trade)}
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group shadow-lg"
              >
                {/* Optional Chart Preview */}
                {trade.screenshotUrl && (
                  <div className="h-36 w-full relative overflow-hidden bg-muted/30 border-b border-border">
                    <Image 
                      src={trade.screenshotUrl} 
                      alt="Trade Chart Screenshot" 
                      fill
                      sizes="(max-width: 640px) 100vw, 400px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-background/80 backdrop-blur-md text-[10px]">
                        Chart Attached
                      </Badge>
                    </div>
                  </div>
                )}

                <CardContent className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-lg">{trade.symbol}</span>
                      <Badge 
                        variant={trade.direction === "BUY" ? "default" : "destructive"} 
                        className="text-[10px] font-mono px-2"
                      >
                        {trade.direction}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold font-mono ${isWin ? "text-primary" : isLoss ? "text-destructive" : "text-muted-foreground"}`}>
                        {isWin ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {trade.rMultiple >= 0 ? `+${trade.rMultiple}R` : `${trade.rMultiple}R`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 p-2.5 rounded-lg border border-border/50">
                    <div>
                      <span className="text-muted-foreground">Entry: </span>
                      <span className="font-mono font-medium">{trade.entryPrice}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Exit: </span>
                      <span className="font-mono font-medium">{trade.exitPrice}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lots: </span>
                      <span className="font-mono">{trade.volume}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Session: </span>
                      <span>{trade.session}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="bg-muted/40 border border-border px-2 py-0.5 rounded text-foreground font-medium">
                      {trade.setup}
                    </span>
                    {trade.rulesFollowed ? (
                      <span className="bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Disciplined
                      </span>
                    ) : (
                      <span className="bg-destructive/10 border border-destructive/30 text-destructive px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {trade.mistake}
                      </span>
                    )}
                    <span className="bg-muted/30 border border-border/60 text-muted-foreground px-2 py-0.5 rounded">
                      {trade.emotion}
                    </span>
                  </div>

                  {trade.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/10 p-2 rounded border border-border/30">
                      &quot;{trade.notes}&quot;
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(trade.openTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-primary group-hover:underline flex items-center gap-1">
                      View details <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 3. DAILY LOGS VIEW */}
      {viewMode === "daily" && filteredTrades.length > 0 && (
        <div className="flex flex-col gap-6">
          {dailyGroups.map((group) => {
            const isDayGreen = group.dayNet >= 0;
            return (
              <Card key={group.date} className="bg-card border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base font-bold">{group.date}</CardTitle>
                      <p className="text-xs text-muted-foreground">{group.trades.length} trades executed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase">Day P&L</div>
                      <div className={`text-lg font-bold font-mono ${isDayGreen ? "text-primary" : "text-destructive"}`}>
                        {isDayGreen ? `+$${group.dayNet.toFixed(2)}` : `-$${Math.abs(group.dayNet).toFixed(2)}`}
                      </div>
                    </div>
                    <div className="text-right border-l border-border pl-4">
                      <div className="text-xs text-muted-foreground uppercase">Day Return</div>
                      <div className={`text-lg font-bold font-mono ${group.dayR >= 0 ? "text-primary" : "text-destructive"}`}>
                        {group.dayR >= 0 ? `+${group.dayR.toFixed(1)}R` : `${group.dayR.toFixed(1)}R`}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {group.trades.map((trade) => {
                      const pnl = trade.netProfit ?? trade.profit;
                      const isWin = pnl > 0;
                      return (
                        <div 
                          key={trade.id} 
                          onClick={() => handleOpenDetail(trade)}
                          className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="font-mono text-sm font-bold min-w-[70px]">{trade.symbol}</div>
                            <Badge 
                              variant={trade.direction === "BUY" ? "default" : "destructive"} 
                              className="text-[10px] font-mono px-2"
                            >
                              {trade.direction}
                            </Badge>
                            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border">
                              {trade.setup}
                            </span>
                            <span className="text-xs text-muted-foreground hidden md:inline">
                              {trade.session} Session
                            </span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            {trade.notes && (
                              <span className="text-xs text-muted-foreground italic truncate max-w-[240px] hidden lg:inline">
                                &quot;{trade.notes}&quot;
                              </span>
                            )}
                            <div className="text-right">
                              <span className={`font-mono font-bold text-sm ${isWin ? "text-primary" : "text-destructive"}`}>
                                {isWin ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground ml-2">
                                ({trade.rMultiple >= 0 ? `+${trade.rMultiple}R` : `${trade.rMultiple}R`})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LOG NEW TRADE */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Log New Journal Entry</h3>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrade} className="p-6 space-y-6">
              {/* Pair Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Instrument / Symbol
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {popularPairs.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewSymbol(p)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                        newSymbol === p 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/50 border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <Input
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  placeholder="Or type custom symbol (e.g. SOLUSD, GER40)"
                  className="font-mono uppercase font-bold"
                  required
                />
              </div>

              {/* Direction & Session */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Trade Direction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewDirection("BUY")}
                      className={`py-2 rounded-lg font-bold font-mono text-sm border flex items-center justify-center gap-2 transition-all ${
                        newDirection === "BUY"
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ArrowUpRight className="h-4 w-4" /> BUY (Long)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDirection("SELL")}
                      className={`py-2 rounded-lg font-bold font-mono text-sm border flex items-center justify-center gap-2 transition-all ${
                        newDirection === "SELL"
                          ? "bg-destructive text-destructive-foreground border-destructive shadow-md shadow-destructive/20"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ArrowDownRight className="h-4 w-4" /> SELL (Short)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Trading Session
                  </label>
                  <select
                    value={newSession}
                    onChange={(e) => setNewSession(e.target.value as TradeSession)}
                    className="w-full bg-muted/30 border border-border rounded-lg text-sm h-10 px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="London">London Session</option>
                    <option value="New York">New York Session</option>
                    <option value="Asian">Asian Session</option>
                  </select>
                </div>
              </div>

              {/* Numerical Execution Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-xl border border-border">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Volume (Lots)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Entry Price</label>
                  <Input
                    type="number"
                    step="any"
                    value={newEntryPrice}
                    onChange={(e) => setNewEntryPrice(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Exit Price</label>
                  <Input
                    type="number"
                    step="any"
                    value={newExitPrice}
                    onChange={(e) => setNewExitPrice(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Stop Loss</label>
                  <Input
                    type="number"
                    step="any"
                    value={newStopLoss}
                    onChange={(e) => setNewStopLoss(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] text-muted-foreground block mb-1">Take Profit</label>
                  <Input
                    type="number"
                    step="any"
                    value={newTakeProfit}
                    onChange={(e) => setNewTakeProfit(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] text-muted-foreground block mb-1">Net Realized P&L ($)</label>
                  <Input
                    type="number"
                    step="any"
                    value={newProfit}
                    onChange={(e) => setNewProfit(e.target.value)}
                    className="font-mono font-bold text-primary"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] text-muted-foreground block mb-1">Estimated R Multiple</label>
                  <div className="h-9 px-3 rounded-md bg-muted/40 border border-border flex items-center font-mono font-bold text-primary text-sm">
                    {parseFloat(calculatedR) >= 0 ? `+${calculatedR}R` : `${calculatedR}R`}
                  </div>
                </div>
              </div>

              {/* Setup Tagging */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Setup / Strategy
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {standardSetups.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setNewSetup(s);
                        setNewCustomSetup("");
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        newSetup === s && !newCustomSetup
                          ? "bg-primary/20 border border-primary text-primary" 
                          : "bg-muted/40 border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Input
                  value={newCustomSetup}
                  onChange={(e) => setNewCustomSetup(e.target.value)}
                  placeholder="Or enter custom setup tag (e.g. SMT Divergence, Asian Range Sweep)"
                  className="text-xs"
                />
              </div>

              {/* Psychology & Rules */}
              <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold">Did you follow your trading rules?</span>
                    <p className="text-xs text-muted-foreground">Adhered to entry checklist, risk parameters, and stop placement.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewRulesFollowed(!newRulesFollowed)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      newRulesFollowed
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {newRulesFollowed ? "YES (Disciplined)" : "NO (Rule Broken)"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Trader Mindset / Emotion</label>
                    <select
                      value={newEmotion}
                      onChange={(e) => setNewEmotion(e.target.value as TradeEmotion)}
                      className="w-full bg-muted/40 border border-border rounded-lg text-xs h-9 px-2 text-foreground focus:outline-none"
                    >
                      <option value="Disciplined">Disciplined</option>
                      <option value="Confident">Confident</option>
                      <option value="Anxious">Anxious</option>
                      <option value="Greedy">Greedy</option>
                      <option value="FOMO">FOMO</option>
                      <option value="Frustrated">Frustrated</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Execution Mistake (If Any)</label>
                    <select
                      value={newMistake}
                      onChange={(e) => setNewMistake(e.target.value as TradeMistake)}
                      className="w-full bg-muted/40 border border-border rounded-lg text-xs h-9 px-2 text-foreground focus:outline-none"
                    >
                      <option value="None">None (Flawless Execution)</option>
                      <option value="Chased Entry">Chased Entry</option>
                      <option value="Moved Stop Loss">Moved Stop Loss</option>
                      <option value="Overleveraged">Overleveraged</option>
                      <option value="Revenge Trade">Revenge Trade</option>
                      <option value="Exited Early">Exited Early</option>
                      <option value="Ignored Invalidation">Ignored Invalidation</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pre-Trade Thesis Notes */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Pre-Trade Thesis & Technical Analysis
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Why did you take this trade? Key confluence levels, higher timeframe bias..."
                  className="w-full bg-muted/30 border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Post-Trade Review */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Post-Trade Review & Lessons Learned
                </label>
                <textarea
                  rows={2}
                  value={newPostReview}
                  onChange={(e) => setNewPostReview(e.target.value)}
                  placeholder="What went well? What could be improved for next time?"
                  className="w-full bg-muted/30 border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Chart Screenshot URL */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Chart Screenshot URL (Optional)
                </label>
                <Input
                  value={newScreenshotUrl}
                  onChange={(e) => setNewScreenshotUrl(e.target.value)}
                  placeholder="https://... or TradingView snapshot link"
                  className="text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsLogModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Save Trade to Journal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TRADE DETAILS & EDIT NOTES */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto my-6">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono">{selectedTrade.symbol}</span>
                <Badge 
                  variant={selectedTrade.direction === "BUY" ? "default" : "destructive"} 
                  className="text-xs font-mono px-2.5 py-0.5"
                >
                  {selectedTrade.direction}
                </Badge>
                <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                  {selectedTrade.session}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCurrentTrade}
                  className="text-destructive hover:bg-destructive/10 h-8 gap-1.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Top Result Banner */}
              <div className={`p-5 rounded-xl border flex items-center justify-between ${
                (selectedTrade.netProfit ?? selectedTrade.profit) >= 0 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-destructive/10 border-destructive/30"
              }`}>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Realized Result</div>
                  <div className={`text-3xl font-bold font-mono mt-1 ${
                    (selectedTrade.netProfit ?? selectedTrade.profit) >= 0 ? "text-primary" : "text-destructive"
                  }`}>
                    {(selectedTrade.netProfit ?? selectedTrade.profit) >= 0 
                      ? `+$${(selectedTrade.netProfit ?? selectedTrade.profit).toFixed(2)}` 
                      : `-$${Math.abs(selectedTrade.netProfit ?? selectedTrade.profit).toFixed(2)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Multiple</div>
                  <div className={`text-2xl font-bold font-mono mt-1 ${
                    selectedTrade.rMultiple >= 0 ? "text-primary" : "text-destructive"
                  }`}>
                    {selectedTrade.rMultiple >= 0 ? `+${selectedTrade.rMultiple}R` : `${selectedTrade.rMultiple}R`}
                  </div>
                </div>
              </div>

              {/* Execution Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Volume</span>
                  <span className="font-mono font-bold">{selectedTrade.volume} Lots</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Entry Price</span>
                  <span className="font-mono font-bold">{selectedTrade.entryPrice}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Exit Price</span>
                  <span className="font-mono font-bold">{selectedTrade.exitPrice}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Stop Loss</span>
                  <span className="font-mono font-bold text-muted-foreground">{selectedTrade.stopLoss ?? "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Take Profit</span>
                  <span className="font-mono font-bold text-muted-foreground">{selectedTrade.takeProfit ?? "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Strategy</span>
                  <span className="font-semibold text-foreground">{selectedTrade.setup}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Commission / Swap</span>
                  <span className="font-mono">{selectedTrade.commission ?? 0} / {selectedTrade.swap ?? 0}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Execution Time</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedTrade.openTime).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Psychology and Execution Badges */}
              <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/20 rounded-xl border border-border">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Discipline Status</span>
                  {selectedTrade.rulesFollowed ? (
                    <Badge className="bg-primary/20 text-primary border border-primary/40 gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Followed Rules
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Rule Broken: {selectedTrade.mistake}
                    </Badge>
                  )}
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Trader Mindset</span>
                  <Badge variant="outline" className="border-border text-foreground">
                    {selectedTrade.emotion}
                  </Badge>
                </div>
              </div>

              {/* Chart Screenshot Section */}
              {selectedTrade.screenshotUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-primary" /> Chart Screenshot
                  </span>
                  <div className="rounded-xl overflow-hidden border border-border bg-black/40 max-h-[340px]">
                    <Image 
                      src={selectedTrade.screenshotUrl} 
                      alt="Chart breakdown" 
                      width={1280}
                      height={720}
                      sizes="100vw"
                      className="w-full h-auto object-contain max-h-[340px]"
                    />
                  </div>
                </div>
              )}

              {/* Pre-Trade Thesis & Post-Trade Notes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Journal Reflection & Notes
                  </span>
                  {!isEditingNotes ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditingNotes(true)}
                      className="h-7 text-xs gap-1 text-primary"
                    >
                      <FileEdit className="h-3.5 w-3.5" /> Edit Notes
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingNotes(false)}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveNotes}
                        className="h-7 text-xs bg-primary text-primary-foreground font-semibold"
                      >
                        Save Notes
                      </Button>
                    </div>
                  )}
                </div>

                {!isEditingNotes ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/20 rounded-xl border border-border">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Pre-Trade Thesis:</div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedTrade.notes || "No pre-trade notes recorded."}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-xl border border-border">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Post-Trade Review & Lessons:</div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedTrade.postReview || "No post-trade review recorded."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Pre-Trade Thesis</label>
                      <textarea
                        rows={3}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Post-Trade Review</label>
                      <textarea
                        rows={3}
                        value={editPostReview}
                        onChange={(e) => setEditPostReview(e.target.value)}
                        className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AI TRADING COACH & EDGE DIAGNOSTICS */}
      {/* ========================================================================= */}
      {isAiCoachOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/30">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">The Edge — AI Trading Coach</h3>
                  <p className="text-xs text-muted-foreground">Synthesizing {trades.length} recorded trade setups & psychology logs.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAiCoachOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {insights.totalTrades > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Expectancy / Trade</div>
                    <div className={`text-lg font-bold font-mono ${insights.expectancy >= 0 ? "text-primary" : "text-destructive"}`}>
                      {insights.expectancy >= 0 ? "+" : ""}{insights.expectancy}R
                    </div>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Win Rate</div>
                    <div className={`text-lg font-bold font-mono ${insights.winRate >= 50 ? "text-primary" : "text-destructive"}`}>
                      {insights.winRate}%
                    </div>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Avg R / Trade</div>
                    <div className={`text-lg font-bold font-mono ${insights.avgR >= 0 ? "text-primary" : "text-destructive"}`}>
                      {insights.avgR >= 0 ? "+" : ""}{insights.avgR}R
                    </div>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Disciplined PF</div>
                    <div className="text-lg font-bold font-mono text-primary">{insights.disciplinedProfitFactor}</div>
                  </div>
                </div>
              )}

              {/* Top Edge Summary */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
                  <Target className="h-4 w-4" /> {insights.insightTitle}
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {insights.insightBody}
                </p>
              </div>

              {/* Leaks / Mistakes */}
              <div className={`${insights.leakTitle === "Behavioral Leak Detected" ? "bg-destructive/10 border-destructive/30" : "bg-primary/10 border-primary/30"} border rounded-xl p-4`}>
                <div className={`flex items-center gap-2 ${insights.leakTitle === "Behavioral Leak Detected" ? "text-destructive" : "text-primary"} font-bold text-sm mb-1`}>
                  {insights.leakTitle === "Behavioral Leak Detected" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {insights.leakTitle}
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {insights.leakBody}
                </p>
              </div>

              {/* Tactical Recommendations */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Personalized AI Rules for Your Next Session:
                </h4>
                <div className="space-y-2 text-xs">
                  {insights.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 border border-border rounded-lg">
                      <span className="font-mono text-primary font-bold">
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      <div>
                        <span className="font-semibold text-foreground">
                          Rule {i + 1}:
                        </span>
                        <p className="text-muted-foreground mt-0.5">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Data Helper */}
              <div className="pt-4 border-t border-border flex items-center justify-end">
                <Button 
                  onClick={() => setIsAiCoachOpen(false)}
                  className="bg-primary text-primary-foreground font-semibold"
                >
                  Got It
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
