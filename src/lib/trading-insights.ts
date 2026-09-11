import { Trade, TradeMistake } from "./types";

export interface SetupStat {
  name: string;
  count: number;
  wins: number;
  winRate: number;
  totalR: number;
  avgR: number;
  netProfit: number;
}

export interface SessionStat {
  name: string;
  count: number;
  wins: number;
  winRate: number;
  totalR: number;
  netProfit: number;
}

export interface PairStat {
  name: string;
  count: number;
  wins: number;
  winRate: number;
  netProfit: number;
}

export interface MistakeStat {
  mistake: TradeMistake;
  count: number;
  totalLoss: number;
}

export interface EdgeInsights {
  totalTrades: number;
  winRate: number;
  avgR: number;
  expectancy: number;
  avgWinR: number;
  profitFactor: number;
  topSetup: SetupStat | null;
  topSession: SessionStat | null;
  topPairs: PairStat[];
  weakPairs: PairStat[];
  mostCommonMistake: MistakeStat | null;
  disciplineCount: number;
  disciplineLoss: number;
  disciplinedProfitFactor: number;
  hasDisciplineGap: boolean;
  recommendations: string[];
  insightTitle: string;
  insightBody: string;
  leakTitle: string;
  leakBody: string;
}

function pnl(t: Trade): number {
  return t.netProfit ?? t.profit;
}

function profitFactorOf(trades: Trade[]): number {
  const grossWin = trades
    .filter((t) => pnl(t) > 0)
    .reduce((acc, t) => acc + pnl(t), 0);
  const grossLoss = Math.abs(
    trades.filter((t) => pnl(t) < 0).reduce((acc, t) => acc + pnl(t), 0),
  );
  if (grossLoss > 0) return Number((grossWin / grossLoss).toFixed(2));
  if (grossWin > 0) return 99.9;
  return 0;
}

function ending(sentences: string[]): string {
  if (sentences.length === 0) return "";
  return sentences.join(" ") + ".";
}

function avgLossDollar(trades: Trade[]): number {
  const losses = trades.filter((t) => pnl(t) < 0);
  if (losses.length === 0) return 1;
  const avg = Math.abs(losses.reduce((acc, t) => acc + pnl(t), 0) / losses.length);
  return avg > 0 ? avg : 1;
}

