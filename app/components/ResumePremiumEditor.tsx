"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type LineEdit = {
  section: string;
  original: string;
  suggested: string;
  why: string;
};

export type ImprovementPanel = {
  peer_comparison?: string | null;
  line_edits?: LineEdit[] | null;
  rewritten_bullets?: string[] | null;
  strategy?: string | null;
  atsScore?: { score: number; keywordsFound: string[]; keywordsMissing: string[]; formatIssues: string[] } | null;
  atsRecommendations?: string[] | null;
};

type Props = {
  accessToken: string;
  baselineScore: number | null;
  resumeText: string;
  onResumeChange: (next: string) => void;
  improvement: ImprovementPanel | null;
  generating: boolean;
  onGenerate: (resumeText?: string) => void;
  paywalled?: boolean;
};

export default function ResumePremiumEditor({
  accessToken,
  baselineScore,
  resumeText,
  onResumeChange,
  improvement,
  generating,
  onGenerate,
  paywalled = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [draftScore, setDraftScore] = useState<{
    cookedScore: number;
    roastQuote: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const analyzedRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken]
  );

  // Auto-run analysis when resume text becomes available (only from useEffect, not upload)
  // useEffect(() => {
  //   if (resumeText.trim() && !analyzing && analyzedRef.current === false) {
  //     analyzedRef.current = true;
  //     setAnalyzing(true);
  //     
  //     const headers = { Authorization: `Bearer ${accessToken}` };
  //     
  //     // Run score
  //     fetch("/api/improve/score", {
  //       method: "POST",
  //       headers: { ...headers, "Content-Type": "application/json" },
  //       body: JSON.stringify({ resumeText }),
  //     })
  //       .then(res => res.json())
  //       .then(json => {
  //         if (json.cookedScore !== undefined) {
  //           setDraftScore({ cookedScore: json.cookedScore, roastQuote: json.roastQuote ?? "" });
  //         }
  //       })
  //       .catch(err => console.error("Score error:", err));
  //     
  //     // Run generation
  //     onGenerate();
  //     
  //     // Reset after 8 seconds max
  //     setTimeout(() => {
  //       setAnalyzing(false);
  //     }, 8000);
  //   }
  // }, [resumeText.trim(), analyzing, accessToken]);

  const handleFileUpload = async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".txt")) {
      const t = await file.text();
      onResumeChange(t.slice(0, 16000));
      showToast("Text file imported");
      return;
    }
    if (!name.endsWith(".pdf")) {
      showToast("Use PDF or TXT");
      return;
    }

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    analyzedRef.current = false;
    setAnalyzing(true);

    try {
      const form = new FormData();
      form.append("resume", file);
      const res = await fetch("/api/improve/extract", {
        method: "POST",
        headers: authHeaders,
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Extract failed");
      const extractedText = String(json.text ?? "").slice(0, 16000);
      onResumeChange(extractedText);
      showToast("Resume imported");
      
      // Trigger analysis automatically unless the user is on the free-used paywall
      if (!paywalled) {
        setTimeout(() => {
          setAnalyzing(true);
          onGenerate(extractedText);
          setTimeout(() => setAnalyzing(false), 15000);
        }, 500);
      }
    } catch (e) {
      showToast((e as Error).message);
      setAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied");
  };

  const hasImprovements = improvement && (improvement.line_edits?.length || improvement.rewritten_bullets?.length || improvement.peer_comparison);

  return (
    <div className="resume-editor-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @media (max-width: 768px) {
          .resume-editor-container { gap: 14px !important; }
          .header-main { flex-direction: row !important; gap: 10px !important; align-items: center !important; flex-wrap: wrap !important; }
          .header-main h2 { font-size: 17px !important; }
          .header-main p { font-size: 12px !important; }
          .header-btn { white-space: nowrap !important; }
          .pdf-header { flex-direction: row !important; gap: 8px !important; padding: 10px 14px !important; flex-wrap: wrap !important; }
          .pdf-header > div:last-child { flex-wrap: wrap !important; gap: 6px !important; }
          .score-banner { padding: 14px 16px !important; gap: 12px !important; }
          .score-banner > div:first-child { gap: 10px !important; }
          .score-banner > div:first-child > div > div:first-child { font-size: 11px !important; }
          .score-banner > div:first-child > div > div:last-child { font-size: 26px !important; }
          .score-banner > div:last-child > div { font-size: 10px !important; }
          .ats-header { gap: 8px !important; }
          .ats-header > div:last-child { font-size: 24px !important; }
          .ats-recs ul { padding-left: 14px !important; }
          .ats-recs li { font-size: 12px !important; margin-bottom: 6px !important; }
          .action-plan li { font-size: 12px !important; margin-bottom: 10px !important; line-height: 1.5 !important; }
          .peer-section { padding: 16px !important; }
          .peer-section p { font-size: 13px !important; line-height: 1.6 !important; }
          .changes-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .change-card > div { font-size: 10px !important; }
          .change-card > div:nth-child(2), .change-card > div:nth-child(3) { font-size: 11px !important; }
          .bullet-item > div { font-size: 12px !important; }
          .drop-zone { padding: 32px 16px !important; }
          .drop-zone-icon { width: 44px !important; height: 44px !important; margin-bottom: 12px !important; }
        }
        @media (max-width: 480px) {
          .header-main { flex-direction: column !important; align-items: stretch !important; }
          .header-btn { width: 100% !important; justify-content: center !important; }
          .ats-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .score-banner { flex-direction: column !important; text-align: center !important; }
          .score-banner > div:last-child { text-align: center !important; }
        }
      `}</style>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#222", color: "white", borderRadius: 8, padding: "12px 16px", fontSize: 13, fontWeight: 500, zIndex: 100 }}>
          {toast}
        </div>
      )}

      {/* Header */}
<div className="header-main" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: "0 0 4px" }}>Resume Analyzer</h2>
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Upload a PDF to analyze and improve your resume</p>
          </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handleFileUpload(f);
            }}
          />
          <button
            type="button"
            disabled={analyzing}
            onClick={() => fileRef.current?.click()}
            style={{
              background: "#111",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: analyzing ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            {analyzing ? "Analyzing..." : "Upload PDF"}
          </button>
        </div>
      </div>

      {/* PDF Preview */}
      {pdfUrl ? (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{uploadedFile?.name}</span>
            </div>
            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {analyzing ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6366f1", fontSize: 12, fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Analyzing...
                </div>
              ) : hasImprovements ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {draftScore && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "#888" }}>Cooked:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>{draftScore.cookedScore}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", padding: "4px 10px", borderRadius: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                      <path d="M12 2v20M2 12h20"/>
                    </svg>
                    <span style={{ fontSize: 11, color: "#888" }}>Potential:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>~{Math.max(0, (draftScore?.cookedScore ?? 50) - 15)}</span>
                  </div>
                </div>
              ) : baselineScore !== null ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#888" }}>Score:</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>{baselineScore}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ height: "70vh", width: "100%" }}>
            <iframe
              src={pdfUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Resume PDF"
            />
          </div>
        </div>
      ) : (
        <div className="drop-zone" style={{ background: "white", borderRadius: 12, border: "2px dashed #ddd", padding: 64, textAlign: "center" }}>
          <div className="drop-zone-icon" style={{ width: 64, height: 64, borderRadius: 16, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#333", margin: "0 0 8px" }}>Drop your resume PDF here</h3>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>or click <strong>Upload PDF</strong> above</p>
        </div>
      )}

      {/* Analysis Section */}
      {hasImprovements && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Score Improvement Banner */}
          {hasImprovements && draftScore && (
            <div className="score-banner" style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", borderRadius: 12, border: "1px solid #6ee7b7", padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#065f46", fontWeight: 500, marginBottom: 4 }}>Current Cooked Score</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#dc2626" }}>{draftScore.cookedScore}</div>
                </div>
                <div style={{ color: "#6ee7b7", fontSize: 24 }}>→</div>
                <div>
                  <div style={{ fontSize: 12, color: "#065f46", fontWeight: 500, marginBottom: 4 }}>Potential Cooked Score</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#16a34a" }}>~{Math.max(0, draftScore.cookedScore - 15)}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#065f46", marginBottom: 4 }}>After applying all suggestions</div>
                <div style={{ fontSize: 12, color: "#065f46" }}>Could rank ~{Math.floor((100 - Math.max(0, draftScore.cookedScore - 15)) / 10)} spots higher on leaderboard</div>
              </div>
            </div>
          )}

          {/* ATS Score Section */}
          {improvement?.atsScore && (
            <div className="ats-section" style={{ background: "white", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div className="ats-header" style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>ATS Compatibility Score</div>
                  <div style={{ fontSize: 12, color: "#666" }}>How well your resume passes applicant tracking systems</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: improvement.atsScore.score >= 70 ? "#16a34a" : improvement.atsScore.score >= 50 ? "#f59e0b" : "#dc2626" }}>
                    {improvement.atsScore.score}
                  </span>
                  <span style={{ fontSize: 12, color: "#888" }}>/100</span>
                </div>
              </div>
              <div className="ats-grid" style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 10 }}>✓ Keywords Found</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {improvement.atsScore.keywordsFound.slice(0, 8).map((kw, i) => (
                      <span key={i} style={{ fontSize: 11, background: "#ecfdf5", color: "#065f46", padding: "4px 8px", borderRadius: 4 }}>{kw}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", marginBottom: 10 }}>✗ Keywords Missing</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {improvement.atsScore.keywordsMissing.slice(0, 8).map((kw, i) => (
                      <span key={i} style={{ fontSize: 11, background: "#fef2f2", color: "#991b1b", padding: "4px 8px", borderRadius: 4 }}>{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
              {improvement?.atsRecommendations && improvement.atsRecommendations.length > 0 && (
                <div className="ats-recs" style={{ padding: "0 20px 20px", borderTop: "1px solid #f0f0f0", marginTop: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111", marginBottom: 12, marginTop: 16 }}>How to Improve ATS Score</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {improvement.atsRecommendations.map((rec, i) => (
                      <li key={i} style={{ fontSize: 12, color: "#555", marginBottom: 8, lineHeight: 1.5 }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Strategy Overview */}
          {improvement?.strategy && (
            <div className="action-plan" style={{ background: "white", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div className="action-plan-header" style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", background: "linear-gradient(135deg, #fefefe 0%, #f8fafc 100%)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Your Action Plan</div>
                  <div style={{ fontSize: 12, color: "#666" }}>Priority improvements to lower your score</div>
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {/* Split by newlines OR by numbered patterns like "1. 2. 3." */}
                  {improvement.strategy
                    .replace(/\s+(\d+[\)\.]\s)/g, '\n$1')
                    .split(/\n+/)
                    .filter(s => s.trim())
                    .map((line, i) => {
                    const cleanLine = line.replace(/^[\d\.\)\-\*•–—\s]+/, '').trim();
                    if (!cleanLine || cleanLine.length < 4) return null;
                    
                    return (
                      <li key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                        <span style={{ color: "#6366f1", fontSize: 16, lineHeight: 1.5 }}>•</span>
                        <span 
                          style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, flex: 1 }}
                          dangerouslySetInnerHTML={{ 
                            __html: cleanLine
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          }} 
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Peer Comparison - Highlight Section */}
          {improvement?.peer_comparison && (
            <div className="peer-section" style={{ background: "white", borderRadius: 12, border: "1px solid #e5e5e5", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>Peer Benchmark Analysis</div>
              </div>
              <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, margin: 0 }}>{improvement.peer_comparison}</p>
            </div>
          )}

          {/* Two Column Layout for Details */}
          <div className="changes-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Line Suggestions */}
            <div className="changes-section" style={{ background: "white", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Line Changes</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#888", background: "#f5f5f5", padding: "4px 8px", borderRadius: 4 }}>
                  {improvement?.line_edits?.length ?? 0} updates
                </span>
              </div>
              <div style={{ padding: 16 }}>
                {(improvement?.line_edits ?? []).length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {(improvement?.line_edits ?? []).map((edit, i) => (
                      <div key={i} style={{ border: "1px solid #e5e5e5", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ background: "#f9fafb", padding: "10px 14px", borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{edit.section}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(edit.suggested)}
                            style={{ background: "transparent", border: "none", fontSize: 11, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            Copy
                          </button>
                        </div>
                        <div style={{ padding: 14 }}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#dc2626", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                              Current
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{edit.original}</div>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#16a34a", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Recommended
                            </div>
                            <div style={{ fontSize: 12, color: "#111", fontWeight: 500, lineHeight: 1.5 }}>{edit.suggested}</div>
                          </div>
                          <div style={{ background: "#f0fdf4", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#166534", lineHeight: 1.5 }}>
                            {edit.why}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#999", fontSize: 13, margin: 0 }}>No suggestions</p>
                )}
              </div>
            </div>

            {/* Bullets */}
            <div className="bullets-section" style={{ background: "white", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Better Phrases</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#888", background: "#f5f5f5", padding: "4px 8px", borderRadius: 4 }}>
                  {improvement?.rewritten_bullets?.length ?? 0} swaps
                </span>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 12, lineHeight: 1.5 }}>
                  Replace weak phrases with these stronger versions:
                </p>
                {improvement?.rewritten_bullets && improvement.rewritten_bullets.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {improvement.rewritten_bullets.map((bullet, i) => {
                      const parts = bullet.includes('|') ? bullet.split('|') : [null, bullet];
                      const weak = parts[0]?.trim();
                      const strong = (parts[1] || parts[0] || bullet).trim();
                      
                      return (
                        <div key={i} style={{ background: "#fafafa", borderRadius: 8, border: "1px solid #e5e5e5", overflow: "hidden" }}>
                          <div style={{ padding: "12px 14px" }}>
                            {weak && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#dc2626", textTransform: "uppercase" }}>Replace</span>
                                <span style={{ fontSize: 12, color: "#6b7280", textDecoration: "line-through" }}>{weak}</span>
                              </div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: "#16a34a", textTransform: "uppercase" }}>{weak ? "With" : "Use this"}</span>
                              <span style={{ fontSize: 12, color: "#111", fontWeight: 500 }}>{strong}</span>
                            </div>
                          </div>
                          <div style={{ background: "#f5f5f5", padding: "8px 14px", borderTop: "1px solid #e5e5e5", display: "flex", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(strong)}
                              style={{
                                background: "white",
                                border: "1px solid #d1d5db",
                                borderRadius: 6,
                                padding: "6px 12px",
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#374151",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                              Copy
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#999", fontSize: 13, margin: 0 }}>No phrases</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show analyzing state during upload/extraction and while waiting for improvements */}
      {(analyzing || (resumeText && !hasImprovements)) && !improvement && (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e5e5", padding: 48, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          </div>
          <p style={{ color: "#374151", fontSize: 14, fontWeight: 500, margin: "0 0 8px" }}>
            {resumeText ? "Analyzing your resume…" : "Reading your PDF…"}
          </p>
          <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>
            {resumeText ? "Generating score, suggestions, and peer comparison" : "Extracting text and preparing analysis"}
          </p>
        </div>
      )}
    </div>
  );
}