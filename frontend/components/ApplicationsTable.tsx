"use client";

import { useState } from "react";
import { Application } from "@/lib/api";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG = "#191919";
const SURFACE = "#252525";
const BORDER = "#2e2e2e";
const TEXT_PRIMARY = "#ffffffcf";
const TEXT_SECONDARY = "#787878";

// ── Status badge colors ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  applied: "#0a7cff",
  phone_screen: "#d9a21b",
  interview: "#7c51bb",
  offer: "#2e7d32",
  rejected: "#b71c1c",
  withdrawn: "#454545",
};

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

// ── Company avatar palette (6 Notion-ish colors) ───────────────────────────────
const AVATAR_PALETTE = ["#0a7cff", "#7c51bb", "#d9a21b", "#2e7d32", "#b71c1c", "#078d7c"];

function avatarColor(company: string): string {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = (hash * 31 + company.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

// ── Date formatting ────────────────────────────────────────────────────────────
function fmtDate(raw?: string): string {
  if (!raw) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(raw + "T00:00:00"));
  } catch {
    return raw;
  }
}

// ── Sort types ─────────────────────────────────────────────────────────────────
type SortKey = "company" | "role" | "location" | "applied_date" | "status" | "follow_up_date" | "resume_used";
type SortDir = "asc" | "desc";

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  apps: Application[];
  onRefresh: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getSortValue(app: Application, key: SortKey): string {
  const v = app[key];
  return (v ?? "").toString().toLowerCase();
}

function sortApps(list: Application[], key: SortKey, dir: SortDir): Application[] {
  return [...list].sort((a, b) => {
    const av = getSortValue(a, key);
    const bv = getSortValue(b, key);
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ApplicationsTable({ apps, onRefresh }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("applied_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = sortApps(apps, sortKey, sortDir);

  const thStyle: React.CSSProperties = {
    color: TEXT_SECONDARY,
    fontSize: "12px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "8px 12px",
    textAlign: "left",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    borderBottom: `1px solid ${BORDER}`,
    backgroundColor: BG,
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    color: TEXT_PRIMARY,
    fontSize: "13px",
    whiteSpace: "nowrap",
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: "middle",
  };

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ marginLeft: 4, opacity: 0.3 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "▲" : "▼"}</span>;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th style={thStyle} onClick={() => handleSort(col)}>
        {label}
        <SortIcon col={col} />
      </th>
    );
  }

  return (
    <div style={{ overflowX: "auto", backgroundColor: BG, borderRadius: "6px", border: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 12px", borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={onRefresh}
          style={{
            fontSize: "12px",
            color: TEXT_SECONDARY,
            background: "none",
            border: `1px solid ${BORDER}`,
            borderRadius: "4px",
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          ↻ Refresh
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: BG }}>
        <thead>
          <tr>
            <Th col="company" label="Company" />
            <Th col="role" label="Role / Position" />
            <Th col="location" label="Location" />
            <Th col="applied_date" label="Applied Date" />
            <Th col="status" label="Status" />
            <th style={{ ...thStyle, cursor: "default" }}>Link / Portal</th>
            <th style={{ ...thStyle, cursor: "default" }}>Contact</th>
            <th style={{ ...thStyle, cursor: "default" }}>Email / Phone</th>
            <Th col="follow_up_date" label="Deadline" />
            <Th col="resume_used" label="Resume Used" />
            <th style={{ ...thStyle, cursor: "default" }}>Cover Letter</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={11} style={{ ...tdStyle, textAlign: "center", color: TEXT_SECONDARY, padding: "32px" }}>
                No applications yet.
              </td>
            </tr>
          )}
          {sorted.map((app) => {
            const initial = (app.company?.[0] ?? "?").toUpperCase();
            const avatarBg = avatarColor(app.company);
            const statusColor = STATUS_COLORS[app.status] ?? "#454545";
            const statusLabel = STATUS_LABELS[app.status] ?? app.status;

            return (
              <tr
                key={app.id}
                style={{ height: "40px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = SURFACE; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; }}
              >
                {/* Company */}
                <td style={tdStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: avatarBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </span>
                    <span style={{ fontWeight: 500 }}>{app.company}</span>
                  </div>
                </td>

                {/* Role */}
                <td style={tdStyle}>{app.role}</td>

                {/* Location */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>{app.location ?? "—"}</td>

                {/* Applied Date */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>{fmtDate(app.applied_date)}</td>

                {/* Status */}
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: statusColor,
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 500,
                      padding: "2px 10px",
                      borderRadius: "9999px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusLabel}
                  </span>
                </td>

                {/* Link */}
                <td style={tdStyle}>
                  {app.job_url ? (
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#0a7cff",
                        textDecoration: "none",
                        maxWidth: "160px",
                        display: "inline-block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        verticalAlign: "bottom",
                      }}
                      title={app.job_url}
                    >
                      {app.job_url.replace(/^https?:\/\//, "").split("/")[0]}
                    </a>
                  ) : (
                    <span style={{ color: TEXT_SECONDARY }}>—</span>
                  )}
                </td>

                {/* Contact */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>—</td>

                {/* Email / Phone */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>—</td>

                {/* Deadline */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>{fmtDate(app.follow_up_date)}</td>

                {/* Resume Used */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>{app.resume_used ?? "—"}</td>

                {/* Cover Letter */}
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "11px",
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: app.cover_letter_used ? "#2e7d32" : "#2e2e2e",
                      color: app.cover_letter_used ? "#fff" : TEXT_SECONDARY,
                    }}
                  >
                    {app.cover_letter_used ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
