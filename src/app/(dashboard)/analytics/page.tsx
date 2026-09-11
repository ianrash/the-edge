"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrades, calculateStats } from "@/lib/trade-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Award, Target, BarChart3, ShieldCheck, AlertTriangle, Clock } from "lucide-react";

export default function AnalyticsPage() {
  const { trades } = useTrades();
  const stats = useMemo(() => calculateStats(trades), [trades]);

  // P&L by Symbol
  const symbolData = useMemo(() => {
    const map: Record<string, { profit: number; count: number; wins: number }> = {};
    trades.forEach(t => {
      if (!map[t.symbol]) map[t.symbol] = { profit: 0, count: 0, wins: 0 };
      map[t.symbol].profit += (t.netProfit ?? t.profit);
      map[t.symbol].count += 1;
      if ((t.netProfit ?? t.profit) > 0) map[t.symbol].wins += 1;
    });
    return Object.entries(map)
      .map(([symbol, data]) => ({
        symbol,
        profit: Math.round(data.profit * 100) / 100,
        count: data.count,
        winRate: Math.round((data.wins / data.count) * 100)
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [trades]);

  // P&L by Session
  const sessionData = useMemo(() => {
    const map: Record<string, { profit: number; count: number; totalR: number; wins: number }> = {};
    trades.forEach(t => {
      if (!map[t.session]) map[t.session] = { profit: 0, count: 0, totalR: 0, wins: 0 };
      map[t.session].profit += (t.netProfit ?? t.profit);
      map[t.session].count += 1;
      map[t.session].totalR += (t.rMultiple || 0);
      if ((t.netProfit ?? t.profit) > 0) map[t.session].wins += 1;
    });
    return Object.entries(map).map(([session, data]) => ({
      session,
      profit: Math.round(data.profit * 100) / 100,
      count: data.count,
      totalR: Math.round(data.totalR * 10) / 10,
      winRate: Math.round((data.wins / data.count) * 100)
    }));
  }, [trades]);

  // P&L by Setup / Strategy
  const setupData = useMemo(() => {
    const map: Record<string, { profit: number; count: number; totalR: number; wins: number }> = {};
    trades.forEach(t => {
      if (!map[t.setup]) map[t.setup] = { profit: 0, count: 0, totalR: 0, wins: 0 };
      map[t.setup].profit += (t.netProfit ?? t.profit);
      map[t.setup].count += 1;
      map[t.setup].totalR += (t.rMultiple || 0);
      if ((t.netProfit ?? t.profit) > 0) map[t.setup].wins += 1;
    });
    return Object.entries(map)
      .map(([setup, data]) => ({
        setup,
        profit: Math.round(data.profit * 100) / 100,
        count: data.count,
        totalR: Math.round(data.totalR * 10) / 10,
        winRate: Math.round((data.wins / data.count) * 100),
        avgR: data.count > 0 ? Math.round((data.totalR / data.count) * 10) / 10 : 0
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [trades]);

  // Day of Week Analysis
  const dayOfWeekData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map: Record<string, { profit: number; count: number }> = {};
    days.forEach(d => { map[d] = { profit: 0, count: 0 }; });
    trades.forEach(t => {
      const day = days[new Date(t.openTime).getDay()];
      map[day].profit += (t.netProfit ?? t.profit);
      map[day].count += 1;
    });
    return days.map(d => ({
      day: d,
      profit: Math.round(map[d].profit * 100) / 100,
      count: map[d].count
    }));
  }, [trades]);

  // Discipline Analysis
  const disciplineData = useMemo(() => {
    const followedRules = trades.filter(t => t.rulesFollowed);
    const brokenRules = trades.filter(t => !t.rulesFollowed);
    const followedProfit = followedRules.reduce((acc, t) => acc + (t.netProfit ?? t.profit), 0);
    const brokenProfit = brokenRules.reduce((acc, t) => acc + (t.netProfit ?? t.profit), 0);
    const followedWins = followedRules.filter(t => (t.netProfit ?? t.profit) > 0).length;
    const brokenWins = brokenRules.filter(t => (t.netProfit ?? t.profit) > 0).length;
    return {
      followed: {
        count: followedRules.length,
        profit: Math.round(followedProfit * 100) / 100,
        winRate: followedRules.length > 0 ? Math.round((followedWins / followedRules.length) * 100) : 0
      },
      broken: {
        count: brokenRules.length,
        profit: Math.round(brokenProfit * 100) / 100,
        winRate: brokenRules.length > 0 ? Math.round((brokenWins / brokenRules.length) * 100) : 0
      }
    };
  }, [trades]);

  // Emotion Pie Data
  const emotionData = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach(t => {
      map[t.emotion] = (map[t.emotion] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [trades]);

  const emotionColors = ["#00FFA3", "#06B6D4", "#F59E0B", "#EF4444", "#A855F7", "#F97316"];

  // Mistake Breakdown
  const mistakeData = useMemo(() => {
    const map: Record<string, { count: number; totalLoss: number }> = {};
    trades.filter(t => t.mistake && t.mistake !== "None").forEach(t => {
      const m = t.mistake!;
      if (!map[m]) map[m] = { count: 0, totalLoss: 0 };
      map[m].count += 1;
      if ((t.netProfit ?? t.profit) < 0) {
        map[m].totalLoss += Math.abs(t.netProfit ?? t.profit);
      }
    });
    return Object.entries(map).map(([mistake, data]) => ({
      mistake,
      count: data.count,
      totalLoss: Math.round(data.totalLoss * 100) / 100
    })).sort((a, b) => b.totalLoss - a.totalLoss);
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">Deep-dive into your trading performance data.</p>
        </div>
        <Card className="bg-card border-dashed border-2 border-border py-20 text-center">
          <CardContent className="flex flex-col items-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Import trades or log journal entries to see your performance analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Deep-dive into your trading performance data across {stats.totalTrades} recorded trades.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Win Rate</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${stats.winRate >= 50 ? "text-primary" : "text-destructive"}`}>
              {stats.winRate}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Profit Factor</div>
            <div className="text-2xl font-bold font-mono mt-1 text-primary">{stats.profitFactor}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Total R</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${stats.totalR >= 0 ? "text-primary" : "text-destructive"}`}>
              {stats.totalR >= 0 ? "+" : ""}{stats.totalR}R
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Avg R</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${stats.avgR >= 0 ? "text-primary" : "text-destructive"}`}>
              {stats.avgR >= 0 ? "+" : ""}{stats.avgR}R
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Avg Win</div>
            <div className="text-2xl font-bold font-mono mt-1 text-primary">+${stats.avgWin}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Avg Loss</div>
            <div className="text-2xl font-bold font-mono mt-1 text-destructive">-${stats.avgLoss}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Symbol P&L + Day of Week */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              P&L by Symbol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symbolData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#101923" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="symbol" stroke="#94A3B8" fontSize={11} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#081018', border: '1px solid #101923', borderRadius: '8px' }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Net P&L']}
                    labelStyle={{ color: '#F8FAFC' }}
                  />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                    {symbolData.map((entry, index) => (
                      <Cell key={index} fill={entry.profit >= 0 ? "#00FFA3" : "#EF4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              P&L by Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#101923" vertical={false} />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#081018', border: '1px solid #101923', borderRadius: '8px' }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Net P&L']}
                    labelStyle={{ color: '#F8FAFC' }}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {dayOfWeekData.map((entry, index) => (
                      <Cell key={index} fill={entry.profit >= 0 ? "#00FFA3" : "#EF4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Session Breakdown + Emotion Pie */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Session Breakdown Table */}
        <Card className="col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Session Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-y border-border">
                <tr>
                  <th className="px-5 py-3 text-left">Session</th>
                  <th className="px-5 py-3 text-left">Trades</th>
                  <th className="px-5 py-3 text-left">Win Rate</th>
                  <th className="px-5 py-3 text-right">Total R</th>
                  <th className="px-5 py-3 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessionData.map(s => (
                  <tr key={s.session} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-semibold">{s.session}</td>
                    <td className="px-5 py-3 font-mono text-muted-foreground">{s.count}</td>
                    <td className="px-5 py-3">
                      <span className={`font-mono font-bold ${s.winRate >= 50 ? "text-primary" : "text-destructive"}`}>
                        {s.winRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold">
                      <span className={s.totalR >= 0 ? "text-primary" : "text-destructive"}>
                        {s.totalR >= 0 ? "+" : ""}{s.totalR}R
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold">
                      <span className={s.profit >= 0 ? "text-primary" : "text-destructive"}>
                        {s.profit >= 0 ? `+$${s.profit}` : `-$${Math.abs(s.profit)}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Emotion Distribution */}
        <Card className="col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle>Trader Mindset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={emotionData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                    {emotionData.map((_, i) => <Cell key={i} fill={emotionColors[i % emotionColors.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#081018', border: '1px solid #101923', borderRadius: '8px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {emotionData.map((e, i) => (
                <div key={e.name} className="flex items-center gap-1 text-[11px]">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: emotionColors[i % emotionColors.length] }} />
                  <span className="text-muted-foreground">{e.name}</span>
                  <span className="font-mono font-bold">{e.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Breakdown Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Strategy / Setup Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-y border-border">
                <tr>
                  <th className="px-5 py-3 text-left">Setup</th>
                  <th className="px-5 py-3 text-left">Trades</th>
                  <th className="px-5 py-3 text-left">Win Rate</th>
                  <th className="px-5 py-3 text-right">Avg R</th>
                  <th className="px-5 py-3 text-right">Total R</th>
                  <th className="px-5 py-3 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {setupData.map(s => (
                  <tr key={s.setup} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-semibold">{s.setup}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-muted-foreground">{s.count}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.winRate >= 60 ? "bg-primary" : s.winRate >= 40 ? "bg-amber-500" : "bg-destructive"}`} style={{ width: `${s.winRate}%` }} />
                        </div>
                        <span className={`font-mono font-bold text-xs ${s.winRate >= 50 ? "text-primary" : "text-destructive"}`}>
                          {s.winRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold">
                      <span className={s.avgR >= 0 ? "text-primary" : "text-destructive"}>
                        {s.avgR >= 0 ? "+" : ""}{s.avgR}R
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold">
                      <span className={s.totalR >= 0 ? "text-primary" : "text-destructive"}>
                        {s.totalR >= 0 ? "+" : ""}{s.totalR}R
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold">
                      <span className={s.profit >= 0 ? "text-primary" : "text-destructive"}>
                        {s.profit >= 0 ? `+$${s.profit.toLocaleString()}` : `-$${Math.abs(s.profit).toLocaleString()}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Discipline & Mistakes Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Discipline Impact */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Discipline Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary">Rules Followed</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Trades</div>
                  <div className="font-mono font-bold">{disciplineData.followed.count}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="font-mono font-bold text-primary">{disciplineData.followed.winRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Net P&L</div>
                  <div className={`font-mono font-bold ${disciplineData.followed.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                    {disciplineData.followed.profit >= 0 ? "+" : ""}${disciplineData.followed.profit}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-bold text-destructive">Rules Broken</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Trades</div>
                  <div className="font-mono font-bold">{disciplineData.broken.count}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="font-mono font-bold text-destructive">{disciplineData.broken.winRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Net P&L</div>
                  <div className={`font-mono font-bold ${disciplineData.broken.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                    {disciplineData.broken.profit >= 0 ? "+" : ""}${disciplineData.broken.profit}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mistake Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Execution Mistakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mistakeData.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <ShieldCheck className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="font-medium text-primary">No execution mistakes logged.</p>
                <p className="text-xs mt-1">Perfect discipline — keep it up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mistakeData.map(m => (
                  <div key={m.mistake} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{m.mistake}</div>
                        <div className="text-xs text-muted-foreground">{m.count} occurrence{m.count > 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-destructive text-sm">-${m.totalLoss.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Total loss impact</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
