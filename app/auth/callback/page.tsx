"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase detects the #access_token hash automatically and fires onAuthStateChange.
    // We just wait for that and then forward to /improve.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.replace("/improve");
      }
    });

    // Also handle the case where the session is already established
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/improve");
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#666", fontSize: 14 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e5e5e5", borderTopColor: "#6366f1", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Signing you in…
      </div>
    </div>
  );
}
