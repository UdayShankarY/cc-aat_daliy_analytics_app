import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, subDays, startOfDay, addDays } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Download, Plus, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRACKERS, TRACKER_TYPES, EntryType, EntryRecord } from "@/lib/trackers";
import { buildForecastChartSeries, computeMetricForecasts } from "@/lib/clientMl";
import { toast } from "@/hooks/use-toast";

const RANGE_DAYS = 14;

const FORECAST_DAYS = 7;

const Dashboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictionTab, setPredictionTab] = useState<EntryType>("sleep");

  useEffect(() => {
    if (!user) return;
    const since = format(subDays(startOfDay(new Date()), 60), "yyyy-MM-dd");
    setLoading(true);
    api
      .listEntries({ since, limit: 500 })
      .then(({ entries: apiEntries }) => {
        setEntries(
          apiEntries.map((e) => ({
            id: e.id,
            user_id: e.userId,
            type: e.type,
            amount: e.amount,
            category: e.category,
            note: e.note,
            entry_date: e.entryDate,
            created_at: e.createdAt,
          }))
        );
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load";
        toast({ title: "Failed to load", description: message, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [user]);

  // build last N day series
  const series = useMemo(() => {
    const days = Array.from({ length: RANGE_DAYS }, (_, i) => {
      const d = subDays(startOfDay(new Date()), RANGE_DAYS - 1 - i);
      return format(d, "yyyy-MM-dd");
    });
    return days.map((d) => {
      const dayEntries = entries.filter((e) => e.entry_date === d);
      const totals: Record<EntryType, number> = { expense: 0, sleep: 0, study: 0, exercise: 0 };
      dayEntries.forEach((e) => {
        totals[e.type] += Number(e.amount);
      });
      return {
        date: d,
        label: format(parseISO(d), "MMM d"),
        ...totals,
      };
    });
  }, [entries]);

  const stats = useMemo(() => {
    const result: Record<EntryType, { total: number; avg: number; trend: number }> = {
      expense: { total: 0, avg: 0, trend: 0 },
      sleep: { total: 0, avg: 0, trend: 0 },
      study: { total: 0, avg: 0, trend: 0 },
      exercise: { total: 0, avg: 0, trend: 0 },
    };
    TRACKER_TYPES.forEach((t) => {
      const last7 = series.slice(-7).map((s) => s[t] as number);
      const prev7 = series.slice(-14, -7).map((s) => s[t] as number);
      const totalLast = last7.reduce((a, b) => a + b, 0);
      const totalPrev = prev7.reduce((a, b) => a + b, 0);
      result[t] = {
        total: totalLast,
        avg: totalLast / 7,
        trend: totalPrev > 0 ? ((totalLast - totalPrev) / totalPrev) * 100 : 0,
      };
    });
    return result;
  }, [series]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    entries
      .filter((e) => e.type === "expense" && new Date(e.entry_date) >= subDays(new Date(), 30))
      .forEach((e) => {
        const k = e.category || "Other";
        map.set(k, (map.get(k) || 0) + Number(e.amount));
      });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [entries]);

  const mlForecasts = useMemo(() => computeMetricForecasts(series, TRACKER_TYPES), [series]);

  const predictionTabEffective = useMemo(() => {
    if (mlForecasts.some((f) => f.type === predictionTab)) return predictionTab;
    return mlForecasts[0]?.type ?? predictionTab;
  }, [mlForecasts, predictionTab]);

  const futureLabels = useMemo(() => {
    if (series.length === 0) return [];
    const last = parseISO(series[series.length - 1]!.date);
    return Array.from({ length: FORECAST_DAYS }, (_, i) => format(addDays(last, i + 1), "MMM d"));
  }, [series]);

  const forecastChartByType = useMemo(() => {
    const m = new Map<EntryType, ReturnType<typeof buildForecastChartSeries>>();
    for (const f of mlForecasts) {
      m.set(f.type, buildForecastChartSeries(series, f.type, FORECAST_DAYS, futureLabels));
    }
    return m;
  }, [series, mlForecasts, futureLabels]);

  const insights = useMemo(() => {
    const out: string[] = [];
    const sleepLast = stats.sleep.total / 7;
    if (sleepLast > 0 && sleepLast < 7) out.push(`💤 You're averaging ${sleepLast.toFixed(1)}h sleep — try to aim for 7-8h.`);
    if (stats.sleep.trend < -10) out.push(`📉 Your sleep dropped ${Math.abs(stats.sleep.trend).toFixed(0)}% vs last week.`);
    if (stats.expense.trend > 20) out.push(`💸 Spending up ${stats.expense.trend.toFixed(0)}% vs last week.`);
    if (stats.study.total > 0 && stats.study.trend > 10) out.push(`📚 Study time up ${stats.study.trend.toFixed(0)}% — keep going!`);
    if (stats.exercise.total === 0) out.push(`🏃 No exercise logged this week. Try a short walk today.`);
    if (out.length === 0 && entries.length > 0) out.push(`✨ Looking steady. Keep logging to surface deeper trends.`);
    if (entries.length === 0) out.push(`👋 Add your first entry to start seeing insights.`);
    return out;
  }, [stats, entries]);

  const exportCSV = () => {
    const header = ["date", "type", "amount", "category", "note"].join(",");
    const rows = entries.map((e) => [
      e.entry_date,
      e.type,
      e.amount,
      `"${(e.category || "").replace(/"/g, '""')}"`,
      `"${(e.note || "").replace(/"/g, '""')}"`,
    ].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PIE_COLORS = ["hsl(var(--tracker-expense))", "hsl(var(--tracker-sleep))", "hsl(var(--tracker-study))", "hsl(var(--tracker-exercise))", "hsl(var(--accent))", "hsl(var(--primary-glow))", "hsl(var(--warning))"];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Your dashboard</h1>
          <p className="mt-1 text-muted-foreground">Last 14 days of activity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={entries.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="hero" asChild>
            <Link to="/add"><Plus className="h-4 w-4" /> Add entry</Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TRACKER_TYPES.map((t) => {
          const cfg = TRACKERS[t];
          const s = stats[t];
          const up = s.trend >= 0;
          return (
            <Card key={t} className="group relative overflow-hidden p-5 shadow-soft transition-all hover:shadow-elevated">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20" style={{ background: cfg.colorVar }} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cfg.emoji}</span>
                  {s.total > 0 && (
                    <span className={`flex items-center gap-1 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(s.trend).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{cfg.label} · 7d</div>
                <div className="mt-1 text-2xl font-bold">
                  {t === "expense" ? `$${s.total.toFixed(0)}` : `${s.total.toFixed(1)}${cfg.unit}`}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">avg {t === "expense" ? `$${s.avg.toFixed(1)}` : `${s.avg.toFixed(1)}${cfg.unit}`} / day</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Insights */}
      <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Insights</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {insights.map((line, i) => (
            <li key={i} className="text-foreground/90">{line}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 border-accent/40 p-6 shadow-soft">
        <div className="flex flex-wrap items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold">Predictions (JavaScript, in your browser)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Uses a linear trend fit on your last {RANGE_DAYS} days of dashboard analytics. No ML API and no backend changes — only math on data already shown above.
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="mt-6 h-72 w-full" />
        ) : entries.length === 0 || mlForecasts.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Log a few days of activity to unlock next-day and 7-day-ahead estimates.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {mlForecasts.map((f) => {
                const cfg = TRACKERS[f.type];
                const next =
                  f.type === "expense"
                    ? `$${f.nextDay.toFixed(2)}`
                    : `${f.nextDay.toFixed(1)}${cfg.unit}`;
                const week =
                  f.type === "expense"
                    ? `$${f.next7DaySum.toFixed(2)}`
                    : `${f.next7DaySum.toFixed(1)}${cfg.unit}`;
                return (
                  <div
                    key={f.type}
                    className="rounded-lg border border-border/80 bg-secondary/30 px-4 py-3 text-sm"
                  >
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {cfg.emoji} {cfg.label}
                    </div>
                    <div className="mt-1 font-semibold">Tomorrow (est.): {next}</div>
                    <div className="text-xs text-muted-foreground">
                      Next 7 days (sum): {week} · fit R² {(f.r2 * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>

            <Tabs value={predictionTabEffective} onValueChange={(v) => setPredictionTab(v as EntryType)}>
              <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/50 p-1 h-auto min-h-10">
                {mlForecasts.map((f) => (
                  <TabsTrigger key={f.type} value={f.type} className="gap-1">
                    {TRACKERS[f.type].emoji} {TRACKERS[f.type].label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {mlForecasts.map((f) => {
                const chartRows = forecastChartByType.get(f.type) ?? [];
                return (
                <TabsContent key={f.type} value={f.type} className="mt-4">
                  {chartRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Not enough variation to plot a trend.</p>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartRows}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} interval="preserveStartEnd" angle={-30} textAnchor="end" height={48} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: 12,
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            name="Actual"
                            stroke={TRACKERS[f.type].colorVar}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            name="Trend + forecast"
                            stroke={TRACKERS[f.type].colorVar}
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            dot={{ r: 3 }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Dashed segment extends the least-squares line {FORECAST_DAYS} days past your latest day ({TRACKERS[f.type].label}).
                  </p>
                </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </Card>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">💸 Daily expenses</h2>
          <p className="text-sm text-muted-foreground">Last 14 days</p>
          {loading ? <Skeleton className="mt-4 h-64 w-full" /> : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Bar dataKey="expense" fill="hsl(var(--tracker-expense))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">💤 Sleep trend</h2>
          <p className="text-sm text-muted-foreground">Hours per night</p>
          {loading ? <Skeleton className="mt-4 h-64 w-full" /> : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="sleep" stroke="hsl(var(--tracker-sleep))" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">📚 Study & 🏃 Exercise</h2>
          <p className="text-sm text-muted-foreground">Daily totals</p>
          {loading ? <Skeleton className="mt-4 h-64 w-full" /> : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="study" stroke="hsl(var(--tracker-study))" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="exercise" stroke="hsl(var(--tracker-exercise))" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Spending by category</h2>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
          {loading ? <Skeleton className="mt-4 h-64 w-full" /> : expenseByCategory.length === 0 ? (
            <div className="mt-4 flex h-64 items-center justify-center text-sm text-muted-foreground">
              No expense data yet.
            </div>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: number) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Recent entries */}
      <Card className="mt-6 p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Recent entries</h2>
        {loading ? (
          <div className="mt-4 space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No entries yet — add your first one!</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {entries.slice(0, 8).map((e) => {
              const cfg = TRACKERS[e.type];
              return (
                <li key={e.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-lg">{cfg.emoji}</span>
                    <div>
                      <div className="text-sm font-medium">{cfg.label} {e.category && <span className="text-muted-foreground">· {e.category}</span>}</div>
                      <div className="text-xs text-muted-foreground">{format(parseISO(e.entry_date), "MMM d, yyyy")}{e.note ? ` · ${e.note}` : ""}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{e.type === "expense" ? `$${Number(e.amount).toFixed(2)}` : `${Number(e.amount)}${cfg.unit}`}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  );
};

export default Dashboard;