export function getEdgeInsights(trades: Trade[]): EdgeInsights {
  const closed = trades.filter((t) => t.status === "CLOSED");
  const totalTrades = closed.length;
  const wins = closed.filter((t) => pnl(t) > 0);
  const netProfit = closed.reduce((acc, t) => acc + pnl(t), 0);
  const winRate =
    totalTrades > 0 ? Number(((wins.length / totalTrades) * 100).toFixed(1)) : 0;
  const avgR =
    totalTrades > 0
      ? Number((closed.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / totalTrades).toFixed(2))
      : 0;
  const avgWinR =
    wins.length > 0
      ? Number((wins.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / wins.length).toFixed(2))
      : 0;
  const riskPerTrade = avgLossDollar(closed);
  const expectancy =
    totalTrades > 0 ? Number((netProfit / totalTrades / riskPerTrade).toFixed(2)) : 0;
  const profitFactor = profitFactorOf(closed);

  const setupMap = new Map<string, SetupStat>();
  closed.forEach((t) => {
    const stat = setupMap.get(t.setup) ?? {
      name: t.setup,
      count: 0,
      wins: 0,
      winRate: 0,
      totalR: 0,
      avgR: 0,
      netProfit: 0,
    };
    stat.count += 1;
    if (pnl(t) > 0) stat.wins += 1;
    stat.totalR += t.rMultiple || 0;
    stat.netProfit += pnl(t);
    setupMap.set(t.setup, stat);
  });
  const setups: SetupStat[] = [...setupMap.values()]
    .map((s) => ({
      ...s,
      winRate: Math.round((s.wins / s.count) * 100),
      avgR: Number((s.totalR / s.count).toFixed(2)),
    }))
    .sort((a, b) => b.avgR - a.avgR);
  const topSetup = setups[0] ?? null;

  const sessionMap = new Map<string, SessionStat>();
  closed.forEach((t) => {
    const stat = sessionMap.get(t.session) ?? {
      name: t.session,
      count: 0,
      wins: 0,
      winRate: 0,
      totalR: 0,
      netProfit: 0,
    };
    stat.count += 1;
    if (pnl(t) > 0) stat.wins += 1;
    stat.totalR += t.rMultiple || 0;
    stat.netProfit += pnl(t);
    sessionMap.set(t.session, stat);
  });
  const sessions: SessionStat[] = [...sessionMap.values()]
    .map((s) => ({
      ...s,
      winRate: Math.round((s.wins / s.count) * 100),
      totalR: Number(s.totalR.toFixed(2)),
      netProfit: Number(s.netProfit.toFixed(2)),
    }))
    .sort((a, b) => b.totalR - a.totalR);
  const topSession = sessions[0] ?? null;

  const pairMap = new Map<string, PairStat>();
  closed.forEach((t) => {
    const stat = pairMap.get(t.symbol) ?? {
      name: t.symbol,
      count: 0,
      wins: 0,
      winRate: 0,
      netProfit: 0,
    };
    stat.count += 1;
    if (pnl(t) > 0) stat.wins += 1;
    stat.netProfit += pnl(t);
    pairMap.set(t.symbol, stat);
  });
  const pairs: PairStat[] = [...pairMap.values()]
    .map((p) => ({ ...p, winRate: Math.round((p.wins / p.count) * 100) }))
    .sort((a, b) => b.netProfit - a.netProfit);
  const topPairs = pairs.filter((p) => p.netProfit > 0);
  const weakPairs = pairs.filter((p) => p.netProfit < 0);

  const mistakeMap = new Map<TradeMistake, MistakeStat>();
  closed
    .filter((t) => t.mistake && t.mistake !== "None")
    .forEach((t) => {
      const m = t.mistake as TradeMistake;
      const stat = mistakeMap.get(m) ?? { mistake: m, count: 0, totalLoss: 0 };
      stat.count += 1;
      if (pnl(t) < 0) stat.totalLoss += Math.abs(pnl(t));
      mistakeMap.set(m, stat);
    });
  const mistakes: MistakeStat[] = [...mistakeMap.values()].sort(
    (a, b) => b.totalLoss - a.totalLoss,
  );
  const mostCommonMistake = mistakes[0] ?? null;

  const disciplined = closed.filter((t) => t.rulesFollowed);
  const undisciplined = closed.filter((t) => !t.rulesFollowed);
  const disciplinedProfitFactor = profitFactorOf(disciplined);
  const disciplineLoss = Math.abs(
    undisciplined
      .filter((t) => pnl(t) < 0)
      .reduce((acc, t) => acc + pnl(t), 0),
  );
  const hasDisciplineGap =
    disciplined.length > 0 &&
    undisciplined.length > 0 &&
    disciplinedProfitFactor > profitFactor;

  return {
    totalTrades,
    winRate,
    avgR,
    expectancy,
    avgWinR,
    profitFactor,
    topSetup,
    topSession,
    topPairs,
    weakPairs,
    mostCommonMistake,
    disciplineCount: disciplined.length,
    disciplineLoss,
    disciplinedProfitFactor,
    hasDisciplineGap,
    recommendations: buildRecommendations({
      totalTrades,
      sessions,
      topPairs,
      weakPairs,
      mostCommonMistake,
      avgWinR,
      winRate,
    }),
    insightTitle: totalTrades === 0 ? "No Trades Yet" : "Primary Edge Identified",
    insightBody: buildInsightBody({
      totalTrades,
      topSetup,
      topSession,
      avgWinR,
      hasDisciplineGap,
      disciplinedProfitFactor,
      profitFactor,
      mostCommonMistake,
      disciplineLoss,
      topPairs,
    }),
    leakTitle:
      mostCommonMistake && disciplineLoss > 0
        ? "Behavioral Leak Detected"
        : "Discipline Scorecard",
    leakBody: buildLeakBody({
      mostCommonMistake,
      disciplineLoss,
      disciplinedCount: disciplined.length,
      disciplinedProfitFactor,
      profitFactor,
      hasDisciplineGap,
    }),
  };
}

