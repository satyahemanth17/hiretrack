"use client";

import { useState } from "react";
import { analyzeKeywords, MatchResult } from "@/lib/api";

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#15803D" : score >= 40 ? "#C2410C" : "#DC2626";
  return (
    <svg width="96" height="96" className="mx-auto">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 48 48)" strokeLinecap="round"
      />
      <text x="48" y="53" textAnchor="middle" fontSize="18" fontWeight="600" fill={color}>{score}%</text>
    </svg>
  );
}

export default function KeywordMatcher() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!resume.trim() || !jd.trim()) return;
    setLoading(true);
    try {
      const r = await analyzeKeywords(resume, jd);
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  const taStyle = { width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px", resize: "vertical" as const, outline: "none", minHeight: "200px" };
  const cardStyle = { backgroundColor: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "24px" };

  return (
    <div style={cardStyle}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Your Resume</label>
          <textarea style={taStyle} value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your resume here..." />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Job Description</label>
          <textarea style={taStyle} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description here..." />
        </div>
      </div>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="px-6 py-2 rounded text-white font-medium"
        style={{ backgroundColor: loading ? "#9CA3AF" : "var(--primary)", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <div className="mt-6">
          <ScoreRing score={result.score} />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#15803D" }}>Matched ({result.matched.length})</p>
              <div className="flex flex-wrap gap-1">
                {result.matched.map((k) => (
                  <span key={k} className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: "#F0FDF4", color: "#15803D", borderRadius: "9999px" }}>{k}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "#DC2626" }}>Missing ({result.missing.length})</p>
              <div className="flex flex-wrap gap-1">
                {result.missing.map((k) => (
                  <span key={k} className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", borderRadius: "9999px" }}>{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
