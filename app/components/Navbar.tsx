"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{ background: "#FAF7F2", borderBottom: "1px solid #EAE6DF" }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold" style={{ whiteSpace: "nowrap", fontSize: "clamp(11px, 3.5vw, 18px)" }}>
          <Image src="/logo.png" alt="Roast My Resume" width={28} height={28} style={{ objectFit: "contain", flexShrink: 0 }} />
          <span className="hidden sm:inline" style={{ color: "#1a1a1a" }}>
            ROAST <span style={{ color: "#FF6B3D" }}>MY RESUME</span>
          </span>
        </Link>

        <Link
          href="/leaderboard"
          className="text-sm font-medium transition-colors"
          style={{ color: pathname === "/leaderboard" ? "#FF6B3D" : "#555" }}
        >
          Leaderboard
        </Link>
      </div>
    </nav>
  );
}
