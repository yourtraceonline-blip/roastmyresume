"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CircularProgress from "../components/CircularProgress";
import ShareCard from "../components/ShareCard";
import { parseAsteriskBold } from "../../lib/asteriskBold";
import { SCORE_BREAKDOWN_HINTS } from "../../lib/scoreBreakdownHints";

interface RoastResult {
  cookedScore: number;
  monthsUntilCooked: number;
  industryRank: number;
  industry: string;
  roastQuote: string;
  roastBullets: string[];
  harshTruth: string;
  goodNews: string;
  scoreBreakdown: {
    replaceability: number;
    skillDepth: number;
    marketDemand: number;
    growthTrajectory: number;
    aiLeverage: number;
    execution: number;
    resumeQuality: number;
  };
  whatsHoldingBack: { icon: string; title: string; desc: string }[];
  candidateName: string;
}

const DEMO: RoastResult = {
  cookedScore: 82,
  monthsUntilCooked: 9,
  industryRank: 78,
  industry: "Software Development",
  roastQuote: "Your resume looks like it was written by ChatGPT... oh wait, it probably was.",
  roastBullets: [
    "You listed Excel like it's a superpower. It's 2024, not 2010.",
    '"Worked on various projects" is doing a lot of heavy lifting here.',
    "No impact, no numbers, no proof. Just vibes and bullet points.",
    "At this rate, your biggest competition isn't other candidates... it's automation.",
  ],
  harshTruth: "AI can do 60% of the things you claim to do. And it never asks for a salary hike.",
  goodNews: "You can un-cook yourself. We'll show you how.",
  scoreBreakdown: { replaceability: 78, skillDepth: 53, marketDemand: 45, growthTrajectory: 38, aiLeverage: 25, execution: 42, resumeQuality: 60 },
  whatsHoldingBack: [
    { icon: "📋", title: "Too many generic bullet points", desc: "Use specific examples and outcomes." },
    { icon: "📉", title: "Low in-demand skills", desc: "Your skills aren't trending in the market." },
    { icon: "🎯", title: "No measurable impact", desc: "Numbers > Nouns. Show your impact." },
  ],
  candidateName: "Friend",
};

function scoreColor(score: number) {
  if (score >= 70) return "#EF4444";
  if (score >= 45) return "#F59E0B";
  return "#10B981";
}

