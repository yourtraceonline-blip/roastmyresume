/**
 * Cohort payload + AI response parsing for `/api/leaderboard-insights`.
 * DISABLED FROM PRODUCT (route + UI off); kept for an easy restore later.
 */

export type LeaderboardInsightIndustry = { label: string; n: number; avg: number; median: number };

export type LeaderboardInsightPayload = {
  tab: string;
  n: number;
  percentiles: { p10: number; p25: number; p50: number; p75: number; p90: number };
  pctUnder50: number;
  pctGte60: number;
  histogram10: number[];
  industries: LeaderboardInsightIndustry[];
  trend: { label: string; count: number }[];
};

export type LeaderboardAiTheme = { theme: string; weight: number; note: string };
export type LeaderboardAiCallout = { industry: string; signal: "safer" | "neutral" | "hotter"; take: string };

export type LeaderboardAiInsight = {
  headline: string;
  subhead?: string;
  bullets: string[];
  themes: LeaderboardAiTheme[];
  industryCallouts: LeaderboardAiCallout[];
  caveat?: string;
};

const MAX_INDUSTRY_ROWS = 28;

function monthSortKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function labelFromMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function mondayWeekKey(iso: string): string {
  const d = new Date(iso);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}

function labelFromWeekKey(key: string): string {
  const d = new Date(key + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

function medianSorted(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m]! : (sorted[m - 1]! + sorted[m]!) / 2;
}

function buildTrendForPayload(
  rows: { created_at: string }[],
): { label: string; count: number }[] {
  if (rows.length === 0) return [];
  const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const byMonth = new Map<string, number>();
  sorted.forEach((r) => {
    const k = monthSortKey(r.created_at);
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  });
  const monthKeys = [...byMonth.keys()].sort((a, b) => a.localeCompare(b));
  let points = monthKeys.map((k) => ({ label: labelFromMonthKey(k), count: byMonth.get(k)! }));

  if (monthKeys.length <= 1) {
    const byWeek = new Map<string, number>();
    sorted.forEach((r) => {
      const k = mondayWeekKey(r.created_at);
      byWeek.set(k, (byWeek.get(k) ?? 0) + 1);
    });
    const weekKeys = [...byWeek.keys()].sort((a, b) => a.localeCompare(b)).slice(-12);
    points = weekKeys.map((k) => ({ label: labelFromWeekKey(k), count: byWeek.get(k)! }));
  }

  return points.length > 8 ? points.slice(-8) : points;
}

export function buildLeaderboardInsightPayload(
  rows: { cooked_score: number; industry: string; created_at: string }[],
  tab: string,
): LeaderboardInsightPayload {
  const scores = rows.map((r) => r.cooked_score).sort((a, b) => a - b);
  const n = rows.length;
  const map = new Map<string, number[]>();
  for (const r of rows) {
    const raw = (r.industry || "").trim();
    const key = raw.length ? raw : "Unspecified";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r.cooked_score);
  }
  const stats: LeaderboardInsightIndustry[] = [];
  for (const [label, sc] of map) {
    const sorted = [...sc].sort((a, b) => a - b);
    const nn = sorted.length;
    stats.push({
      label,
      n: nn,
      avg: sorted.reduce((a, b) => a + b, 0) / nn,
      median: medianSorted(sorted),
    });
  }
  stats.sort((a, b) => b.n - a.n);
  const head = stats.slice(0, MAX_INDUSTRY_ROWS);
  const tail = stats.slice(MAX_INDUSTRY_ROWS);
  if (tail.length > 0) {
    const allScores = tail.flatMap((t) => {
      const arr = map.get(t.label) ?? [];
      return arr;
    });
    const sorted = [...allScores].sort((a, b) => a - b);
    const tn = sorted.length;
    if (tn > 0) {
      head.push({
        label: "(Other combined)",
        n: tn,
        avg: sorted.reduce((a, b) => a + b, 0) / tn,
        median: medianSorted(sorted),
      });
    }
  }

  const hist = Array(10).fill(0);
  rows.forEach((r) => {
    hist[Math.min(Math.floor(r.cooked_score / 10), 9)]++;
  });

  const trend = buildTrendForPayload(rows);

  return {
    tab: tab.slice(0, 40),
    n,
    percentiles: {
      p10: Math.round(percentile(scores, 10)),
      p25: Math.round(percentile(scores, 25)),
      p50: Math.round(percentile(scores, 50)),
      p75: Math.round(percentile(scores, 75)),
      p90: Math.round(percentile(scores, 90)),
    },
    pctUnder50: n ? Math.round((scores.filter((x) => x < 50).length / n) * 100) : 0,
    pctGte60: n ? Math.round((scores.filter((x) => x >= 60).length / n) * 100) : 0,
    histogram10: hist,
    industries: head,
    trend,
  };
}

export function allowedIndustryLabelsFromPayload(payload: LeaderboardInsightPayload): Set<string> {
  return new Set(payload.industries.map((i) => i.label));
}

function clampStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function clampNum(n: unknown, lo: number, hi: number, fallback: number): number {
  const x = typeof n === "number" && !Number.isNaN(n) ? n : Number(n);
  if (Number.isNaN(x)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(x)));
}

export function parseLeaderboardAiInsight(raw: unknown, allowedIndustries: Set<string>): LeaderboardAiInsight | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const headline = clampStr(o.headline, 140);
  if (!headline) return null;

  const subhead = o.subhead !== undefined ? clampStr(o.subhead, 200) : undefined;

  const bulletsRaw = Array.isArray(o.bullets) ? o.bullets : [];
  const bullets = bulletsRaw
    .filter((x): x is string => typeof x === "string")
    .map((b) => clampStr(b, 130))
    .filter(Boolean)
    .slice(0, 4);

  const themesRaw = Array.isArray(o.themes) ? o.themes : [];
  const themes: LeaderboardAiTheme[] = [];
  for (const t of themesRaw.slice(0, 6)) {
    if (!t || typeof t !== "object") continue;
    const tr = t as Record<string, unknown>;
    const theme = clampStr(tr.theme, 56);
    const note = clampStr(tr.note, 100);
    if (!theme) continue;
    themes.push({
      theme,
      note,
      weight: clampNum(tr.weight, 5, 100, 50),
    });
  }

  const callRaw = Array.isArray(o.industryCallouts) ? o.industryCallouts : [];
  const industryCallouts: LeaderboardAiCallout[] = [];
  for (const c of callRaw.slice(0, 10)) {
    if (!c || typeof c !== "object") continue;
    const cr = c as Record<string, unknown>;
    const industry = clampStr(cr.industry, 120);
    const take = clampStr(cr.take, 140);
    const sig = cr.signal === "safer" || cr.signal === "neutral" || cr.signal === "hotter" ? cr.signal : null;
    if (!industry || !take || !sig) continue;
    if (!allowedIndustries.has(industry)) continue;
    industryCallouts.push({ industry, signal: sig, take });
  }

  const caveat = o.caveat !== undefined ? clampStr(o.caveat, 160) : undefined;

  return { headline, subhead: subhead || undefined, bullets, themes, industryCallouts, caveat };
}

export function cacheKeyForInsights(tab: string, payload: LeaderboardInsightPayload): string {
  const sig = `${tab}|${payload.n}|${payload.industries.map((i) => `${i.label}:${i.n}:${i.avg.toFixed(1)}`).join("|")}`;
  let h = 0;
  for (let i = 0; i < sig.length; i++) h = (Math.imul(31, h) + sig.charCodeAt(i)) | 0;
  return `lb_insight_v1_${tab}_${payload.n}_${h}`;
}
