"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { useTrades, calculateStats } from "@/lib/trade-store";
import { useSettings } from "@/lib/settings-store";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Target, Award, BarChart3, Clock, Flame, ShieldCheck } from "lucide-react";

const WIN_COLOR = "#00FFA3";
const LOSS_COLOR = "#EF4444";

function fmtCurrency(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

export default function DashboardPage() {
  const { trades, isLoading } = useTrades();
  const { settings } = useSettings();
  const stats = useMemo(() => calculateStats(trades), [trades]);
  const startingBalance = Number(settings.startingBalance) || 10000;

  const closedTrades = useMemo(() => trades.filter((t) => t.status === "CLOSED"), [trades]);

  // Build equity curve from trades sorted by close time
  const equityData = useMemo(() => {
    if (closedTrades.length === 0) return [];
    const sorted = [...closedTrades].sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());

    let balance = startingBalance;
    const points = [{ name: "Start", balance, drawdown: 0 }];
    let peak = balance;

    sorted.forEach((t) => {
      balance += (t.netProfit ?? t.profit);
      if (balance > peak) peak = balance;
      const drawdown = ((peak - balance) / peak) * 100;
      points.push({
        name: new Date(t.closeTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: Math.round(balance * 100) / 100,
        drawdown: Math.round(drawdown * 100) / 100
      });
    });
    return points;
  }, [closedTrades, startingBalance]);

  const maxDrawdown = useMemo(() => {
    if (equityData.length === 0) return 0;
    return Math.max(...equityData.map((p) => p.drawdown));
  }, [equityData]);

  // R-Multiple distribution buckets
  const rDistribution = useMemo(() => {
    const buckets = [
      { key: "<-3R", min: -Infinity, max: -3, color: LOSS_COLOR },
      { key: "-3R", min: -3, max: -2, color: LOSS_COLOR },
      { key: "-2R", min: -2, max: -1, color: LOSS_COLOR },
      { key: "-1R", min: -1, max: 0, color: LOSS_COLOR },
      { key: "+1R", min: 0, max: 1, color: WIN_COLOR },
      { key: "+2R", min: 1, max: 2, color: WIN_COLOR },
      { key: "+3R", min: 2, max: 3, color: WIN_COLOR },
      { key: "+3R+", min: 3, max: Infinity, color: WIN_COLOR },
    ];
    const counts = buckets.map((b) => ({ name: b.key, value: 0, color: b.color }));
    closedTrades.forEach((t) => {
      const r = t.rMultiple || 0;
      for (let i = 0; i < buckets.length; i += 1) {
        if (r >= buckets[i].min && r < buckets[i].max) {
          counts[i].value += 1;
          break;
        }
      }
    });
    return counts;
  }, [closedTrades]);

  // Monthly aggregation (by close month)
  const monthly = useMemo(() => {
    const map = new Map<string, { trades: number; wins: number; netProfit: number; totalR: number; winRate: number }>();
    const sortable: string[] = [];
    closedTrades.forEach((t) => {
      const d = new Date(t.closeTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const pnl = t.netProfit ?? t.profit;
      if (!map.has(key)) {
        map.set(key, { trades: 0, wins: 0, netProfit: 0, totalR: 0, winRate: 0 });
        sortable.push(key);
      }
      const m = map.get(key)!;
      m.trades += 1;
      if (pnl > 0) m.wins += 1;
      m.netProfit += pnl;
      m.totalR += t.rMultiple || 0;
    });
    sortable.sort();
    return sortable.map((key) => {
      const m = map.get(key)!;
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return {
        label,
        sort: key,
        trades: m.trades,
        wins: m.wins,
        losses: m.trades - m.wins,
        winRate: Math.round((m.wins / m.trades) * 100),
        netProfit: Number(m.netProfit.toFixed(2)),
        totalR: Number(m.totalR.toFixed(2)),
      };
    });
  }, [closedTrades]);

  // Trade outcomes for pie chart
  const outcomesData = useMemo(() => [
    { name: 'Wins', value: stats.winningTrades },
    { name: 'Losses', value: stats.losingTrades },
    { name: 'Breakeven', value: stats.breakevenTrades },
  ], [stats]);

  const COLORS = ['#00FFA3', '#EF4444', '#94A3B8'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const streakLabel = stats.currentStreak.type === "NONE"
    ? "—"
    : `${stats.currentStreak.type === "WIN" ? "W" : "L"}${stats.currentStreak.count}`;
  const streakColor = stats.currentStreak.type === "WIN"
    ? "text-primary"
    : stats.currentStreak.type === "LOSS" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.winningTrades}W – {stats.losingTrades}L – {stats.breakevenTrades}B/E
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${stats.winRate >= 50 ? "text-primary" : "text-destructive"}`}>
              {stats.winRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg R: {stats.avgR >= 0 ? "+" : ""}{stats.avgR}R
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net P&L</CardTitle>
            {stats.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${stats.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              {stats.netProfit >= 0 ? `+$${stats.netProfit.toLocaleString()}` : `-$${Math.abs(stats.netProfit).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total R: {stats.totalR >= 0 ? "+" : ""}{stats.totalR}R
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{stats.profitFactor}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gross {fmtCurrency(stats.grossProfit)} / {fmtCurrency(-stats.grossLoss)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Extended Metric Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expectancy / Trade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${stats.expectancyR >= 0 ? "text-primary" : "text-destructive"}`}>
              {stats.expectancyR >= 0 ? "+" : ""}{stats.expectancyR}R
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fmtCurrency(stats.expectancy)} per trade · Win +{stats.avgWinR}R · Loss {stats.avgLossR}R
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">{maxDrawdown > 0 ? `-${maxDrawdown}%` : "0%"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Peak-to-trough on equity curve
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Largest Win / Loss</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              <span className="text-primary">+${stats.largestWin.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Worst: <span className="text-destructive">-${Math.abs(stats.largestLoss).toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${streakColor}`}>{streakLabel}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Longest: {stats.longestWinStreak}W / {stats.longestLossStreak}L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Equity Curve */}
        <Card className="col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Equity Curve
              <span className="text-xs font-normal text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border">
                Starting: ${startingBalance.toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full mt-4">
              {equityData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00FFA3" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#00FFA3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#101923" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#081018', border: '1px solid #101923', borderRadius: '8px' }}
                      itemStyle={{ color: '#00FFA3' }}
                      labelStyle={{ color: '#94A3B8' }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Balance']}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#00FFA3" strokeWidth={2} fill="url(#equityGradient)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Log trades to see your equity curve
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trade Outcomes */}
        <Card className="col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle>Trade Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center relative">
              {stats.totalTrades > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={outcomesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {outcomesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#081018', border: '1px solid #101923', borderRadius: '8px' }}
                        itemStyle={{ color: '#F8FAFC' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-3xl font-bold font-mono text-foreground">{stats.totalTrades}</span>
                    <span className="text-xs text-muted-foreground uppercase">Trades</span>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">No trades yet</div>
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2">
              {outcomesData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-mono font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* R-Distribution + Monthly P&L */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* R-Multiple Distribution */}
        <Card className="col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm">R-Multiple Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[220px] w-full mt-4">
              {stats.totalTrades > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#101923" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{ backgroundColor: '#081018', border: '1px solid #101923', borderRadius: '8px' }}
                      itemStyle={{ color: '#F8FAFC' }}
                    />
                    <Bar dataKey="value" name="Trades">
                      {rDistribution.map((entry, index) => (
                        <Cell key={`rcell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly P&L chart */}
        <Card className="col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm">Monthly Net P&L</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[220px] w-full mt-4">
              {monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#101923" vertical={false} />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{ backgroundColor: '#081018', border: '1px solid #101923', borderRadius: '8px' }}
                      itemStyle={{ color: '#F8FAFC' }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Net P&L']}
                    />
                    <Bar dataKey="netProfit" name="Net P&L" radius={[4, 4, 0, 0]}>
                      {monthly.map((m, index) => (
                        <Cell key={`mcell-${index}`} fill={m.netProfit >= 0 ? WIN_COLOR : LOSS_COLOR} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Log trades across months to see performance
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discipline + Monthly Table */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Rule Discipline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Disciplined Trades</p>
                <p className="text-2xl font-bold font-mono">{stats.disciplineRate}%</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{stats.disciplinedCount} of {stats.totalTrades}</div>
                <div className={stats.disciplineRate >= 80 ? "text-primary" : "text-amber-400"}>
                  {stats.disciplineRate >= 80 ? "Solid discipline" : "Leaky"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/20 rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Avg Win $</p>
                <p className="font-mono font-bold text-primary mt-1">+${stats.avgWin.toLocaleString()}</p>
              </div>
              <div className="bg-muted/20 rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Avg Loss $</p>
                <p className="font-mono font-bold text-destructive mt-1">-${stats.avgLoss.toLocaleString()}</p>
              </div>
              <div className="bg-muted/20 rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Payoff Ratio</p>
                <p className="font-mono font-bold mt-1">1 : {stats.payoffRatio}</p>
              </div>
              <div className="bg-muted/20 rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Total Fees</p>
                <p className="font-mono font-bold text-muted-foreground mt-1">${Math.abs(stats.totalFees).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance Table */}
        <Card className="col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {monthly.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
                    <tr>
                      <th className="px-5 py-3">Month</th>
                      <th className="px-5 py-3">Trades</th>
                      <th className="px-5 py-3">W/L</th>
                      <th className="px-5 py-3">Win Rate</th>
                      <th className="px-5 py-3 text-right">Total R</th>
                      <th className="px-5 py-3 text-right">Net P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...monthly].reverse().map((m) => (
                      <tr key={m.sort} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-medium">{m.label}</td>
                        <td className="px-5 py-3 font-mono">{m.trades}</td>
                        <td className="px-5 py-3 font-mono text-xs">
                          <span className="text-primary">{m.wins}W</span> / <span className="text-destructive">{m.losses}L</span>
                        </td>
                        <td className="px-5 py-3 font-mono">{m.winRate}%</td>
                        <td className={`px-5 py-3 font-mono text-right ${m.totalR >= 0 ? "text-primary" : "text-destructive"}`}>
                          {m.totalR >= 0 ? "+" : ""}{m.totalR}R
                        </td>
                        <td className={`px-5 py-3 font-mono font-bold text-right ${m.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                          {m.netProfit >= 0 ? "+$" : "-$"}{Math.abs(m.netProfit).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No closed trades yet — log some to see monthly breakdowns.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-none bg-muted/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Best Pair</p>
              <p className="text-lg font-bold font-mono">{stats.bestPair}</p>
            </div>
            <div className="text-primary font-mono font-bold">
              {stats.bestPairProfit >= 0 ? `+$${stats.bestPairProfit}` : `-$${Math.abs(stats.bestPairProfit)}`}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none bg-muted/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Best Session</p>
              <p className="text-lg font-bold font-mono">{stats.bestSession}</p>
            </div>
            <div className="text-primary font-mono font-bold">
              {stats.bestSessionR >= 0 ? `+${stats.bestSessionR}R` : `${stats.bestSessionR}R`}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none bg-muted/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Best Setup</p>
              <p className="text-lg font-bold font-mono">{stats.bestSetup}</p>
            </div>
            <div className="text-primary font-mono font-bold">{stats.bestSetupWinRate}% WR</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none bg-muted/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Most Traded</p>
              <p className="text-lg font-bold font-mono">{stats.mostTraded}</p>
            </div>
            <div className="text-foreground font-mono font-bold">{stats.mostTradedCount} trades</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades Quick List */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No trades logged yet. Head to Import Trades or Journal to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {trades.slice(0, 5).map((trade) => {
                const pnl = trade.netProfit ?? trade.profit;
                const isWin = pnl > 0;
                return (
                  <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full ${isWin ? "bg-primary" : "bg-destructive"}`} />
                      <span className="font-bold font-mono text-sm">{trade.symbol}</span>
                      <span className={`text-xs font-mono ${trade.direction === "BUY" ? "text-primary" : "text-destructive"}`}>
                        {trade.direction}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border">
                        {trade.setup}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`font-mono font-bold text-sm ${isWin ? "text-primary" : "text-destructive"}`}>
                        {isWin ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(trade.openTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}