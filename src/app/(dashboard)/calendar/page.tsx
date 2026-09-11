"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { useTrades } from "@/lib/trade-store";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Flame,
  Coins,
  Layers,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface DayInfo {
  date: string;
  net: number;
  totalR: number;
  wins: number;
  losses: number;
  count: number;
}

const GREEN_BUCKETS = [
  "bg-primary/5 hover:bg-primary/10",
  "bg-primary/10 hover:bg-primary/15",
  "bg-primary/15 hover:bg-primary/20",
  "bg-primary/25 hover:bg-primary/30",
];

const RED_BUCKETS = [
  "bg-destructive/5 hover:bg-destructive/10",
  "bg-destructive/10 hover:bg-destructive/15",
  "bg-destructive/15 hover:bg-destructive/20",
  "bg-destructive/25 hover:bg-destructive/30",
];

const fmtMoney = (n: number) => {
  const rounded = Math.round(n * 100) / 100;
  const abs = Math.abs(rounded).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${rounded >= 0 ? "+$" : "-$"}${abs}`;
};

const fmtCellMoney = (n: number) => {
  const abs = Math.abs(n);
  const sign = n >= 0 ? "+" : "-";
  if (abs >= 1000) {
    const k = (abs / 1000).toFixed(abs >= 10000 ? 0 : 1).replace(/\.0$/, "");
    return `${sign}$${k}K`;
  }
  return `${sign}$${Math.round(abs)}`;
};

const fmtR = (r: number) => `${r >= 0 ? "+" : ""}${r.toFixed(1)}R`;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { trades } = useTrades();

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [date, setDate] = useState<Date | undefined>(now);

  // Group all trades by day
  const tradesByDate = useMemo(() => {
    const map: Record<string, typeof trades> = {};
    trades.forEach((t) => {
      const key = new Date(t.openTime).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [trades]);

  // Per-day aggregates for the viewed month
  const monthDayMap = useMemo(() => {
    const map: Record<string, DayInfo> = {};
    Object.entries(tradesByDate).forEach(([key, dayTrades]) => {
      const d = new Date(key);
      if (d.getMonth() !== view.month || d.getFullYear() !== view.year) return;
      const net = Math.round(dayTrades.reduce((a, t) => a + (t.netProfit ?? t.profit), 0) * 100) / 100;
      const totalR = Math.round(dayTrades.reduce((a, t) => a + (t.rMultiple || 0), 0) * 100) / 100;
      const wins = dayTrades.filter((t) => (t.netProfit ?? t.profit) > 0).length;
      const losses = dayTrades.filter((t) => (t.netProfit ?? t.profit) < 0).length;
      map[key] = { date: key, net, totalR, wins, losses, count: dayTrades.length };
    });
    return map;
  }, [tradesByDate, view]);

  // 6-week grid for the viewed month
  const grid = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const start = new Date(view.year, view.month, 1 - first.getDay());
    const weeks: Date[][] = [];
    let d = start;
    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(d);
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [view]);

  const maxAbsMoney = useMemo(
    () => Math.max(0, ...Object.values(monthDayMap).map((x) => Math.abs(x.net))),
    [monthDayMap],
  );

  const dayStats = useMemo(() => {
    if (!date) return null;
    const info = monthDayMap[date.toDateString()];
    return { info, trades: tradesByDate[date.toDateString()] || [] };
  }, [date, monthDayMap, tradesByDate]);

  // Monthly summary
  const monthStats = useMemo(() => {
    const days = Object.values(monthDayMap);
    const count = days.reduce((a, x) => a + x.count, 0);
    const net = Math.round(days.reduce((a, x) => a + x.net, 0) * 100) / 100;
    const totalR = Math.round(days.reduce((a, x) => a + x.totalR, 0) * 100) / 100;
    const wins = days.reduce((a, x) => a + x.wins, 0);
    const losses = days.reduce((a, x) => a + x.losses, 0);
    const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;

    const bestDay = days.reduce<DayInfo | null>(
      (acc, x) => (!acc || x.net > acc.net ? x : acc),
      null,
    );
    const worstDay = days.reduce<DayInfo | null>(
      (acc, x) => (!acc || x.net < acc.net ? x : acc),
      null,
    );

    return { count, net, totalR, wins, losses, winRate, tradingDays: days.length, bestDay, worstDay };
  }, [monthDayMap]);

  // Current streak across all trading days
  const streak = useMemo(() => {
    const days = Object.keys(tradesByDate).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
    if (days.length === 0) return { length: 0, type: 0 as 0 | 1 | -1 };
    const sign = (key: string) => {
      const net = tradesByDate[key].reduce((a, t) => a + (t.netProfit ?? t.profit), 0);
      return net > 0 ? (1 as const) : net < 0 ? (-1 as const) : (0 as const);
    };
    const targetSign = sign(days[0]) as 1 | -1;
    let length = 0;
    let cursor = new Date(days[0]);
    for (const key of days) {
      const d = new Date(key);
      if (d.getTime() !== cursor.getTime()) break;
      if (sign(key) === 0) break;
      if (sign(key) !== targetSign) break;
      length += 1;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    }
    return { length, type: (length > 0 ? targetSign : (0 as 0 | 1 | -1)) };
  }, [tradesByDate]);

  // Month snapshot: top pair, setup and session
  const monthSnapshot = useMemo(() => {
    const monthTrades = trades.filter((t) => {
      const d = new Date(t.openTime);
      return d.getMonth() === view.month && d.getFullYear() === view.year;
    });
    if (monthTrades.length === 0) return null;

    const pairAgg = new Map<string, { net: number; count: number }>();
    const setupAgg = new Map<string, { count: number; totalR: number }>();
    const sessionAgg = new Map<string, { count: number; net: number }>();

    monthTrades.forEach((t) => {
      const pnl = t.netProfit ?? t.profit;
      const p = pairAgg.get(t.symbol) ?? { net: 0, count: 0 };
      p.net += pnl;
      p.count += 1;
      pairAgg.set(t.symbol, p);

      const st = setupAgg.get(t.setup) ?? { count: 0, totalR: 0 };
      st.count += 1;
      st.totalR += t.rMultiple || 0;
      setupAgg.set(t.setup, st);

      const se = sessionAgg.get(t.session) ?? { count: 0, net: 0 };
      se.count += 1;
      se.net += pnl;
      sessionAgg.set(t.session, se);
    });

    let topPair: { name: string; net: number; count: number } | null = null;
    pairAgg.forEach((v, k) => {
      if (!topPair || v.net > topPair.net) topPair = { name: k, net: v.net, count: v.count };
    });
    let topSetup: { name: string; count: number; totalR: number } | null = null;
    setupAgg.forEach((v, k) => {
      if (!topSetup || v.count > topSetup.count) topSetup = { name: k, count: v.count, totalR: v.totalR };
    });
    let topSession: { name: string; count: number; net: number } | null = null;
    sessionAgg.forEach((v, k) => {
      if (!topSession || v.count > topSession.count) topSession = { name: k, count: v.count, net: v.net };
    });

    return {
      topPair: topPair ?? { name: "—", net: 0, count: 0 },
      topSetup: topSetup ?? { name: "—", count: 0, totalR: 0 },
      topSession: topSession ?? { name: "—", count: 0, net: 0 },
    };
  }, [trades, view]);

  const changeMonth = (delta: number) => {
    setView((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToday = () => {
    const d = new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setDate(d);
  };

  const renderDay = (day: Date) => {
    const inMonth = day.getMonth() === view.month;
    const key = day.toDateString();
    const info = monthDayMap[key];
    const isSelected = !!date && date.toDateString() === key;
    const isToday = day.toDateString() === new Date().toDateString();

    let cellBase = "relative flex h-14 sm:h-16 md:h-[4.4rem] flex-col items-start justify-between rounded-lg border p-1.5 text-left transition-all duration-150 sm:p-2 border-border/60";
    if (!inMonth) cellBase += " opacity-20";

    let bucket = "";
    let barPct = 0;
    if (info) {
      const pct = maxAbsMoney > 0 ? Math.round((Math.abs(info.net) / maxAbsMoney) * 100) : 0;
      barPct = pct > 0 ? Math.max(12, pct) : 0;
      const idx = pct === 0 ? -1 : Math.min(3, Math.floor((pct - 1) / 25));
      bucket = info.net >= 0
        ? idx >= 0
          ? GREEN_BUCKETS[idx]
          : "bg-primary/5 hover:bg-primary/10"
        : idx >= 0
          ? RED_BUCKETS[idx]
          : "bg-destructive/5 hover:bg-destructive/10";
    }

    return (
      <button
        key={key}
        type="button"
        aria-label={day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        onClick={() => setDate(day)}
        className={cn(
          cellBase,
          bucket,
          inMonth && "hover:border-primary/50 hover:scale-[1.03] hover:z-10 cursor-pointer",
          inMonth && !info && "hover:bg-muted/40",
          isSelected &&
            "ring-2 ring-primary ring-offset-2 ring-offset-card border-primary/60 scale-[1.03] z-10",
          isToday && !isSelected && "border-primary/40",
        )}
      >
        <div className="flex w-full items-center justify-between">
          <span className={cn("text-[11px] font-semibold leading-none", isToday ? "text-primary" : inMonth ? "text-muted-foreground" : "text-muted-foreground/50")}>
            {day.getDate()}
          </span>
          {info && info.count > 1 && (
            <span className="text-[9px] leading-none font-mono text-muted-foreground/80">×{info.count}</span>
          )}
        </div>
        {info ? (
          <div className="w-full space-y-1">
            <span className={cn("block text-[10px] sm:text-[11px] font-bold font-mono leading-none", info.net >= 0 ? "text-primary" : "text-destructive")}>
              {fmtCellMoney(info.net)}
            </span>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={cn("h-full rounded-full transition-all duration-300", info.net >= 0 ? "bg-primary" : "bg-destructive")}
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-[10px] leading-none text-muted-foreground/30">—</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Performance heatmap — every trade, every day, at a glance.
          </p>
        </div>
        {streak.length > 1 && (
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 px-3 py-1 border-0",
              streak.type === 1 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
            )}
          >
            <Flame className="h-3.5 w-3.5" />
            {streak.length}-day {streak.type === 1 ? "win" : "loss"} streak
          </Badge>
        )}
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Month P&L</span>
              {monthStats.net >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            </div>
            <div className={cn("text-xl font-bold font-mono mt-1", monthStats.net >= 0 ? "text-primary" : "text-destructive")}>
              {fmtMoney(monthStats.net)}
            </div>
            <div className="text-[11px] text-muted-foreground">{fmtR(monthStats.totalR)} total</div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Win Rate</span>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className={cn("text-xl font-bold font-mono mt-1", monthStats.winRate >= 50 ? "text-primary" : "text-destructive")}>
              {monthStats.winRate}%
            </div>
            <div className="text-[11px] text-muted-foreground">
              {monthStats.wins}W / {monthStats.losses}L · {monthStats.count} trades
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Best Day</span>
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono mt-1 text-primary">
              {monthStats.bestDay ? fmtMoney(monthStats.bestDay.net) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {monthStats.bestDay
                ? `${new Date(monthStats.bestDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${fmtR(monthStats.bestDay.totalR)}`
                : "No trades"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Worst Day</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-xl font-bold font-mono mt-1 text-destructive">
              {monthStats.worstDay ? fmtMoney(monthStats.worstDay.net) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {monthStats.worstDay
                ? `${new Date(monthStats.worstDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${fmtR(monthStats.worstDay.totalR)}`
                : "No trades"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Active Days</span>
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono mt-1">{monthStats.tradingDays}</div>
            <div className="text-[11px] text-muted-foreground">
              Avg {monthStats.tradingDays > 0 ? (monthStats.count / monthStats.tradingDays).toFixed(1) : "0.0"} trades/day
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Heatmap calendar */}
        <Card className="col-span-1 lg:col-span-2 bg-card border-border">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {new Date(view.year, view.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToday} className="h-8">
                Today
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="text-center text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {wd}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {grid.flatMap((week) => week.map((d) => renderDay(d)))}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 border-t border-border pt-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary/70 inline-block" /> Profitable day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70 inline-block" /> Losing day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-border inline-block" /> Flat
              </span>
              <span className="opacity-70">Color intensity = size of move</span>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-1 flex flex-col gap-6">
          {/* Day detail */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Day Breakdown
                {dayStats?.info && (
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs font-mono">
                    {dayStats.info.count} trades
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {date
                  ? date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                  : "Select a date"}
              </div>

              {!dayStats?.info ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p>No trades recorded on this day.</p>
                  <p className="text-xs mt-1">Click a highlighted day to inspect it.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Net P&L</div>
                      <div className={cn("text-2xl font-bold font-mono", dayStats.info.net >= 0 ? "text-primary" : "text-destructive")}>
                        {fmtMoney(dayStats.info.net)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Day R</div>
                      <div className={cn("text-2xl font-bold font-mono", dayStats.info.totalR >= 0 ? "text-primary" : "text-destructive")}>
                        {fmtR(dayStats.info.totalR)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-5">
                    <Badge className="bg-primary/10 text-primary border-0">
                      <TrendingUp className="h-3 w-3 mr-1" /> {dayStats.info.wins}W
                    </Badge>
                    <Badge className="bg-destructive/10 text-destructive border-0">
                      <TrendingDown className="h-3 w-3 mr-1" /> {dayStats.info.losses}L
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Expectancy {dayStats.info.count > 0 ? ((dayStats.info.totalR / dayStats.info.count).toFixed(2)) : "0.00"}R / trade
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {dayStats.trades.map((trade) => {
                      const pnl = trade.netProfit ?? trade.profit;
                      const isWin = pnl > 0;
                      return (
                        <div
                          key={trade.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-colors",
                            isWin
                              ? "bg-primary/5 border-primary/15 hover:bg-primary/10"
                              : "bg-destructive/5 border-destructive/15 hover:bg-destructive/10",
                          )}
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono">{trade.symbol}</span>
                              {trade.direction === "BUY" ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                              )}
                              <span className="text-[10px] font-mono text-muted-foreground">{trade.volume} lots</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {trade.setup} • {trade.session}
                              {trade.mistake && trade.mistake !== "None" ? ` • ${trade.mistake}` : ""}
                            </span>
                          </div>
                          <div className="text-right shrink-0 pl-3">
                            <div className={cn("font-bold font-mono", isWin ? "text-primary" : "text-destructive")}>
                              {fmtMoney(pnl)}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Month snapshot */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                {new Date(view.year, view.month, 1).toLocaleDateString("en-US", { month: "long" })} Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!monthSnapshot ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No activity this month.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Coins className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">Best pair</span>
                    <div className="text-right">
                      <div className="font-bold font-mono text-sm">{monthSnapshot.topPair.name}</div>
                      <div className={cn("text-[11px] font-mono", monthSnapshot.topPair.net >= 0 ? "text-primary" : "text-destructive")}>
                        {fmtMoney(monthSnapshot.topPair.net)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">Top setup</span>
                    <div className="text-right">
                      <div className="font-bold font-mono text-sm">{monthSnapshot.topSetup.name}</div>
                      <div className="text-[11px] font-mono text-foreground/80">
                        {monthSnapshot.topSetup.count}× · {monthSnapshot.topSetup.totalR >= 0 ? "+" : ""}{monthSnapshot.topSetup.totalR.toFixed(1)}R
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">Most traded</span>
                    <div className="text-right">
                      <div className="font-bold font-mono text-sm">{monthSnapshot.topSession.name}</div>
                      <div className={cn("text-[11px] font-mono", monthSnapshot.topSession.net >= 0 ? "text-primary" : "text-destructive")}>
                        {fmtMoney(monthSnapshot.topSession.net)}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}