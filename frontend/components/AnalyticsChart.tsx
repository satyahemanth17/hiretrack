"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, ResponsiveContainer } from "recharts";
import { getFunnel, getTimeline, FunnelItem, TimelineItem } from "@/lib/api";

export default function AnalyticsChart() {
  const [funnel, setFunnel] = useState<FunnelItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    Promise.all([
      getFunnel().then(setFunnel),
      getTimeline().then(setTimeline),
    ]).catch(() => setFetchError(true));
  }, []);

  const cardStyle = { backgroundColor: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "20px", marginBottom: "20px" };

  if (fetchError) {
    return (
      <div className="text-center py-16" style={{ color: "#DC2626" }}>
        <p>Failed to load analytics. Please try again.</p>
      </div>
    );
  }

  if (!funnel.length && !timeline.length) {
    return (
      <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4">
          <rect x="8" y="40" width="12" height="16" fill="#E5E7EB" />
          <rect x="26" y="28" width="12" height="28" fill="#D1D5DB" />
          <rect x="44" y="16" width="12" height="40" fill="#9CA3AF" />
        </svg>
        <p>No applications yet</p>
      </div>
    );
  }

  return (
    <div>
      <div style={cardStyle}>
        <h3 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-primary)" }}>Application Funnel</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={funnel} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#5E6AD2" fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={cardStyle}>
        <h3 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-primary)" }}>Applications Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={timeline}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#5E6AD2" fill="#5E6AD2" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
