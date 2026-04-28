"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import KeywordMatcher from "@/components/KeywordMatcher";

export default function MatcherPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/");
    }
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    router.push("/");
  }

  const navStyle = { backgroundColor: "var(--card-bg)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", alignItems: "center", gap: "24px", height: "52px" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--surface)" }}>
      <nav style={navStyle}>
        <span className="font-semibold" style={{ color: "var(--primary)" }}>HireTrack</span>
        <a href="/dashboard" className="text-sm" style={{ color: "var(--text-secondary)" }}>Dashboard</a>
        <a href="/matcher" className="text-sm" style={{ color: "var(--primary)", fontWeight: "500" }}>Matcher</a>
        <div className="flex-1" />
        <button onClick={logout} className="text-sm" style={{ color: "var(--text-secondary)" }}>Logout</button>
      </nav>
      <div style={{ padding: "24px" }}>
        <h2 className="font-semibold text-base mb-6" style={{ color: "var(--text-primary)" }}>Keyword Matcher</h2>
        <KeywordMatcher />
      </div>
    </div>
  );
}
