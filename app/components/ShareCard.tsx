
interface ShareCardProps {
  candidateName: string;
  cookedScore: number;
  industry: string;
  monthsUntilCooked: number;
  roastQuote: string;
  roastBullets: string[];
  scoreBreakdown: {
    replaceability: number;
    skillDepth: number;
    marketDemand: number;
    growthTrajectory: number;
    aiLeverage: number;
    execution: number;
    resumeQuality: number;
  };
}

function Bar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "#EF4444" : score >= 45 ? "#F59E0B" : "#10B981";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", width: 110, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: "white", width: 26, textAlign: "right" }}>{score}</span>
    </div>
  );
}

export default function ShareCard({
  candidateName, cookedScore, industry, monthsUntilCooked, roastQuote, roastBullets, scoreBreakdown,
}: ShareCardProps) {
  const cookLevel = cookedScore >= 80 ? "WELL DONE 🔥" : cookedScore >= 60 ? "MEDIUM WELL 🌭" : cookedScore >= 40 ? "MEDIUM 😬" : "RARE 🥩";
  const ringR = 46;
  const ringC = 2 * Math.PI * ringR;

  return (
    <div
      id="share-card"
      style={{
        width: 680,
        maxWidth: "100%",
        boxSizing: "border-box",
        background: "linear-gradient(145deg, #150800 0%, #2a1100 45%, #180420 100%)",
        borderRadius: 24,
        padding: "36px 40px",
        fontFamily: "-apple-system, 'Inter', 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* BG glows */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,61,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,108,242,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header — minWidth/flex keeps badge inside card; brand truncates if needed */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28, width: "100%", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "1 1 0%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="logo" width={26} height={26} style={{ objectFit: "contain", flexShrink: 0, display: "block" }} />
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ROASTMYRESUME.FUN</span>
        </div>
        <div
          style={{
            flex: "0 1 auto",
            maxWidth: "100%",
            background: "#FF6B3D",
            color: "white",
            fontSize: 11,
            fontWeight: 800,
            padding: "6px 14px 6px 12px",
            borderRadius: 999,
            letterSpacing: 0.8,
            lineHeight: 1.2,
            textAlign: "center",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {cookLevel}
        </div>
      </div>

      {/* Score + info row */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 24 }}>
        {/* Ring */}
        <div style={{ position: "relative", flexShrink: 0, width: 110, height: 110 }}>
          {/* SVG <g> rotate (not CSS on &lt;svg&gt;) — html2canvas renders CSS transform on svg incorrectly */}
          <svg width={110} height={110} viewBox="0 0 110 110" style={{ display: "block" }} aria-hidden>
            <g transform="rotate(-90 55 55)">
              <circle cx={55} cy={55} r={ringR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
              <circle
                cx={55}
                cy={55}
                r={ringR}
                fill="none"
                stroke="#FF6B3D"
                strokeWidth={10}
                strokeDasharray={ringC}
                strokeDashoffset={ringC * (1 - cookedScore / 100)}
                strokeLinecap="round"
              />
            </g>
          </svg>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 110,
              height: 110,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 900, color: "#FF6B3D", lineHeight: 1 }}>{cookedScore}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1, marginTop: 3 }}>/100</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 6 }}>COOKED SCORE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 10, lineHeight: 1.1 }}>
            {candidateName} is <span style={{ color: "#FF6B3D" }}>cooked.</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              ⏳ <strong style={{ color: "white" }}>{monthsUntilCooked}mo</strong> until automated
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              💼 <strong style={{ color: "white" }}>{industry}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Roast quote */}
      <div style={{ background: "rgba(255,107,61,0.12)", border: "1px solid rgba(255,107,61,0.25)", borderLeft: "4px solid #FF6B3D", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
        <p style={{ color: "white", fontSize: 15, lineHeight: 1.55, margin: 0, fontStyle: "italic", fontWeight: 500 }}>
          &quot;{roastQuote}&quot;
        </p>
      </div>

      {/* Top bullets */}
      <div style={{ marginBottom: 22 }}>
        {roastBullets.slice(0, 3).map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>
            <span style={{ flexShrink: 0 }}>🔥</span>
            <span>{b}</span>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 14 }}>BREAKDOWN</div>
        <Bar label="Replaceability" score={scoreBreakdown.replaceability} />
        <Bar label="Skill Depth" score={scoreBreakdown.skillDepth} />
        <Bar label="Market Demand" score={scoreBreakdown.marketDemand} />
        <Bar label="AI Leverage" score={scoreBreakdown.aiLeverage} />
        <Bar label="Resume Quality" score={scoreBreakdown.resumeQuality} />
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>roastmyresume.fun</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Get roasted → upload your resume</span>
      </div>
    </div>
  );
}
