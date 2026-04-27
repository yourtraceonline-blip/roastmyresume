import { forwardRef } from "react";
import { parseAsteriskBold } from "../../lib/asteriskBold";
import { SCORE_BREAKDOWN_HINTS } from "../../lib/scoreBreakdownHints";

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
  const color = score >= 70 ? "#10B981" : score >= 45 ? "#F59E0B" : "#EF4444";
  const hint = SCORE_BREAKDOWN_HINTS[label];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 118, flexShrink: 0, alignSelf: "center" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600, lineHeight: 1.2 }}>{label}</div>
        {hint ? (
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.25, marginTop: 3 }}>{hint}</div>
        ) : null}
      </div>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 999, alignSelf: "center" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: "white", width: 26, textAlign: "right", alignSelf: "center" }}>{score}</span>
    </div>
  );
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { candidateName, cookedScore, industry, monthsUntilCooked, roastQuote, roastBullets, scoreBreakdown },
  ref,
) {
  const cookLevel = cookedScore >= 80 ? "WELL DONE 🔥" : cookedScore >= 60 ? "MEDIUM WELL 🌭" : cookedScore >= 40 ? "MEDIUM 😬" : "RARE 🥩";
  const ringR = 46;
  const ringC = 2 * Math.PI * ringR;

  return (
    <div
      ref={ref}
      id="share-card"
      style={{
        width: 680,
        boxSizing: "border-box",
        background: "linear-gradient(145deg, #150800 0%, #2a1100 45%, #180420 100%)",
        borderRadius: 24,
        padding: "40px 40px 36px",
        fontFamily: "-apple-system, 'Inter', 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Clip glows only — overflow:hidden on the full card clips html2canvas at rounded corners */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 24,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,61,0.18) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,108,242,0.12) 0%, transparent 70%)" }} />
      </div>

      {/* Score + info row — table-cell centers label for html2canvas (flex in absolute box is unreliable) */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 28, marginBottom: 24 }}>
        <div style={{ position: "relative", flexShrink: 0, width: 110, height: 110 }}>
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
              display: "table",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "table-cell", verticalAlign: "middle", textAlign: "center"}}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#FF6B3D", lineHeight: 1, display: "block", marginTop: -32 }}>{cookedScore}</span>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 6 }}>COOKED RISK</div>
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
      <div style={{ position: "relative", zIndex: 1, background: "rgba(255,107,61,0.12)", border: "1px solid rgba(255,107,61,0.25)", borderLeft: "4px solid #FF6B3D", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
        <p style={{ color: "white", fontSize: 15, margin: 0, fontStyle: "italic", fontWeight: 500, marginTop: -20 }}>
          &quot;{parseAsteriskBold(roastQuote)}&quot;
        </p>
      </div>

      {/* Top bullets */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 22 }}>
        {roastBullets.slice(0, 3).map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>
            <span style={{ flexShrink: 0 }}>🔥</span>
            <span>{parseAsteriskBold(b)}</span>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 14 }}>BREAKDOWN</div>
        <Bar label="Replaceability" score={scoreBreakdown.replaceability} />
        <Bar label="Skill Depth" score={scoreBreakdown.skillDepth} />
        <Bar label="Market Demand" score={scoreBreakdown.marketDemand} />
        <Bar label="AI Leverage" score={scoreBreakdown.aiLeverage} />
        <Bar label="Resume Quality" score={scoreBreakdown.resumeQuality} />
      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>roastmyresume.fun</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Get roasted → upload your resume</span>
      </div>
    </div>
  );
});

export default ShareCard;