function buildInsightBody(input: {
  totalTrades: number;
  topSetup: SetupStat | null;
  topSession: SessionStat | null;
  avgWinR: number;
  hasDisciplineGap: boolean;
  disciplinedProfitFactor: number;
  profitFactor: number;
  mostCommonMistake: MistakeStat | null;
  disciplineLoss: number;
  topPairs: PairStat[];
}): string {
  const {
    totalTrades,
    topSetup,
    topSession,
    avgWinR,
    hasDisciplineGap,
    disciplinedProfitFactor,
    profitFactor,
    mostCommonMistake,
    disciplineLoss,
    topPairs,
  } = input;

  if (totalTrades === 0) {
    return "Log or import your first trades and The Edge will identify your highest-expectancy setups, behavioral leaks, and the rules that actually pay. No data, no guesses.";
  }

  const parts: string[] = [];

  if (topSetup && topSession) {
    parts.push(
      `Your highest-expectancy setup is ${topSetup.name}, which performs best during the ${topSession.name} session — averaging +${avgWinR}R per winning trade.`,
    );
  } else if (topSetup) {
    parts.push(
      `Your highest-expectancy setup is ${topSetup.name}, averaging +${avgWinR}R per winning trade.`,
    );
  }

  if (hasDisciplineGap) {
    parts.push(
      `When you strictly follow your predetermined plan, your profit factor rises from ${profitFactor} to ${disciplinedProfitFactor}.`,
    );
  }

  if (mostCommonMistake && disciplineLoss > 0) {
    const share = Math.round((mostCommonMistake.count / totalTrades) * 100);
    parts.push(
      `${mostCommonMistake.mistake} has cost you roughly $${Math.round(disciplineLoss).toLocaleString()} in avoidable drawdown across ${mostCommonMistake.count} trade(s), ${share}% of your journal.`,
    );
  }

  if (topPairs.length >= 2) {
    const names = topPairs
      .slice(0, 2)
      .map((p) => p.name)
      .join(" and ");
    parts.push(`Stick with ${names} — they carry most of your edge.`);
  }

  return ending(parts) || "Your journal is still too thin for reliable coaching — keep logging and patterns will emerge.";
}

function buildLeakBody(input: {
  mostCommonMistake: MistakeStat | null;
  disciplineLoss: number;
  disciplinedCount: number;
  disciplinedProfitFactor: number;
  profitFactor: number;
  hasDisciplineGap: boolean;
}): string {
  const {
    mostCommonMistake,
    disciplineLoss,
    disciplinedCount,
    disciplinedProfitFactor,
    profitFactor,
    hasDisciplineGap,
  } = input;

  if (!mostCommonMistake || disciplineLoss === 0) {
    if (disciplinedCount === 0) {
      return "Mark trades as disciplined so The Edge can measure how often following your rules leads to profit.";
    }
    return `All ${disciplinedCount} logged trade(s) followed your rules. The data says discipline compounds — keep logging to build a meaningful sample.`;
  }

  const parts: string[] = [
    `Trades tagged "${mostCommonMistake.mistake}" are your single most expensive behaviour, converting a profitable system into unnecessary drawdown.`,
  ];
  if (hasDisciplineGap) {
    parts.push(
      `Removing them lifts your profit factor from ${profitFactor} to ${disciplinedProfitFactor}.`,
    );
  } else if (disciplineLoss > 0) {
    parts.push(
      `Eliminating this leak would save roughly $${Math.round(disciplineLoss).toLocaleString()} and improve the expectancy of every future trade.`,
    );
  }
  return ending(parts);
}

function buildRecommendations(input: {
  totalTrades: number;
  sessions: SessionStat[];
  topPairs: PairStat[];
  weakPairs: PairStat[];
  mostCommonMistake: MistakeStat | null;
  avgWinR: number;
  winRate: number;
}): string[] {
  const { totalTrades, sessions, topPairs, weakPairs, mostCommonMistake, avgWinR, winRate } = input;
  const recs: string[] = [];

  if (totalTrades === 0) {
    return [
      "Log your first trade so The Edge can compute your real edge.",
      "Attach a written thesis and post-trade review to every entry.",
      "Tag whether you followed your rules — that data powers leak detection.",
    ];
  }

  if (topPairs.length >= 2) {
    const names = topPairs
      .slice(0, 2)
      .map((p) => p.name)
      .join(" / ");
    recs.push(`Edge pairs: ${names} deliver your best return — favour them, and fade the losers.`);
  }

  if (mostCommonMistake) {
    recs.push(
      `Hard-stop ${mostCommonMistake.mistake.toLowerCase()}: it is your #1 leak (${mostCommonMistake.count} occurrence(s)). Rehearse the exact invalidation before you enter.`,
    );
  }

  const topSession = sessions[0];
  const bottomSession = sessions[sessions.length - 1];
  if (topSession && topSession.totalR > 0) {
    const tail =
      bottomSession && bottomSession.name !== topSession.name
        ? ` while ${bottomSession.name} sits at ${bottomSession.totalR}R`
        : "";
    recs.push(
      `Concentrate entries in the ${topSession.name} session — it produced +${topSession.totalR}R${tail}.`,
    );
  }

  if (avgWinR > 0 && winRate > 0) {
    recs.push(
      `Your system pays +${avgWinR}R per winner at a ${winRate}% win rate — protect it with ruthless, consistent risk sizing.`,
    );
  }

  if (weakPairs.length > 0) {
    recs.push(
      `De-risk ${weakPairs.slice(0, 2).map((p) => p.name).join("/")} until your edge on those names is proven.`,
    );
  }

  return recs.slice(0, 3);
}