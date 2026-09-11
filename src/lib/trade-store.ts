"use client";

import { useState, useEffect } from "react";
import { Trade } from "./types";

const STORAGE_KEY = "the_edge_trades_v2";

export const INITIAL_TRADES: Trade[] = [];

export function getStoredTrades(): Trade[] {
  if (typeof window === "undefined") return INITIAL_TRADES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_TRADES;
    return JSON.parse(raw).filter((t) => t && typeof t === "object");
  } catch (e) {
    console.error("Error reading trades from localStorage:", e);
    return INITIAL_TRADES;
  }
}

export function saveTrades(trades: Trade[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    window.dispatchEvent(new Event("trades-updated"));
  } catch (e) {
    console.error("Error saving trades to localStorage:", e);
  }
}

export function addTrade(trade: Omit<Trade, "id">): Trade {
  const newTrade: Trade = {
    ...trade,
    id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  };
  const current = getStoredTrades();
  const updated = [newTrade, ...current];
  saveTrades(updated);
  return newTrade;
}

export function addMultipleTrades(trades: Omit<Trade, "id">[]): Trade[] {
  const current = getStoredTrades();
  const newTrades: Trade[] = trades.map((t, idx) => ({
    ...t,
    id: `trade-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
  }));
  saveTrades([...newTrades, ...current]);
  return newTrades;
}

export function updateTrade(id: string, updates: Partial<Trade>): Trade | null {
  const current = getStoredTrades();
  let found: Trade | null = null;
  const updated = current.map((t) => {
    if (t.id === id) {
      found = { ...t, ...updates };
      return found;
    }
    return t;
  });
  if (found) {
    saveTrades(updated);
  }
  return found;
}

export function deleteTrade(id: string): boolean {
  const current = getStoredTrades();
  const filtered = current.filter((t) => t.id !== id);
  if (filtered.length !== current.length) {
    saveTrades(filtered);
    return true;
  }
  return false;
}

export function resetTradesToDefault(): Trade[] {
  saveTrades([]);
  return [];
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>(() => getStoredTrades());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleUpdate = () => {
      setTrades(getStoredTrades());
    };

    window.addEventListener("trades-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    const t = setTimeout(() => setIsLoading(false), 0);

    return () => {
      window.removeEventListener("trades-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      clearTimeout(t);
    };
  }, []);

  return { trades, isLoading, addTrade, updateTrade, deleteTrade, resetTradesToDefault };
}

// Calculate comprehensive trading metrics
export function calculateStats(trades: Trade[]) {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      netProfit: 0,
      profitFactor: 0,
      totalR: 0,
      avgR: 0,
      avgWin: 0,
      avgLoss: 0,
      avgWinR: 0,
      avgLossR: 0,
      payoffRatio: 0,
      expectancy: 0,
      expectancyR: 0,
      largestWin: 0,
      largestLoss: 0,
      grossProfit: 0,
      grossLoss: 0,
      totalFees: 0,
      disciplineRate: 0,
      disciplinedCount: 0,
      currentStreak: { type: "NONE", count: 0 },
      longestWinStreak: 0,
      longestLossStreak: 0,
      bestPair: "N/A",
      bestPairProfit: 0,
      bestSession: "N/A",
      bestSessionR: 0,
      bestSetup: "N/A",
      bestSetupWinRate: 0,
      mostTraded: "N/A",
      mostTradedCount: 0
    };
  }

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => (t.netProfit ?? t.profit) > 0);
  const losingTrades = trades.filter((t) => (t.netProfit ?? t.profit) < 0);
  const breakevenTrades = trades.filter((t) => (t.netProfit ?? t.profit) === 0);

  const winRate = Number(((winningTrades.length / totalTrades) * 100).toFixed(1));

  const totalGrossProfit = winningTrades.reduce((acc, t) => acc + (t.netProfit ?? t.profit), 0);
  const totalGrossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + (t.netProfit ?? t.profit), 0));
  const netProfit = Number((totalGrossProfit - totalGrossLoss).toFixed(2));

  const profitFactor = totalGrossLoss > 0 ? Number((totalGrossProfit / totalGrossLoss).toFixed(2)) : totalGrossProfit > 0 ? 99.9 : 0;

  const totalR = Number(trades.reduce((acc, t) => acc + (t.rMultiple || 0), 0).toFixed(2));
  const avgR = Number((totalR / totalTrades).toFixed(2));

  const avgWin = winningTrades.length > 0 ? Number((totalGrossProfit / winningTrades.length).toFixed(2)) : 0;
  const avgLoss = losingTrades.length > 0 ? Number((totalGrossLoss / losingTrades.length).toFixed(2)) : 0;
  const avgWinR = winningTrades.length > 0 ? Number((winningTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / winningTrades.length).toFixed(2)) : 0;
  const avgLossR = losingTrades.length > 0 ? Number((losingTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / losingTrades.length).toFixed(2)) : 0;
  const payoffRatio = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : avgWin > 0 ? 99.9 : 0;
  const expectancy = Number((netProfit / totalTrades).toFixed(2));
  const expectancyR = avgR;

  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.netProfit ?? t.profit)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.netProfit ?? t.profit)) : 0;
  const totalFees = Number(trades.reduce((acc, t) => acc + (t.commission || 0) + (t.swap || 0), 0).toFixed(2));

  const disciplinedCount = trades.filter((t) => t.rulesFollowed).length;
  const disciplineRate = Math.round((disciplinedCount / totalTrades) * 100);

  // Streaks (chronological by close time)
  const chronological = [...trades].sort(
    (a, b) => new Date(a.closeTime ?? a.openTime).getTime() - new Date(b.closeTime ?? b.openTime).getTime()
  );
  const outcomeOf = (t: Trade): "WIN" | "LOSS" | "BE" => {
    const pnl = t.netProfit ?? t.profit;
    return pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE";
  };

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let curWin = 0;
  let curLoss = 0;
  chronological.forEach((t) => {
    const o = outcomeOf(t);
    if (o === "WIN") { curWin += 1; curLoss = 0; }
    else if (o === "LOSS") { curLoss += 1; curWin = 0; }
    else { curWin = 0; curLoss = 0; }
    longestWinStreak = Math.max(longestWinStreak, curWin);
    longestLossStreak = Math.max(longestLossStreak, curLoss);
  });

  let currentStreak = { type: "NONE" as "WIN" | "LOSS" | "NONE", count: 0 };
  const latest = chronological[chronological.length - 1];
  if (latest) {
    const latestOutcome = outcomeOf(latest);
    if (latestOutcome !== "BE") {
      let count = 0;
      for (let i = chronological.length - 1; i >= 0; i -= 1) {
        if (outcomeOf(chronological[i]) === latestOutcome) count += 1;
        else break;
      }
      currentStreak = { type: latestOutcome, count };
    }
  }

  // Best Pair
  const pairMap: Record<string, { profit: number; count: number }> = {};
  trades.forEach((t) => {
    if (!pairMap[t.symbol]) pairMap[t.symbol] = { profit: 0, count: 0 };
    pairMap[t.symbol].profit += t.netProfit ?? t.profit;
    pairMap[t.symbol].count += 1;
  });

  let bestPair = "N/A";
  let bestPairProfit = -Infinity;
  let mostTraded = "N/A";
  let mostTradedCount = 0;

  Object.entries(pairMap).forEach(([sym, val]) => {
    if (val.profit > bestPairProfit) {
      bestPairProfit = val.profit;
      bestPair = sym;
    }
    if (val.count > mostTradedCount) {
      mostTradedCount = val.count;
      mostTraded = sym;
    }
  });

  // Best Session
  const sessionMap: Record<string, number> = {};
  trades.forEach((t) => {
    sessionMap[t.session] = (sessionMap[t.session] || 0) + (t.rMultiple || 0);
  });
  let bestSession = "London";
  let bestSessionR = -Infinity;
  Object.entries(sessionMap).forEach(([sess, r]) => {
    if (r > bestSessionR) {
      bestSessionR = r;
      bestSession = sess;
    }
  });

  // Best Setup
  const setupMap: Record<string, { wins: number; total: number }> = {};
  trades.forEach((t) => {
    if (!setupMap[t.setup]) setupMap[t.setup] = { wins: 0, total: 0 };
    setupMap[t.setup].total += 1;
    if ((t.netProfit ?? t.profit) > 0) setupMap[t.setup].wins += 1;
  });
  let bestSetup = "N/A";
  let bestSetupWinRate = 0;
  Object.entries(setupMap).forEach(([setup, data]) => {
    const rate = Math.round((data.wins / data.total) * 100);
    if (data.total >= 1 && rate > bestSetupWinRate) {
      bestSetupWinRate = rate;
      bestSetup = setup;
    }
  });

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakevenTrades: breakevenTrades.length,
    winRate,
    netProfit,
    profitFactor,
    totalR,
    avgR,
    avgWin,
    avgLoss,
    avgWinR,
    avgLossR,
    payoffRatio,
    expectancy,
    expectancyR,
    largestWin: Number(largestWin.toFixed(2)),
    largestLoss: Number(largestLoss.toFixed(2)),
    grossProfit: Number(totalGrossProfit.toFixed(2)),
    grossLoss: Number(totalGrossLoss.toFixed(2)),
    totalFees,
    disciplineRate,
    disciplinedCount,
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    bestPair,
    bestPairProfit: Number(bestPairProfit.toFixed(2)),
    bestSession,
    bestSessionR: Number(bestSessionR.toFixed(1)),
    bestSetup,
    bestSetupWinRate,
    mostTraded,
    mostTradedCount
  };
}