function ScoreCard({ label, score, hint }: { label: string; score: number; hint?: string }) {
  const color = scoreColor(score);
  return (
    <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: hint ? 2 : 6 }}>{label}</div>
      {hint ? <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.35, marginBottom: 8 }}>{hint}</div> : null}
      <div style={{ fontWeight: 800, fontSize: 28, color, marginBottom: 8 }}>
        {score}<span style={{ fontSize: 13, color: "#ccc", fontWeight: 400 }}>/100</span>
      </div>
      <div style={{ height: 6, background: "#F0EBE3", borderRadius: 999 }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ResultPage() {
  const [result, setResult] = useState<RoastResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [sharing, setSharingType] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const shareRenderBusyRef = useRef(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("roastResult");
    if (stored) {
      try { setResult(JSON.parse(stored)); } catch { setResult(DEMO); setIsDemo(true); }
    } else { setResult(DEMO); setIsDemo(true); }
  }, []);

  const generateImageBlob = async (): Promise<Blob | null> => {
    const el = shareCardRef.current;
    if (!el) return null;
    if (shareRenderBusyRef.current) return null;
    shareRenderBusyRef.current = true;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const rect = el.getBoundingClientRect();
      // windowHeight must cover rect.top + rect.height so a position:fixed card
      // sitting at top:N isn't clipped at the bottom of the iframe viewport.
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.ceil(rect.width) + 4,
        windowHeight: Math.ceil(rect.top + rect.height) + 4,
        // Skip every fixed/sticky element that is NOT the card itself or its
        // ancestors — prevents the Navbar painting over the card in the clone.
        ignoreElements: (element: Element) => {
          if (el === element || el.contains(element) || element.contains(el)) return false;
          const s = window.getComputedStyle(element as HTMLElement);
          return s.position === "fixed" || s.position === "sticky";
        },
      });
      return new Promise((res) => canvas.toBlob((b) => res(b), "image/png", 1));
    } finally {
      shareRenderBusyRef.current = false;
    }
  };

  const shareText = result ? `I'm ${result.cookedScore}% cooked 💀 Check how cooked YOUR resume is → roastmyresume.fun` : "";
  const shareTitle = "My Resume Roast";

  /** Native share sheet with image + caption when the browser supports it. */
  const tryNativeShareImageAndText = async (blob: Blob, text: string): Promise<"shared" | "aborted" | "unsupported"> => {
    const file = new File([blob], "my-roast.png", { type: "image/png" });
    const data: ShareData = { files: [file], text, title: shareTitle };
    if (!navigator.canShare?.(data)) return "unsupported";
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      const name = (e as Error)?.name;
      if (name === "AbortError") return "aborted";
      console.error(e);
      return "unsupported";
    }
  };

  const handleNativeShare = async () => {
    if (sharing || shareRenderBusyRef.current) return;
    setSharingType("native");
    try {
      const blob = await generateImageBlob();
      if (!blob) return;
      const outcome = await tryNativeShareImageAndText(blob, shareText);
      if (outcome === "unsupported") downloadBlob(blob, "my-roast.png");
    } catch (e) {
      console.error(e);
    } finally {
      setSharingType(null);
    }
  };

  const handlePlatformShare = async (platform: "twitter" | "linkedin") => {
    if (sharing || shareRenderBusyRef.current) return;
    setSharingType(platform);
    try {
      const blob = await generateImageBlob();
      if (!blob) return;
      const outcome = await tryNativeShareImageAndText(blob, shareText);
      if (outcome !== "unsupported") return;
      downloadBlob(blob, "my-roast.png");
      const platformUrl = platform === "twitter"
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
        : `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
      setTimeout(() => window.open(platformUrl, "_blank"), 600);
    } catch (e) {
      console.error(e);
    } finally {
      setSharingType(null);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result) return null;
  const r = result;

  const cookLabel = r.cookedScore >= 80 ? "Well done 🔥" : r.cookedScore >= 60 ? "Medium well 🌭" : r.cookedScore >= 40 ? "Medium 😬" : "Rare 🥩";
  const breakdown = [
    { label: "Replaceability", score: r.scoreBreakdown.replaceability, hint: SCORE_BREAKDOWN_HINTS.Replaceability },
    { label: "Skill Depth", score: r.scoreBreakdown.skillDepth, hint: SCORE_BREAKDOWN_HINTS["Skill Depth"] },
    { label: "Market Demand", score: r.scoreBreakdown.marketDemand, hint: SCORE_BREAKDOWN_HINTS["Market Demand"] },
    { label: "Growth Trajectory", score: r.scoreBreakdown.growthTrajectory, hint: SCORE_BREAKDOWN_HINTS["Growth Trajectory"] },
    { label: "AI Leverage", score: r.scoreBreakdown.aiLeverage, hint: SCORE_BREAKDOWN_HINTS["AI Leverage"] },
    { label: "Execution", score: r.scoreBreakdown.execution, hint: SCORE_BREAKDOWN_HINTS.Execution },
    { label: "Resume Quality", score: r.scoreBreakdown.resumeQuality, hint: SCORE_BREAKDOWN_HINTS["Resume Quality"] },
  ];

  return (
    <div style={{ background: "#FAF7F2", minHeight: "100vh" }}>
      <Navbar />

      {isDemo && (
        <div style={{ background: "#FFF0EB", borderBottom: "1px solid #FFCDB8", padding: "10px 24px", textAlign: "center", fontSize: 13, color: "#c0390d" }}>
          ⚠️ Sample roast —{" "}
          <Link href="/upload" style={{ fontWeight: 700, color: "#FF6B3D" }}>upload your resume</Link>{" "}
          for the real deal.
        </div>
      )}

      {/* Download bar */}
      <div style={{ background: "white", borderBottom: "1px solid #EAE6DF", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#888" }}>{r.candidateName}&apos;s Roast Report</span>
        <button
          onClick={handleNativeShare}
          disabled={!!sharing}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "white", border: "1px solid #EAE6DF", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#555" }}
        >
          {sharing ? "⏳ Generating..." : "⬇ Download Report"}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── HERO RESULT ── */}
        <div style={{ background: "linear-gradient(135deg, #1a0800 0%, #2d1200 50%, #1a0520 100%)", borderRadius: 24, padding: "40px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
          {/* BG decoration */}
          <div style={{ position: "absolute", top: -30, right: -20, fontSize: 180, opacity: 0.05, userSelect: "none", lineHeight: 1 }}>🔥</div>
          <div style={{ position: "absolute", bottom: -20, left: 20, fontSize: 120, opacity: 0.04, userSelect: "none" }}>💀</div>

          <div className="hero-section" style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              {/* Cook level badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FF6B3D", color: "white", padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 18, letterSpacing: 0.5 }}>
                {cookLabel.toUpperCase()}
              </div>

              <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: "white", marginBottom: 24, lineHeight: 1.1 }}>
                {r.candidateName}, you&apos;re{" "}
                <span style={{ color: "#FF6B3D" }}>cooked.</span>
              </h1>

              <div className="result-hero-stats" style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: 1 }}>COOKED SCORE</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 56, fontWeight: 900, color: "#FF6B3D", lineHeight: 1 }}>{r.cookedScore}</span>
                    <span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)" }}>/100</span>
                  </div>
                  <div style={{ width: 140, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 999, marginTop: 8 }}>
                    <div style={{ width: `${r.cookedScore}%`, height: "100%", background: "#FF6B3D", borderRadius: 999 }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2, letterSpacing: 1 }}>TIME UNTIL COOKED</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{r.monthsUntilCooked} months 😬</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2, letterSpacing: 1 }}>INDUSTRY RANK</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>Top {r.industryRank}% <span style={{ fontSize: 13, color: "#FF6B3D" }}>({r.industry})</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <Image src="/logo.png" alt="cooked" width={160} height={160} style={{ objectFit: "contain", animation: "float 3s ease-in-out infinite", filter: "drop-shadow(0 0 30px rgba(255,107,61,0.4))" }} />
            </div>
          </div>
        </div>

        {/* ── AI ROAST + WHAT'S HOLDING YOU BACK ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginBottom: 24 }}>

          {/* AI Roast — chaotic */}
          <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, padding: "28px", position: "relative", overflow: "hidden" }}>
            {/* Roasted stamp */}
            <div style={{
              position: "absolute", top: 18, right: 18,
              border: "3px solid #FF6B3D", color: "#FF6B3D",
              padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 900,
              letterSpacing: 2, transform: "rotate(6deg)", opacity: 0.7,
              userSelect: "none",
            }}>
              ROASTED
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>🔥</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>AI Roast</span>
            </div>

            <blockquote style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.5, borderLeft: "4px solid #FF6B3D", paddingLeft: 16, margin: "0 0 24px", fontStyle: "italic" }}>
              &quot;{parseAsteriskBold(r.roastQuote)}&quot;
            </blockquote>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {r.roastBullets.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "#333", background: i % 2 === 0 ? "#FAF7F2" : "white", padding: "10px 14px", borderRadius: 10, border: "1px solid #EAE6DF" }}>
                  <span style={{ flexShrink: 0 }}>🔥</span>
                  <span style={{ lineHeight: 1.5 }}>{parseAsteriskBold(b)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#FFF0EB", border: "1px solid #FFCDB8", borderRadius: 12, padding: "16px", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#FF6B3D", marginBottom: 6, display: "flex", gap: 6, alignItems: "center" }}>
                💀 The harsh truth
              </div>
              <p style={{ fontSize: 14, color: "#c0390d", margin: 0, fontWeight: 600, lineHeight: 1.5 }}>{parseAsteriskBold(r.harshTruth)}</p>
            </div>

            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "16px" }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#10B981", marginBottom: 6 }}>✅ Good news?</div>
              <p style={{ fontSize: 14, color: "#059669", margin: 0, lineHeight: 1.5 }}>{parseAsteriskBold(r.goodNews)}</p>
            </div>
          </div>

          {/* What's holding you back + Share */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, padding: "28px" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 20 }}>🚧 What&apos;s holding you back?</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {r.whatsHoldingBack.map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#FAF7F2", borderRadius: 12, border: "1px solid #EAE6DF" }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{w.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{w.title}</div>
                      <div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>{parseAsteriskBold(w.desc)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share card */}
            <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, padding: "24px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", marginBottom: 6 }}>📤 Share your roast</div>
              <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14, lineHeight: 1.5 }}>
                On phones and supported browsers, the buttons open the system share sheet with your roast image and caption. Otherwise we download the image and open the site (text only there).
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <button type="button" onClick={() => handlePlatformShare("twitter")} disabled={!!sharing}
                  style={{ padding: "9px 16px", background: "#000", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: sharing === "twitter" ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {sharing === "twitter" ? "⏳" : "𝕏"} Twitter
                </button>
                <button type="button" onClick={() => handlePlatformShare("linkedin")} disabled={!!sharing}
                  style={{ padding: "9px 16px", background: "#0077B5", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: sharing === "linkedin" ? 0.7 : 1 }}>
                  {sharing === "linkedin" ? "⏳ ..." : "LinkedIn"}
                </button>
                <button type="button" onClick={handleCopy}
                  style={{ padding: "9px 16px", background: copied ? "#10B981" : "#7C6CF2", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}>
                  {copied ? "✓ Copied!" : "Copy text"}
                </button>
              </div>
              <button type="button" onClick={handleNativeShare} disabled={!!sharing}
                style={{ width: "100%", padding: "11px", background: "#FAF7F2", border: "2px dashed #EAE6DF", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: sharing === "native" ? 0.7 : 1 }}>
                {sharing === "native" ? "⏳ Generating..." : "🖼 Share / download image"}
              </button>
            </div>
          </div>
        </div>

        {/* ── SCORE BREAKDOWN ── */}
        <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, padding: "28px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 22 }}>📊</span>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>Score Breakdown</div>
            <div style={{ marginLeft: "auto" }}>
              <CircularProgress value={r.cookedScore} size={60} color="#FF6B3D" />
            </div>
          </div>
          <div className="score-breakdown-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
            {breakdown.map((s) => <ScoreCard key={s.label} {...s} />)}
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 20, padding: "32px 28px", marginBottom: 24, textAlign: "center" }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", margin: "0 0 14px" }}>Follow my work :)</p>
          <a
            href="https://tarat.space"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 16, fontWeight: 700, color: "#FF6B3D", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span aria-hidden>🌱</span>
            tarat.space
            <span style={{ fontWeight: 500, color: "#888", fontSize: 14 }}>— digital garden</span>
          </a>
        </div>

        {/* Hidden share card — fixed below any sticky navbar so the navbar never paints over it in the html2canvas clone */}
        <div
          aria-hidden
          style={{ position: "fixed", left: 0, top: 80, width: 680, opacity: 0, pointerEvents: "none" }}
        >
          <ShareCard
            ref={shareCardRef}
            candidateName={r.candidateName}
            cookedScore={r.cookedScore}
            industry={r.industry}
            monthsUntilCooked={r.monthsUntilCooked}
            roastQuote={r.roastQuote}
            roastBullets={r.roastBullets}
            scoreBreakdown={r.scoreBreakdown}
          />
        </div>

        {/* ── CTA ── */}
        <div style={{ background: "linear-gradient(135deg, #FFF0EB 0%, #F0EEFF 100%)", border: "1px solid #EAE6DF", borderRadius: 20, padding: "28px", textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", marginBottom: 16 }}>✨ Improve these areas and see your score go up!</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/leaderboard" className="btn-primary">🏆 See Leaderboard</Link>
            <Link href="/upload" style={{ padding: "12px 24px", border: "1px solid #EAE6DF", borderRadius: 12, background: "white", fontWeight: 600, fontSize: 14, color: "#555", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              🔄 Roast Again
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
