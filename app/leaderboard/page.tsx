"use client";
import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CircularProgress from "../components/CircularProgress";
import { supabase } from "../../lib/supabase";
import { getClientId } from "../../lib/clientId";
import { podiumRankContent, podiumRankIsMedal } from "../../lib/podiumRank";

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

const PAGE_SIZE = 20;
const LEADERBOARD_FETCH_CAP = 500;

const industryTabs = ["Global", "Tech", "Design", "Finance", "Marketing", "Product"];

const industryKeywords: Record<string, string[]> = {
  Tech: ["software", "engineer", "developer", "data", "ml", "ai", "devops", "cloud", "security", "frontend", "backend", "full"],
  Design: ["design", "ux", "ui", "product designer", "visual", "creative"],
  Finance: ["finance", "analyst", "banking", "accounting", "investment"],
  Marketing: ["marketing", "content", "seo", "growth", "brand", "social"],
  Product: ["product manager", "product owner", "pm", "program manager"],
};

function filterByTab(rows: RoastRow[], tab: string) {
  if (tab === "Global") return rows;
  const keywords = industryKeywords[tab] ?? [];
  return rows.filter((r) =>
    keywords.some((k) => r.industry?.toLowerCase().includes(k))
  );
}

/** Highlight row for this browser (stored client_id) or legacy rows matched by session name only */
function isYourRow(row: RoastRow, myClientId: string | null, sessionCandidateName: string | null) {
  const rowClient = row.client_id ?? null;
  if (myClientId && rowClient === myClientId) return true;
  if (!rowClient && sessionCandidateName?.trim()) {
    return row.candidate_name.trim().toLowerCase() === sessionCandidateName.trim().toLowerCase();
  }
  return false;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("Global");
  const [allRows, setAllRows] = useState<RoastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exactRank, setExactRank] = useState<number | null>(null);
  const [exactTotal, setExactTotal] = useState<number | null>(null);
  const [mostCookedVisible, setMostCookedVisible] = useState(PAGE_SIZE);
  const [leastCookedVisible, setLeastCookedVisible] = useState(PAGE_SIZE);

  const myClientId = useSyncExternalStore(
    () => () => {},
    () => getClientId(),
    () => null,
  );

  // Last roast from this session (sidebar + legacy name highlight)
  const lastResult = typeof window !== "undefined" ? (() => {
    try { return JSON.parse(sessionStorage.getItem("roastResult") ?? "null"); } catch { return null; }
  })() : null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("roasts")
        .select("id, created_at, candidate_name, client_id, cooked_score, industry, industry_rank, months_until_cooked")
        .order("created_at", { ascending: false })
        .limit(LEADERBOARD_FETCH_CAP);
      if (!error && data) setAllRows(data);
      setLoading(false);
    }
    load();
  }, []);

  // Compute user's exact rank server-side so it's accurate even with thousands of entries
  useEffect(() => {
    if (!lastResult) return;
    async function loadRank() {
      const rankQuery = supabase
        .from("roasts")
        .select("*", { count: "exact", head: true })
        .gt("cooked_score", lastResult.cookedScore);
      const totalQuery = supabase
        .from("roasts")
        .select("*", { count: "exact", head: true });

      const [{ count: above }, { count: total }] = await Promise.all([rankQuery, totalQuery]);
      setExactRank((above ?? 0) + 1);
      setExactTotal(total ?? 0);
    }
    loadRank();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult?.cookedScore]);

  const filtered = filterByTab(allRows, activeTab);
  const allMostCooked = [...filtered].sort((a, b) => b.cooked_score - a.cooked_score);
  const allLeastCooked = [...filtered].filter((r) => r.cooked_score < 50).sort((a, b) => a.cooked_score - b.cooked_score);
  const mostCooked = allMostCooked.slice(0, mostCookedVisible);
  const leastCooked = allLeastCooked.slice(0, leastCookedVisible);
  const avgScore = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.cooked_score, 0) / filtered.length) : 0;
  const sessionName = typeof lastResult?.candidateName === "string" ? lastResult.candidateName : null;

  return (
    <div style={{ background: "#FAF7F2", minHeight: "100vh" }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)", fontWeight: 800, color: "#1a1a1a", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
            Leaderboard <span style={{ fontSize: 32 }}>🏆</span>
          </h1>
          <p style={{ color: "#888", fontSize: 15 }}>
            {filtered.length > 0 ? `${filtered.length} roasts` : "See how cooked everyone is"}
          </p>
        </div>

        {/* Coffee banner */}
        <a href="https://buymeacoffee.com/taratdev" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 12, padding: "12px 18px", marginBottom: 16, textDecoration: "none", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>☕</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>This roaster runs on coffee</div>
              <div style={{ fontSize: 12, color: "#b45309" }}>AI credits aren't free — buy me a coffee to keep this running for everyone</div>
            </div>
          </div>
          <div style={{ background: "#f59e0b", color: "white", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
            Buy me a coffee →
          </div>
        </a>

        {/* Pro CTA */}
        <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ color: "white" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Want to improve your score?</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Get AI-powered suggestions, ATS score, and line-by-line fixes.</div>
          </div>
          <Link href="/improve" style={{ 
            background: "white", 
            color: "#667eea", 
            border: "none", 
            borderRadius: 8, 
            padding: "10px 18px", 
            fontSize: 13, 
            fontWeight: 700, 
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            Try Pro Analyzer
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {industryTabs.map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setMostCookedVisible(PAGE_SIZE); setLeastCookedVisible(PAGE_SIZE); }}
              style={{ padding: "8px 20px", borderRadius: 999, border: "1px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", background: activeTab === tab ? "#1a1a1a" : "white", color: activeTab === tab ? "white" : "#555", borderColor: activeTab === tab ? "#1a1a1a" : "#EAE6DF" }}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#aaa", fontSize: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔥</div>
            Loading roasts...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😶‍🌫️</div>
            <p style={{ color: "#aaa", fontSize: 16, marginBottom: 20 }}>No roasts yet for this filter.</p>
            <Link href="/upload" className="btn-primary">Be the first to get roasted →</Link>
          </div>
        ) : (
          <div className="leaderboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 320px", gap: 24 }}>

            {/* Most Cooked */}
            <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #EAE6DF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1 }}>
                  <span style={{ fontWeight: 700, color: "#1a1a1a", fontSize: 16 }}>Most Cooked</span>
                  <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>🔥</span>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2, lineHeight: 1.25 }}>descending disaster · {allMostCooked.length} total</div>
              </div>
              <div style={{ padding: "8px 0" }}>
                {mostCooked.map((p, i) => {
                  const isYou = isYourRow(p, myClientId, sessionName);
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: i < mostCooked.length - 1 ? "1px solid #FAF7F2" : "none", background: isYou ? "rgba(255, 107, 61, 0.1)" : undefined, boxShadow: isYou ? "inset 3px 0 0 #FF6B3D" : undefined }}>
                      <span aria-label={`Rank ${i + 1}`} style={{ width: 26, flexShrink: 0, textAlign: "left", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: podiumRankIsMedal(i) ? undefined : "#ccc", fontSize: podiumRankIsMedal(i) ? 17 : 13, lineHeight: 1, display: "flex", alignItems: "center" }}>
                        {podiumRankContent(i)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: isYou ? 800 : 600, fontSize: 13, color: isYou ? "#FF6B3D" : "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.candidate_name}</div>
                        <div style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.industry}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontWeight: 800, color: "#FF6B3D", fontSize: 15 }}>{p.cooked_score}</span>
                        <span style={{ fontSize: 13 }}>🔥</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {mostCookedVisible < allMostCooked.length && (
                <div style={{ padding: "12px 24px", borderTop: "1px solid #EAE6DF" }}>
                  <button type="button" onClick={() => setMostCookedVisible((v) => Math.min(v + PAGE_SIZE, LEADERBOARD_FETCH_CAP))}
                    style={{ width: "100%", background: "#FAF7F2", border: "1px solid #EAE6DF", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer" }}>
                    Load more ({allMostCooked.length - mostCookedVisible} remaining)
                  </button>
                </div>
              )}
            </div>

            {/* Least Cooked */}
            <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #EAE6DF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1 }}>
                  <span style={{ fontWeight: 700, color: "#1a1a1a", fontSize: 16 }}>Least Cooked</span>
                  <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>😎</span>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2, lineHeight: 1.25 }}>surviving the apocalypse · score &lt; 50</div>
              </div>
              <div style={{ padding: "8px 0" }}>
                {leastCooked.length === 0 ? (
                  <div style={{ padding: "32px 24px", textAlign: "center", color: "#bbb", fontSize: 13 }}>No survivors yet — be the first to score under 50.</div>
                ) : leastCooked.map((p, i) => {
                  const isYou = isYourRow(p, myClientId, sessionName);
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: i < leastCooked.length - 1 ? "1px solid #FAF7F2" : "none", background: isYou ? "rgba(16, 185, 129, 0.1)" : undefined, boxShadow: isYou ? "inset 3px 0 0 #10B981" : undefined }}>
                      <span aria-label={`Rank ${i + 1}`} style={{ width: 26, flexShrink: 0, textAlign: "left", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: podiumRankIsMedal(i) ? undefined : "#ccc", fontSize: podiumRankIsMedal(i) ? 17 : 13, lineHeight: 1, display: "flex", alignItems: "center" }}>
                        {podiumRankContent(i)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: isYou ? 800 : 600, fontSize: 13, color: isYou ? "#059669" : "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.candidate_name}</div>
                        <div style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.industry}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontWeight: 800, color: "#10B981", fontSize: 15 }}>{p.cooked_score}</span>
                        <span style={{ fontSize: 13 }}>✅</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {leastCookedVisible < allLeastCooked.length && (
                <div style={{ padding: "12px 24px", borderTop: "1px solid #EAE6DF" }}>
                  <button type="button" onClick={() => setLeastCookedVisible((v) => Math.min(v + PAGE_SIZE, LEADERBOARD_FETCH_CAP))}
                    style={{ width: "100%", background: "#FAF7F2", border: "1px solid #EAE6DF", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer" }}>
                    Load more ({allLeastCooked.length - leastCookedVisible} remaining)
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Industry average */}
              <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 20 }}>
                  {activeTab} Average
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <CircularProgress value={avgScore} size={120} color="#FF6B3D" label="/100" />
                </div>
                <p style={{ textAlign: "center", fontSize: 13, color: "#666" }}>
                  {filtered.length} people roasted · avg score <strong>{avgScore}</strong>
                </p>
              </div>

              {/* Your rank */}
              {lastResult && (
                <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, padding: "24px" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 16 }}>📍 Your Rank</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                    <Image src="/logo.png" alt="you" width={50} height={50} style={{ objectFit: "contain" }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 26, color: "#1a1a1a" }}>
                        {exactRank !== null ? `#${exactRank}` : "…"}
                      </div>
                      <div style={{ fontSize: 13, color: "#aaa" }}>
                        of {exactTotal !== null ? exactTotal : "…"} people
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <span style={{ fontWeight: 700, color: "#FF6B3D", fontSize: 16 }}>{lastResult.cookedScore}</span>
                        <span>🔥</span>
                        <span style={{ fontSize: 12, color: "#aaa" }}>cooked risk · higher is worse</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Link href="/result" className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", fontSize: 13 }}>
                      View full roast →
                    </Link>
                    <Link
                      href="/upload"
                      style={{
                        display: "block",
                        textAlign: "center",
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "10px 16px",
                        borderRadius: 12,
                        border: "1px solid #EAE6DF",
                        background: "#FAF7F2",
                        color: "#555",
                      }}
                    >
                      Improve my score
                    </Link>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 16 }}>📊 Stats</div>
                {[
                  { label: "Total roasted", value: filtered.length.toString() },
                  { label: "Most common industry", value: (() => {
                    const counts: Record<string, number> = {};
                    filtered.forEach((r) => { if (r.industry) counts[r.industry] = (counts[r.industry] ?? 0) + 1; });
                    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
                  })() },
                  { label: "Highest score", value: mostCooked[0] ? `${mostCooked[0].cooked_score} 🔥` : "—" },
                  { label: "Lowest score", value: leastCooked[0] ? `${leastCooked[0].cooked_score} ✅` : "—" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
                    <span style={{ fontSize: 13, color: "#666", flexShrink: 0 }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: "#1a1a1a", fontSize: 13, textAlign: "right", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Sticky CTA */}
      <div style={{ background: "#1a1a1a", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
        <p style={{ color: "white", fontWeight: 600, fontSize: 16, margin: 0 }}>Think you can do better? 😏</p>
        <Link href="/upload" className="btn-primary">Roast My Resume →</Link>
      </div>
    </div>
  );
}
