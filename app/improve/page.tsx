"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ResumePremiumEditor, { type ImprovementPanel } from "../components/ResumePremiumEditor";
import { supabase } from "../../lib/supabase";

type MeResponse = {
  user: { id: string; email?: string; name?: string | null };
  hasPaid: boolean;
};


function getStoredRoast() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem("roastResult") ?? "null");
  } catch {
    return null;
  }
}

async function getToken(session: Session | null) {
  return session?.access_token ?? "";
}

export default function ImprovePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [improvement, setImprovement] = useState<ImprovementPanel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roast = useMemo(() => getStoredRoast(), []);
  const score = typeof roast?.cookedScore === "number" ? roast.cookedScore : null;
  const hasRoast = roast && Object.keys(roast).length > 0;

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    }

    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadMe() {
      if (!session) {
        setMe(null);
        setImprovement(null);
        return;
      }
      setImprovement(null);
      setLoading(true);
      setError(null);
      try {
        const token = await getToken(session);
        const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not load account.");
        setMe(json);

        const prevRes = await fetch("/api/improve", { headers: { Authorization: `Bearer ${token}` } });
        const prevJson = await prevRes.json();
        if (prevRes.ok && prevJson.latest) {
          setImprovement(prevJson.latest);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, [session]);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMe(null);
    setImprovement(null);
  };

  const checkout = async () => {
    if (!session) return;
    setCheckingOut(true);
    setError(null);
    try {
      const token = await getToken(session);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start checkout.");
      window.location.href = String(json.checkout_url);
    } catch (e) {
      setError((e as Error).message);
      setCheckingOut(false);
    }
  };

  const generate = async (resumeTextToUse?: string) => {
    if (!session) return;
    setGenerating(true);
    setError(null);
    try {
      const token = await getToken(session);
      // Use passed text if provided, otherwise use state
      const textToUse = resumeTextToUse || resumeText;
      const roastData = hasRoast ? roast : { message: "User uploaded resume directly" };
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roastResult: roastData, currentResume: textToUse }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not generate improvements.");
      setImprovement(json.improvement);
      // Also set draft score from improvement response
      if (json.improvement?.cookedScore !== undefined) {
        // We could set this in a state, but the editor handles it
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ background: "#F5F5F5", minHeight: "100vh" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8" style={{ paddingLeft: "clamp(12px, 3vw, 24px)", paddingRight: "clamp(12px, 3vw, 24px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            {me?.hasPaid ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a1a1a", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, marginBottom: 14, letterSpacing: "0.3px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Pro Access
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
                Pro required for analysis
              </div>
            )}
            <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, color: "#111", marginBottom: 8, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
              Resume Editor & Analyzer
            </h1>
            <p style={{ color: "#666", fontSize: 15, lineHeight: 1.6, maxWidth: 640 }}>
              Upload your resume for AI-powered line-by-line improvements, ATS score, and peer benchmarks. Unlock Pro to run analysis.
            </p>
          </div>
          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              <div style={{ fontSize: 13, color: "#666" }}>
                <span style={{ fontWeight: 500, color: "#333" }}>{me?.user?.email?.split("@")[0]}</span>
                <span style={{ color: "#888" }}>@{me?.user?.email?.split("@")[1]}</span>
              </div>
              <button type="button" onClick={signOut} style={{ border: "none", background: "#f5f5f5", color: "#666", borderRadius: 6, padding: "6px 12px", fontWeight: 500, fontSize: 12, cursor: "pointer" }}>
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div style={{ background: "white", border: "1px solid #e5e5e5", borderRadius: 16, padding: 48, color: "#888", textAlign: "center" }}>Loading...</div>
        ) : !session ? (
          <section style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ background: "white", borderRadius: 20, border: "1px solid #e5e5e5", padding: "clamp(16px, 4vw, 32px)", marginBottom: 24 }}>
              <div style={{ width: "clamp(48px, 10vw, 64px)", height: "clamp(48px, 10vw, 64px)", borderRadius: "clamp(10px, 2vw, 16px)", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto clamp(12px, 3vw, 20px)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 8, textAlign: "center" }}>Resume Analyzer</h2>
              <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, textAlign: "center", marginBottom: 24 }}>
                Sign in to unlock Pro and run AI-powered resume analysis.
              </p>

              <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
                {[
                  { title: "Line-by-Line Fixes", desc: "Specific changes to each weak point in your resume", icon: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" },
                  { title: "ATS Score", desc: "See how your resume scores on applicant tracking systems", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" },
                  { title: "Peer Comparison", desc: "See how you stack up against top resumes in your industry", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" },
                  { title: "Better Phrases", desc: "Copy-paste templates to instantly improve your bullets", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
                  { title: "Action Plan", desc: "Personalized roadmap to lower your cooked risk score", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" },
                  { title: "Unlimited Re-analyses", desc: "Keep uploading and improving with a Pro pass", icon: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d={f.icon}/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{f.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={signIn} className="btn-primary" style={{ fontSize: 14, width: "100%", justifyContent: "center", display: "flex", gap: 8, padding: "14px 24px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg>
                Sign in with Google
              </button>
            </div>
          </section>
        ) : !me?.hasPaid && !improvement ? (
          <section style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 20, padding: "clamp(16px, 4vw, 32px)", marginBottom: 24, color: "white", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, opacity: 0.85, marginBottom: 8 }}>PRO ANALYSIS</div>
              <h2 style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 700, marginBottom: 8 }}>Unlock Resume Analysis</h2>
              <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>
                Run AI improvements, ATS scoring, and peer benchmarks — one payment, unlimited re-analyses.
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}>
                <span style={{ fontSize: "clamp(28px, 6vw, 36px)", fontWeight: 700 }}>$3</span>
                <span style={{ fontSize: 14, opacity: 0.8 }}>one-time · lifetime access</span>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e5e5e5", padding: "clamp(14px, 3vw, 24px)" }}>
              <div style={{ display: "grid", gap: 16 }}>
                {[
                  { title: "Unlimited Re-analyses", desc: "Re-run any time as you tweak your resume" },
                  { title: "Line-by-Line Fixes", desc: "Specific edits to each weak point" },
                  { title: "ATS Compatibility Score", desc: "See how robots read your resume" },
                  { title: "Peer Benchmark", desc: "Compare against top resumes in your field" },
                  { title: "Better Phrases", desc: "Copy-paste improved bullets" },
                  { title: "Action Plan", desc: "Step-by-step to lower your score" },
                ].map((f) => (
                  <div key={f.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{f.desc}</div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" style={{ flexShrink: 0, marginLeft: 12 }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                ))}
              </div>

              <button type="button" onClick={checkout} disabled={checkingOut} style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white", border: "none", borderRadius: 12, padding: "16px 24px",
                fontSize: 15, fontWeight: 700, cursor: checkingOut ? "wait" : "pointer",
                width: "100%", marginTop: 20
              }}>
                {checkingOut ? "Opening checkout..." : "Unlock unlimited — $3 lifetime"}
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "#999", marginTop: 10 }}>
                One payment, yours forever. No subscriptions.
              </p>
            </div>

            {score !== null && (
              <div style={{ background: "#fafafa", borderRadius: 16, padding: "clamp(14px, 3vw, 24px)", border: "1px solid #e5e5e5", textAlign: "center", marginTop: 24 }}>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>YOUR CURRENT COOKED SCORE</div>
                <div style={{ fontSize: "clamp(36px, 10vw, 56px)", fontWeight: 700, color: score > 50 ? "#dc2626" : score > 30 ? "#f59e0b" : "#16a34a" }}>
                  {score}<span style={{ fontSize: "clamp(14px, 3vw, 20px)", color: "#888", fontWeight: 400 }}>/100</span>
                </div>
                <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                  Unlock Pro to keep improving this score
                </p>
              </div>
            )}
          </section>
        ) : session?.access_token ? (
          <>
            {!me?.hasPaid && improvement && (
              <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ color: "white" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Saved analysis — read-only</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Unlock $3 lifetime access to run new analyses as you improve your resume.</div>
                </div>
                <button type="button" onClick={checkout} disabled={checkingOut} style={{ background: "white", color: "#667eea", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: checkingOut ? "wait" : "pointer", whiteSpace: "nowrap" }}>
                  {checkingOut ? "Opening..." : "Unlock — $3 lifetime"}
                </button>
              </div>
            )}
            <ResumePremiumEditor
              accessToken={session.access_token}
              baselineScore={score}
              resumeText={resumeText}
              onResumeChange={setResumeText}
              improvement={improvement}
              generating={generating}
              onGenerate={me?.hasPaid ? generate : checkout}
              paywalled={!me?.hasPaid}
            />
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
