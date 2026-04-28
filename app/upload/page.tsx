"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoastLoadingOverlay, { ROAST_LOADING_STEPS } from "../components/RoastLoadingOverlay";

export default function UploadPage() {
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

      // Tick through loading messages while the real call runs
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
        setLoadingStep(ROAST_LOADING_STEPS.length - 1);
        sessionStorage.setItem("roastResult", JSON.stringify(data));
        setTimeout(() => router.push("/result"), 500);
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

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) roastFile(file);
    },
    [roastFile]
  );

  if (loading) {
    return <RoastLoadingOverlay step={loadingStep} subtitle="This is gonna hurt..." />;
  }

  return (
    <div style={{ background: "#FAF7F2", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: 600, margin: "64px auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "#1a1a1a", marginBottom: 12 }}>
            Upload your resume and get{" "}
            <span style={{ color: "#FF6B3D" }}>absolutely roasted</span>
          </h1>
          <p style={{ color: "#888", fontSize: 15 }}>
            Takes ~15 seconds. We don&apos;t store your resume.
          </p>
        </div>

        {/* Upload zone — clicking or dropping immediately starts roasting */}
        <label
          htmlFor="file-input"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            display: "block",
            background: "white",
            border: `2px dashed ${isDragging ? "#FF6B3D" : "#EAE6DF"}`,
            borderRadius: 20,
            padding: "56px 32px",
            textAlign: "center",
            transition: "all 0.2s",
            cursor: "pointer",
            marginBottom: error ? 16 : 32,
          }}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
          <div style={{ fontSize: 52, marginBottom: 16 }}>
            {isDragging ? "🔥" : "📄"}
          </div>
          <p style={{ fontWeight: 700, fontSize: 18, color: "#1a1a1a", marginBottom: 8 }}>
            {isDragging ? "Drop it like it's hot 🔥" : "Drop your resume here"}
          </p>
          <p style={{ color: "#aaa", fontSize: 14, marginBottom: 20 }}>
            or click to browse
          </p>
          <div className="btn-primary" style={{ display: "inline-flex", pointerEvents: "none", fontSize: 15 }}>
            Choose File →
          </div>
          <p style={{ color: "#ccc", fontSize: 12, marginTop: 16 }}>
            PDF or DOCX · Max 5MB · Roast starts immediately
          </p>
        </label>

        {error && (
          <div style={{ background: "#FFF0EB", border: "1px solid #FFCDB8", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#c0390d", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Trust builders */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { icon: "🔒", title: "Private", desc: "We don't store your resume" },
            { icon: "⚡", title: "Fast", desc: "Results in ~15 seconds" },
            { icon: "🤖", title: "AI-Powered", desc: "No sugarcoating" },
          ].map((t) => (
            <div key={t.title} style={{ background: "white", border: "1px solid #EAE6DF", borderRadius: 14, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 3 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>{t.desc}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#aaa" }}>
          Want to see a sample?{" "}
          <Link href="/result" style={{ color: "#FF6B3D", fontWeight: 600 }}>
            View example roast →
          </Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
