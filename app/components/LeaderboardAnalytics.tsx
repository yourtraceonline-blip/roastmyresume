"use client";

import { useId, useMemo, type CSSProperties, type ReactNode } from "react";

/* Leaderboard AI cohort insights (MiMo + /api/leaderboard-insights + lib/leaderboardInsights.ts) — disabled for now; restore later. */

interface RoastRow {
  id: string;
  created_at: string;
  candidate_name: string;
  client_id?: string | null;
  cooked_score: number;
  industry: string;
  industry_rank: number;
  months_until_cooked: number;
}

interface LeaderboardAnalyticsProps {
  rows: RoastRow[];
}

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

type TrendPoint = { label: string; count: number };

function buildTrendSeries(rows: RoastRow[]): { points: TrendPoint[]; granularity: "month" | "week"; momDelta: number | null } {
  if (rows.length === 0) return { points: [], granularity: "month", momDelta: null };

  const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const byMonth = new Map<string, number>();
  sorted.forEach((r) => {
    const k = monthSortKey(r.created_at);
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  });
  const monthKeys = [...byMonth.keys()].sort((a, b) => a.localeCompare(b));
  const monthPoints: TrendPoint[] = monthKeys.map((k) => ({ label: labelFromMonthKey(k), count: byMonth.get(k)! }));

  let points: TrendPoint[] = monthPoints;
  let granularity: "month" | "week" = "month";

  if (monthKeys.length <= 1) {
    const byWeek = new Map<string, number>();
    sorted.forEach((r) => {
      const k = mondayWeekKey(r.created_at);
      byWeek.set(k, (byWeek.get(k) ?? 0) + 1);
    });
    const weekKeys = [...byWeek.keys()].sort((a, b) => a.localeCompare(b)).slice(-12);
    points = weekKeys.map((k) => ({ label: labelFromWeekKey(k), count: byWeek.get(k)! }));
    granularity = "week";
  }

  const lastTwo = points.slice(-2);
  let momDelta: number | null = null;
  if (lastTwo.length === 2 && lastTwo[0]!.count > 0) {
    momDelta = ((lastTwo[1]!.count - lastTwo[0]!.count) / lastTwo[0]!.count) * 100;
  }

  const display = points.length > 8 ? points.slice(-8) : points;
  return { points: display, granularity, momDelta };
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

const tx = {
  ink: "#141414",
  muted: "#5c574f",
  faint: "#8a847c",
  line: "#E4DFD6",
  surface: "#FFFFFF",
  wash: "#ebe6de",
  track: "#f3efe8",
};

/** Lower = better (matches ✅ / least-cooked framing). */
function scoreHeat(avg: number): string {
  if (avg < 28) return "#0f766e";
  if (avg < 40) return "#0d9488";
  if (avg < 52) return "#16a34a";
  if (avg < 62) return "#ca8a04";
  if (avg < 74) return "#ea580c";
  return "#b91c1c";
}

type RawIndustryStat = { label: string; n: number; avg: number; median: number };

function aggregateRawIndustries(rows: RoastRow[]): RawIndustryStat[] {
  const map = new Map<string, number[]>();
  for (const r of rows) {
    const raw = (r.industry || "").trim();
    const key = raw.length ? raw : "Unspecified";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r.cooked_score);
  }
  const out: RawIndustryStat[] = [];
  for (const [label, scores] of map) {
    const sorted = [...scores].sort((a, b) => a - b);
    const n = sorted.length;
    const avg = sorted.reduce((a, b) => a + b, 0) / n;
    out.push({ label, n, avg, median: medianSorted(sorted) });
  }
  return out;
}

function minSample(rowsLen: number): number {
  if (rowsLen >= 80) return 3;
  if (rowsLen >= 25) return 2;
  return 1;
}

function truncate(s: string, max = 44): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function Panel({ title, children, style }: { title: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: tx.surface,
        border: `1px solid ${tx.line}`,
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 18px rgba(20,20,20,0.05)",
        ...style,
      }}
    >
      <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: tx.ink, letterSpacing: "-0.02em" }}>{title}</h3>
      {children}
    </div>
  );
}

