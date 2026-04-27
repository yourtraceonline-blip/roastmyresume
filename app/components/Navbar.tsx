"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{ background: "#FAF7F2", borderBottom: "1px solid #EAE6DF" }} className="sticky top-0 z-50">
      <style>{`
        @media (max-width: 640px) {
          .nav-links { gap: 8px !important; }
          .nav-btn { padding: 8px 14px !important; font-size: 12px !important; }
          .nav-logo { font-size: 14px !important; }
        }
      `}</style>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold" style={{ whiteSpace: "nowrap" }}>
          <Image src="/logo.png" alt="Roast My Resume" width={24} height={24} style={{ objectFit: "contain", flexShrink: 0 }} />
          <span className="nav-logo" style={{ color: "#1a1a1a", fontSize: "clamp(12px, 3vw, 16px)" }}>
            ROAST <span style={{ color: "#FF6B3D" }}>MY RESUME</span>
          </span>
        </Link>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/improve" className="nav-btn" style={{ 
            background: pathname === "/improve" ? "#111" : "white", 
            color: pathname === "/improve" ? "white" : "#333", 
            border: "1px solid #ddd", 
            borderRadius: 8, 
            padding: "10px 18px", 
            fontSize: 13, 
            fontWeight: 600, 
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="hidden sm:inline">Improve</span>
          </Link>
          <Link href="/leaderboard" className="nav-btn" style={{ 
            background: pathname === "/leaderboard" ? "#111" : "white", 
            color: pathname === "/leaderboard" ? "white" : "#333", 
            border: "1px solid #ddd", 
            borderRadius: 8, 
            padding: "10px 18px", 
            fontSize: 13, 
            fontWeight: 600, 
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 21h8M12 17v4M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-4-8-4 8-4-8-4 8z"/>
            </svg>
            <span className="hidden sm:inline">Leaderboard</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}