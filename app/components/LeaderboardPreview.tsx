"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CircularProgress from "./CircularProgress";
import { supabase } from "../../lib/supabase";
import { podiumRankContent, podiumRankIsMedal } from "../../lib/podiumRank";

interface Row { id: string; candidate_name: string; cooked_score: number; industry: string; }

export default function LeaderboardPreview() {
  const [mostCooked, setMostCooked] = useState<Row[]>([]);
  const [leastCooked, setLeastCooked] = useState<Row[]>([]);
  const [avgScore, setAvgScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("roasts")
        .select("id, candidate_name, cooked_score, industry")
        .order("cooked_score", { ascending: false })
        .limit(100);

      if (data && data.length > 0) {
        const top5 = [...data].sort((a, b) => b.cooked_score - a.cooked_score).slice(0, 5);
        const bottom5 = [...data].sort((a, b) => a.cooked_score - b.cooked_score).slice(0, 5);
        const avg = Math.round(data.reduce((s, r) => s + r.cooked_score, 0) / data.length);
        setMostCooked(top5);
        setLeastCooked(bottom5);
        setAvgScore(avg);
        setTotal(data.length);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-6 py-16" id="examples">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
            🏆 Leaderboard
          </h2>
          <p style={{ color: "#888", fontSize: 15 }}>
            {total > 0 ? `${total} people roasted so far` : "See how cooked everyone is"}
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="w-fit shrink-0 text-sm font-semibold no-underline hover:underline"
          style={{ color: "#FF6B3D" }}
        >
          View full leaderboard →
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontSize: 15 }}>🔥 Loading roasts...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Most Cooked */}
          <div className="card p-6">
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1 }}>
                <span style={{ fontWeight: 700, color: "#1a1a1a", fontSize: 16 }}>Most Cooked</span>
                <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>🔥</span>
              </div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2, lineHeight: 1.25 }}>Top 5 most cooked people</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mostCooked.map((p, i) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    aria-label={`Rank ${i + 1}`}
                    style={{
                      width: 24,
                      flexShrink: 0,
                      textAlign: "left",
                      fontWeight: 700,
                      color: podiumRankIsMedal(i) ? undefined : "#aaa",
                      fontSize: podiumRankIsMedal(i) ? 17 : 13,
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {podiumRankContent(i)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.candidate_name}</div>
                    <div style={{ fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.industry}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontWeight: 700, color: "#FF6B3D", fontSize: 14 }}>{p.cooked_score}</span>
                    <span style={{ fontSize: 14 }}>🔥</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Least Cooked */}
          <div className="card p-6">
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, lineHeight: 1 }}>
                <span style={{ fontWeight: 700, color: "#1a1a1a", fontSize: 16 }}>Least Cooked</span>
                <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>😎</span>
              </div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, lineHeight: 1.25 }}>Top 5 least cooked people</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {leastCooked.map((p, i) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    aria-label={`Rank ${i + 1}`}
                    style={{
                      width: 24,
                      flexShrink: 0,
                      textAlign: "left",
                      fontWeight: 700,
                      color: podiumRankIsMedal(i) ? undefined : "#aaa",
                      fontSize: podiumRankIsMedal(i) ? 17 : 13,
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {podiumRankContent(i)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.candidate_name}</div>
                    <div style={{ fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.industry}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontWeight: 700, color: "#10B981", fontSize: 14 }}>{p.cooked_score}</span>
                    <span style={{ fontSize: 14 }}>✅</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Average */}
          <div className="card p-6">
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", marginBottom: 20 }}>Global Average</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <CircularProgress value={avgScore} size={130} color="#FF6B3D" label="/100" />
            </div>
            <p style={{ textAlign: "center", fontSize: 13, color: "#666", marginBottom: 20 }}>
              {total} people roasted · avg score <strong>{avgScore}</strong>
            </p>
            <Link href="/leaderboard" style={{ display: "block", textAlign: "center", padding: "10px", border: "1px solid #EAE6DF", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#555", textDecoration: "none" }}>
              See Full Insights →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
