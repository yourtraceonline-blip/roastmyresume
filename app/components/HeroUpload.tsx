"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import RoastLoadingOverlay, { ROAST_LOADING_STEPS } from "./RoastLoadingOverlay";

export default function HeroUpload() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