function StatRibbon({ rows }: { rows: RoastRow[] }) {
  const { p50, p90, n } = useMemo(() => {
    const s = rows.map((r) => r.cooked_score).sort((a, b) => a - b);
    return {
      p50: Math.round(percentile(s, 50)),
      p90: Math.round(percentile(s, 90)),
      n: rows.length,
    };
  }, [rows]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "10px 20px",
        padding: "12px 16px",
        borderRadius: 14,
        border: `1px solid ${tx.line}`,
        background: tx.track,
        marginBottom: 14,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: tx.muted }}>Lower score = better · same scale as the board</span>
      <span style={{ fontSize: 12, color: tx.ink, fontVariantNumeric: "tabular-nums" }}>
        <strong>{n}</strong> roasts
      </span>
      <span style={{ fontSize: 12, color: tx.muted }}>
        median <strong style={{ color: tx.ink }}>{p50}</strong>
      </span>
      <span style={{ fontSize: 12, color: tx.muted }}>
        harsh top decile ≈ <strong style={{ color: tx.ink }}>{p90}+</strong>
      </span>
    </div>
  );
}

/** Horizontal bar 0–100 = avg cooked for that resume industry line. */
function IndustryAvgChart({
  title,
  rows,
  mode,
}: {
  title: string;
  rows: RawIndustryStat[];
  mode: "safest" | "toughest";
}) {
  const minN = useMemo(() => minSample(rows.reduce((s, r) => s + r.n, 0)), [rows]);
  const list = useMemo(() => {
    const qualified = rows.filter((r) => r.n >= minN);
    const sorted =
      mode === "safest"
        ? [...qualified].sort((a, b) => a.avg - b.avg || b.n - a.n)
        : [...qualified].sort((a, b) => b.avg - a.avg || b.n - a.n);
    return sorted.slice(0, 12);
  }, [rows, mode, minN]);

  if (list.length === 0) {
    return (
      <Panel title={title}>
        <p style={{ margin: 0, fontSize: 12, color: tx.faint }}>Need more roasts per industry line to rank.</p>
      </Panel>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Panel title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((r, idx) => (
          <div key={r.label} title={`${r.label} — n=${r.n}, avg ${r.avg.toFixed(1)}, med ${r.median}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 650, color: tx.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                {mode === "safest" && idx < 3 ? `${medals[idx]} ` : ""}
                {truncate(r.label, mode === "safest" && idx < 3 ? 36 : 40)}
              </span>
              <span style={{ fontSize: 11, color: tx.faint, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                n={r.n} · <strong style={{ color: scoreHeat(r.avg) }}>{r.avg.toFixed(1)}</strong> avg
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 6, background: tx.wash, border: `1px solid ${tx.line}`, overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, r.avg))}%`,
                  height: "100%",
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${scoreHeat(r.avg)} 0%, ${scoreHeat(r.avg)}cc 100%)`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** Volume chart: busiest resume industry lines; color = how hot averages are. */
function IndustryVolumeChart({ rows }: { rows: RawIndustryStat[] }) {
  const list = useMemo(() => {
    return [...rows].sort((a, b) => b.n - a.n).slice(0, 14);
  }, [rows]);
  const maxN = Math.max(...list.map((r) => r.n), 1);

  return (
    <Panel title="Where the roasts come from">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((r) => {
          const w = (r.n / maxN) * 100;
          return (
            <div key={r.label} title={`${r.label} — ${r.n} roasts, avg score ${r.avg.toFixed(1)}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 650, color: tx.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                  {truncate(r.label, 48)}
                </span>
                <span style={{ fontSize: 11, color: tx.faint, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  <strong style={{ color: tx.ink }}>{r.n}</strong> · avg <strong style={{ color: scoreHeat(r.avg) }}>{r.avg.toFixed(1)}</strong>
                </span>
              </div>
              <div style={{ height: 12, borderRadius: 8, background: tx.wash, border: `1px solid ${tx.line}`, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.max(4, w)}%`,
                    height: "100%",
                    borderRadius: 7,
                    background: `linear-gradient(90deg, ${scoreHeat(r.avg)} 0%, ${scoreHeat(r.avg)}99 100%)`,
                    transition: "width 0.45s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ScoreHistogram({ rows }: { rows: RoastRow[] }) {
  const buckets = useMemo(() => {
    const b = Array(10).fill(0);
    rows.forEach((r) => {
      const idx = Math.min(Math.floor(r.cooked_score / 10), 9);
      b[idx]++;
    });
    return b;
  }, [rows]);
  const max = Math.max(...buckets, 1);
  const labels = ["0–9", "10–19", "20–29", "30–39", "40–49", "50–59", "60–69", "70–79", "80–89", "90+"];

  return (
    <Panel title="All scores">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
        {buckets.map((count, i) => {
          const h = (count / max) * 100;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: count ? tx.muted : "transparent", minHeight: 12, fontVariantNumeric: "tabular-nums" }}>{count || ""}</div>
              <div style={{ width: "100%", height: 78, display: "flex", alignItems: "flex-end", background: tx.track, borderRadius: 6, border: `1px solid ${tx.line}`, overflow: "hidden" }}>
                <div
                  style={{
                    width: "100%",
                    height: `${h}%`,
                    minHeight: count ? 3 : 0,
                    background: count ? `linear-gradient(180deg, ${scoreHeat(i * 10 + 5)} 0%, ${scoreHeat(i * 10 + 5)}cc)` : "transparent",
                    borderRadius: "4px 4px 0 0",
                  }}
                  title={`${labels[i]}: ${count}`}
                />
              </div>
              <div style={{ fontSize: 8, color: tx.faint, fontWeight: 600, textAlign: "center", lineHeight: 1.15 }}>{labels[i]}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function RoastTrendChart({ rows }: { rows: RoastRow[] }) {
  const uid = useId().replace(/:/g, "");
  const fillId = `tf-${uid}`;
  const strokeId = `ts-${uid}`;
  const { points, granularity, momDelta } = useMemo(() => buildTrendSeries(rows), [rows]);
  const max = Math.max(...points.map((p) => p.count), 1);
  const chartH = 72;
  const pad = { top: 8, right: 8, bottom: 22, left: 28 };
  const width = 280;
  const height = chartH + pad.top + pad.bottom;
  const plotW = width - pad.left - pad.right;
  const plotH = chartH;

  if (points.length === 0) {
    return (
      <Panel title="Volume">
        <p style={{ margin: 0, fontSize: 11, color: tx.faint }}>—</p>
      </Panel>
    );
  }

  const stepX = plotW / Math.max(points.length - 1, 1);
  const linePath = points
    .map((p, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + plotH - (p.count / max) * plotH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const areaPath = linePath + ` L ${pad.left + (points.length - 1) * stepX} ${pad.top + plotH} L ${pad.left} ${pad.top + plotH} Z`;

  return (
    <Panel title="Volume">
      {points.length >= 2 && momDelta !== null ? (
        <div style={{ fontSize: 11, color: tx.muted, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
          Last vs prior: <strong style={{ color: momDelta >= 0 ? "#c2410c" : "#0f766e" }}>{momDelta >= 0 ? "+" : ""}{momDelta.toFixed(0)}%</strong>
          {granularity === "week" ? " WoW" : " MoM"}
        </div>
      ) : null}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={pad.left} y1={pad.top + plotH} x2={width - pad.right} y2={pad.top + plotH} stroke={tx.line} strokeWidth={1} />
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path d={linePath} fill="none" stroke={`url(#${strokeId})`} strokeWidth={2} strokeLinecap="round" />
        {points.map((p, i) => {
          const x = pad.left + i * stepX;
          const y = pad.top + plotH - (p.count / max) * plotH;
          return <circle key={i} cx={x} cy={y} r={3.5} fill={tx.surface} stroke="#c2410c" strokeWidth={1.5} />;
        })}
        {points.map((p, i) => (
          <text key={`t-${i}`} x={pad.left + i * stepX} y={height - 4} textAnchor="middle" fontSize={9} fill={tx.faint} fontWeight={600}>
            {p.label}
          </text>
        ))}
      </svg>
    </Panel>
  );
}

export default function LeaderboardAnalytics({ rows }: LeaderboardAnalyticsProps) {
  if (rows.length === 0) return null;

  const byIndustry = useMemo(() => aggregateRawIndustries(rows), [rows]);

  return (
    <section style={{ marginTop: 36 }} aria-labelledby="leaderboard-analytics-heading">
      <h2
        id="leaderboard-analytics-heading"
        style={{
          fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
          fontWeight: 800,
          color: tx.ink,
          margin: "0 0 6px",
          letterSpacing: "-0.03em",
        }}
      >
        Industry lines on resumes
      </h2>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: tx.muted, maxWidth: 640, lineHeight: 1.45 }}>
        Same text people typed as industry (Medical Diagnostics, ML Engineering, …). Teal = cooler averages, red = hotter.
      </p>

      <StatRibbon rows={rows} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <IndustryAvgChart title="Safest lines (lowest avg)" rows={byIndustry} mode="safest" />
        <IndustryAvgChart title="Toughest lines (highest avg)" rows={byIndustry} mode="toughest" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <IndustryVolumeChart rows={byIndustry} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: 14,
        }}
      >
        <ScoreHistogram rows={rows} />
        <RoastTrendChart rows={rows} />
      </div>
    </section>
  );
}
