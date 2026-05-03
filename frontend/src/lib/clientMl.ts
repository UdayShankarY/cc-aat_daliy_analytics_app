import type { EntryType } from "@/lib/trackers";

/** Daily aggregate row (same shape as Dashboard `series`). */
export type MlDailyRow = {
  date: string;
  label: string;
  expense: number;
  sleep: number;
  study: number;
  exercise: number;
};

export type LinearModel = {
  slope: number;
  intercept: number;
  r2: number;
  predict: (x: number) => number;
};

/**
 * Ordinary least squares. x is usually 0 .. n-1 (day index).
 */
export function fitLinearRegression(xs: number[], ys: number[]): LinearModel | null {
  const n = xs.length;
  if (n < 3 || n !== ys.length) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept;
    const dy = ys[i] - meanY;
    ssTot += dy * dy;
    ssRes += (ys[i] - pred) ** 2;
  }

  const r2 = ssTot > 1e-12 ? 1 - ssRes / ssTot : 0;

  return {
    slope,
    intercept,
    r2: Math.max(0, Math.min(1, r2)),
    predict: (x: number) => slope * x + intercept,
  };
}

export type MetricForecast = {
  type: EntryType;
  /** Best single-step estimate (tomorrow). */
  nextDay: number;
  /** Sum of predicted daily values for the next 7 days (useful for expense “week ahead”). */
  next7DaySum: number;
  r2: number;
};

const METRIC_KEYS: Record<EntryType, keyof Pick<MlDailyRow, "expense" | "sleep" | "study" | "exercise">> = {
  expense: "expense",
  sleep: "sleep",
  study: "study",
  exercise: "exercise",
};

/** Per-metric analytics: linear trend + multi-day forward values (clamped at 0). */
export function computeMetricForecasts(rows: MlDailyRow[], types: EntryType[]): MetricForecast[] {
  const n = rows.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const out: MetricForecast[] = [];

  for (const type of types) {
    const key = METRIC_KEYS[type];
    const ys = rows.map((r) => Number(r[key]));
    if (!ys.some((v) => v > 0)) continue;

    const model = fitLinearRegression(xs, ys);
    if (!model) continue;

    let next7 = 0;
    for (let h = 0; h < 7; h++) {
      next7 += Math.max(0, model.predict(n + h));
    }

    out.push({
      type,
      nextDay: Math.max(0, model.predict(n)),
      next7DaySum: next7,
      r2: model.r2,
    });
  }

  return out;
}

/** Points for Recharts: solid “actual”, dashed “predicted” continuation. */
export function buildForecastChartSeries(
  rows: MlDailyRow[],
  metric: EntryType,
  horizon: number,
  futureLabels: string[]
): { label: string; actual: number | null; predicted: number | null }[] {
  const key = METRIC_KEYS[metric];
  const ys = rows.map((r) => Number(r[key]));
  const n = ys.length;
  if (n < 3 || horizon < 1) return [];

  const xs = Array.from({ length: n }, (_, i) => i);
  const model = fitLinearRegression(xs, ys);
  if (!model) return [];

  const points: { label: string; actual: number | null; predicted: number | null }[] = rows.map((r, i) => ({
    label: r.label,
    actual: ys[i],
    predicted: null,
  }));

  const last = points[n - 1]!;
  points[n - 1] = { ...last, predicted: last.actual };

  for (let h = 0; h < horizon; h++) {
    points.push({
      label: futureLabels[h] ?? `+${h + 1}`,
      actual: null,
      predicted: Math.max(0, model.predict(n + h)),
    });
  }

  return points;
}
