export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #EAE6DF",
        background: "white",
        padding: "40px 24px 32px",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 1152,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 40,
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Brand */}
        <div style={{ flex: "0 0 auto", maxWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>
              ROAST <span style={{ color: "#FF6B3D" }}>MY RESUME</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6, margin: 0 }}>
            The internet&apos;s brutally honest AI resume roast. Upload. Get cooked. Climb the leaderboard.
          </p>
        </div>

        {/* Built by */}
        <div style={{ flex: "0 0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: 1.5, marginBottom: 14 }}>
            BUILT BY
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
            Tarun Tomar
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="https://x.com/tarat_211" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555", textDecoration: "none" }}>
              <span style={{ fontSize: 15 }}>𝕏</span>
              @tarat_211
            </a>
            <a href="https://www.youtube.com/@tarat.youtube" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555", textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              YouTube
            </a>
            <a href="https://tarat.space" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555", textDecoration: "none" }}>
              <span style={{ fontSize: 15 }}>🌱</span>
              tarat.space
              <span style={{ fontSize: 11, color: "#aaa" }}>— digital garden</span>
            </a>
          </div>
        </div>

        {/* Other projects */}
        <div style={{ flex: "0 0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: 1.5, marginBottom: 14 }}>
            MORE PROJECTS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a href="https://yourtrace.online" target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: "none" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", marginBottom: 2 }}>
                yourtrace.online
              </div>
              <div style={{ fontSize: 12, color: "#aaa" }}>
                Daily tech briefing from 100+ sources
              </div>
            </a>
            <a href="https://tikkr.online" target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: "none" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", marginBottom: 2 }}>
                tikkr.online
              </div>
              <div style={{ fontSize: 12, color: "#aaa" }}>
                Stocks screener — find your next play
              </div>
            </a>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1152,
          margin: "32px auto 0",
          paddingTop: 20,
          borderTop: "1px solid #EAE6DF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, color: "#ccc" }}>
          © {new Date().getFullYear()} roastmyresume.fun — made with 🔥
        </span>
        <span style={{ fontSize: 12, color: "#ccc" }}>
          No resumes stored. Just vibes.
        </span>
      </div>
    </footer>
  );
}
