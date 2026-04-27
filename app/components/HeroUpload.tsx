"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RoastLoadingOverlay, { ROAST_LOADING_STEPS } from "./RoastLoadingOverlay";

export default function HeroUpload() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRoasted, setAlreadyRoasted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("roastDone") === "1") setAlreadyRoasted(true);
  }, []);

  const roastFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      setLoadingStep(0);

      let step = 0;
      const interval = setInterval(() => {
        step = Math.min(step + 1, ROAST_LOADING_STEPS.length - 2);
        setLoadingStep(step);
      }, 1000);

      try {
        const { getClientId } = await import("../../lib/clientId");
        const form = new FormData();
        form.append("resume", file);
        form.append("clientId", getClientId());
        const res = await fetch("/api/roast", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          const code = data.errorCode ?? "";
          if (code === "NOT_A_RESUME") throw new Error(`🙅 ${data.error}`);
          if (code === "PARSE_FAILED") throw new Error(`🔄 ${data.error}`);
          if (code === "AI_ERROR") throw new Error(`⚡ ${data.error}`);
          throw new Error(data.error ?? "Something went wrong. Please try again.");
        }
        clearInterval(interval);
        sessionStorage.setItem("roastResult", JSON.stringify(data));
        localStorage.setItem("roastDone", "1");
        router.push("/result");
      } catch (err) {
        clearInterval(interval);
        setLoading(false);
        setLoadingStep(0);
        setError((err as Error).message);
      }
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) roastFile(file);
    },
    [roastFile]
  );

  if (alreadyRoasted) {
    return (
      <div style={{ background: "white", border: "2px dashed #EAE6DF", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🔥</div>
        <p style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", marginBottom: 6 }}>You&apos;ve already been roasted</p>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          One free roast per browser. Want line-by-line fixes, ATS score &amp; peer comparison?
        </p>
        <Link href="/result" style={{ display: "block", background: "#FAF7F2", border: "1px solid #EAE6DF", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#555", textDecoration: "none", marginBottom: 10 }}>
          View my roast →
        </Link>
        <Link href="/improve" className="btn-primary" style={{ display: "flex", justifyContent: "center", fontSize: 14, gap: 8 }}>
          Unlock full analysis — $3 lifetime
        </Link>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {loading ? (
        <RoastLoadingOverlay step={loadingStep} subtitle="This is gonna hurt..." />
      ) : null}
      <label
        htmlFor="hero-file-input"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          display: "block",
          background: "white",
          border: `2px dashed ${isDragging ? "#FF6B3D" : "#EAE6DF"}`,
          borderRadius: 16,
          padding: "32px 24px",
          textAlign: "center",
          cursor: loading ? "wait" : "pointer",
          transition: "border-color 0.2s",
          marginBottom: error ? 12 : 0,
          opacity: loading ? 0.35 : 1,
          pointerEvents: loading ? "none" : "auto",
        }}
      >
        <input
          id="hero-file-input"
          type="file"
          accept=".pdf,.docx"
          style={{ display: "none" }}
          disabled={loading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) roastFile(f);
          }}
        />
        <div style={{ fontSize: 32, marginBottom: 12 }}>
          {isDragging ? "🔥" : "☁️"}
        </div>
        <p style={{ color: "#666", marginBottom: 16, fontSize: 15 }}>
          {isDragging ? "Drop it like it's hot 🔥" : "Drag & drop your resume here"}
        </p>
        <div className="btn-primary" style={{ display: "inline-flex", pointerEvents: "none", fontSize: 14 }}>
          Choose File
        </div>
        <p style={{ color: "#aaa", fontSize: 12, marginTop: 12 }}>
          PDF or DOCX · Max 5MB · Roast starts immediately
        </p>
      </label>
      {error && (
        <div style={{ background: "#FFF0EB", border: "1px solid #FFCDB8", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#c0390d", marginTop: 8 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
