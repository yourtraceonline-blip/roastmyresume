"use client";
import Image from "next/image";

export const ROAST_LOADING_STEPS = [
  "Scanning your resume... 🔍",
  "Judging your life choices... 😬",
  "Calculating cooked score... 🔥",
  "Preparing roast... 💀",
];

type Props = {
  step: number;
  /** Shown under the main step line */
  subtitle?: string;
};

/** Full-viewport roast-in-progress (covers nav + page) */
export default function RoastLoadingOverlay({ step, subtitle }: Props) {
  const safeStep = Math.min(Math.max(step, 0), ROAST_LOADING_STEPS.length - 1);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
      }}
    >
      <Image
        src="/logo.png"
        alt=""
        width={120}
        height={120}
        style={{ objectFit: "contain", animation: "float 1.5s ease-in-out infinite" }}
      />
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: subtitle ? "0 0 8px" : 0 }}>
          {ROAST_LOADING_STEPS[safeStep]}
        </p>
        {subtitle ? <p style={{ fontSize: 14, color: "#aaa", margin: 0 }}>{subtitle}</p> : null}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {ROAST_LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: i <= safeStep ? "#FF6B3D" : "#EAE6DF",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
