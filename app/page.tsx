import Link from "next/link";
import Image from "next/image";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HeroUpload from "./components/HeroUpload";
import LeaderboardPreview from "./components/LeaderboardPreview";

export default function HomePage() {
  return (
    <div style={{ background: "#FAF7F2", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-10">
        <div className="hero-section" style={{ display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>

          {/* Left */}
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#FFF0EB",
                color: "#FF6B3D",
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              🔥 The internet&apos;s brutally honest AI resume roast
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                fontWeight: 800,
                lineHeight: 1.12,
                marginBottom: 16,
                color: "#1a1a1a",
              }}
            >
              Upload. Get{" "}
              <span
                style={{
                  color: "#FF6B3D",
                  textDecoration: "underline",
                  textDecorationStyle: "wavy",
                  textUnderlineOffset: 6,
                }}
              >
                roasted.
              </span>{" "}
              <br />
              Climb the leaderboard.
            </h1>

            <p style={{ color: "#666", fontSize: 16, lineHeight: 1.6, marginBottom: 28 }}>
              Our AI analyzes your resume, roasts it mercilessly, and gives you a cooked risk score. Higher = worse. Paid users can unlock exact line-by-line fixes.
            </p>

            <HeroUpload />
            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="https://www.youtube.com/@tarat.youtube" target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", textDecoration: "none", background: "#f5f5f5", padding: "8px 16px", borderRadius: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                Watch me build cool stuff
              </a>
              <a href="https://buymeacoffee.com/taratdev" target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#92400e", textDecoration: "none", background: "#fef3c7", border: "1px solid #fcd34d", padding: "8px 16px", borderRadius: 8 }}>
                ☕ Buy me a coffee — keeps this free
              </a>
            </div>
          </div>

          {/* Right — toast + speech bubble, vertically centered */}
          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", paddingTop: 16 }}>
            {/* Speech bubble above */}
            <div
              style={{
                background: "#1a1a1a",
                color: "white",
                padding: "8px 16px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                marginBottom: 12,
                position: "relative",
              }}
            >
              bro is COOKED 💀
              {/* Little tail pointing down */}
              <div style={{
                position: "absolute",
                bottom: -7,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: "7px solid #1a1a1a",
              }} />
            </div>
            <Image
              src="/logo.png"
              alt="Roast My Resume"
              width={220}
              height={220}
              style={{ objectFit: "contain", animation: "float 3s ease-in-out infinite" }}
            />
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }} id="how-it-works">
          {[
            { icon: "🔥", title: "Brutally Honest", desc: "No sugarcoating. Just the harsh truth." },
            { icon: "🤖", title: "AI-Powered", desc: "Advanced AI analyzes your skills, role & market value." },
            { icon: "📊", title: "Cooked Risk", desc: "Higher score means more cooked, not better." },
            { icon: "✍️", title: "$3 Fix Plan", desc: "Unlock unlimited line-by-line resume edits." },
            { icon: "⏳", title: "Know Your Fate", desc: "We predict how long until you're replaced." },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: "white",
                border: "1px solid #EAE6DF",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flex: "1 1 180px",
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works + privacy (replaces placeholder social proof) */}
      <section
        style={{
          background: "white",
          borderTop: "1px solid #EAE6DF",
          borderBottom: "1px solid #EAE6DF",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10" style={{ display: "grid", gap: 28 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", marginBottom: 12 }}>
              What happens when you upload
            </h2>
<p style={{ color: "#555", fontSize: 15, lineHeight: 1.65, margin: 0 }}>
              You add a PDF or DOCX. We run it through an AI that roasts your resume, scores how "cooked" you are for today's job market (higher means worse), breaks down replaceability and skills, and gives you blunt-but-useful feedback. Want actual fixes? The paid upgrade gives you peer comparison and line-by-line rewrites.
            </p>
          </div>

          {/* Pro Feature CTA */}
          <div style={{ background: "linear-gradient(135deg, #111 0%, #333 100%)", borderRadius: 16, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                PRO FEATURE
              </div>
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Unlock Full Resume Analysis</h3>
              <p style={{ color: "#ccc", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Get line-by-line improvements, ATS score, peer comparison, and personalized action plan to lower your cooked score.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <span style={{ background: "rgba(255,255,255,0.15)", color: "#ddd", padding: "4px 10px", borderRadius: 6, fontSize: 11 }}>"Developed API" → "Designed RESTful API endpoints"</span>
                <span style={{ background: "rgba(255,255,255,0.15)", color: "#ddd", padding: "4px 10px", borderRadius: 6, fontSize: 11 }}>"Managed team" → "Led cross-functional team of 5 engineers"</span>
              </div>
            </div>
            <Link href="/improve" style={{ 
              background: "#fff", 
              color: "#111", 
              border: "none", 
              borderRadius: 10, 
              padding: "14px 24px", 
              fontSize: 14, 
              fontWeight: 700, 
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              Try Pro Analyzer
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          <div
            style={{
              background: "#FAF7F2",
              border: "1px solid #EAE6DF",
              borderRadius: 14,
              padding: "18px 20px",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a", marginBottom: 10, letterSpacing: 0.3 }}>
              Privacy, plain English
            </h3>
            <p style={{ color: "#555", fontSize: 14, lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: "#1a1a1a" }}>We don&apos;t store your resume file.</strong> It&apos;s only used for that one roast request—there&apos;s no copy of your CV sitting in our database. We do save the generated roast data the app needs (for example a short name if we inferred one, your score, industry, and roast highlights) so results and the leaderboard work—never the original document.
            </p>
          </div>
        </div>
      </section>

      <LeaderboardPreview />

      {/* CTA */}
      <section
        style={{
          background: "#1a1a1a",
          margin: "0 auto 48px",
          borderRadius: 24,
          padding: "48px 32px",
          textAlign: "center",
          maxWidth: 1152,
        }}
        className="mx-6"
      >
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 12 }}>
          Think you can do better? 😏
        </h2>
        <p style={{ color: "#aaa", fontSize: 16, marginBottom: 28 }}>
          Upload your resume and see where you stand.
        </p>
        <Link href="/upload" className="btn-primary" style={{ fontSize: 16, padding: "14px 32px" }}>
          Roast My Resume →
        </Link>
      </section>
      <Footer />
    </div>
  );
}
