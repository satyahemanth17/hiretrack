"use client";

import { useState, useRef } from "react";
import { Application, updateApplication } from "@/lib/api";

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

const STATUS_OPTIONS = ["applied", "phone_screen", "interview", "offer", "rejected", "withdrawn"] as const;

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
type SortKey = "company" | "role" | "location" | "applied_date" | "status" | "follow_up_date";
type SortDir = "asc" | "desc";

// ── Editable fields ────────────────────────────────────────────────────────────
type EditableField = "company" | "role" | "location" | "status";

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  apps: Application[];
  onRefresh: () => void;
  onAdd: () => void;
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

// ── Shared table styles ────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  color: TEXT_SECONDARY,
  fontSize: "12px",
  fontWeight: 500,
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

const inlineInputStyle: React.CSSProperties = {
  backgroundColor: "#1e1e1e",
  border: "1px solid #0a7cff",
  color: "#ffffffcf",
  fontSize: "13px",
  padding: "2px 6px",
  borderRadius: "3px",
  width: "100%",
  outline: "none",
};

// ── Sub-components at module scope (avoids remounting on every render) ─────────
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: "asc" | "desc" }) {
  if (sortKey !== col) return <span style={{ marginLeft: 4, opacity: 0.3 }}>↕</span>;
  return <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "▲" : "▼"}</span>;
}

function Th({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
}: {
  col: SortKey;
  label: string;
  sortKey: SortKey | null;
  sortDir: "asc" | "desc";
  onSort: (col: SortKey) => void;
}) {
  return (
    <th style={thStyle} onClick={() => onSort(col)}>
      {label}
      <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ApplicationsTable({ apps, onRefresh, onAdd }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("applied_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editCell, setEditCell] = useState<{ id: string; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  // Track input value via ref to avoid stale closure on blur
  const editValueRef = useRef<string>("");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function startEdit(id: string, field: EditableField, currentValue: string) {
    setEditCell({ id, field });
    setEditValue(currentValue);
    editValueRef.current = currentValue;
  }

  async function commitEdit(id: string, field: EditableField) {
    const val = editValueRef.current;
    setEditCell(null);
    try {
      await updateApplication(id, { [field]: val });
      onRefresh();
    } catch {
      // silently ignore — table will revert on next refresh
    }
  }

  function cancelEdit() {
    setEditCell(null);
  }

  function toggleNotes(id: string) {
    setExpandedNotes((prev) => (prev === id ? null : id));
  }

  const sorted = sortApps(apps, sortKey, sortDir);

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
            <Th col="company" label="Company Name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th col="role" label="Role / Position" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th col="location" label="Location" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th col="applied_date" label="Application Date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th col="status" label="Application Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th style={{ ...thStyle, cursor: "default" }}>Application Link / Portal</th>
            <th style={{ ...thStyle, cursor: "default" }}>Contact Person</th>
            <th style={{ ...thStyle, cursor: "default" }}>Email / Phone</th>
            <Th col="follow_up_date" label="Deadline" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th style={{ ...thStyle, cursor: "default" }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={10} style={{ ...tdStyle, textAlign: "center", color: TEXT_SECONDARY, padding: "32px" }}>
                No applications yet.
              </td>
            </tr>
          )}
          {sorted.map((app) => {
            const initial = (app.company?.[0] ?? "?").toUpperCase();
            const avatarBg = avatarColor(app.company);
            const statusColor = STATUS_COLORS[app.status] ?? "#454545";
            const statusLabel = STATUS_LABELS[app.status] ?? app.status;

            const isEditingCompany = editCell?.id === app.id && editCell.field === "company";
            const isEditingRole = editCell?.id === app.id && editCell.field === "role";
            const isEditingLocation = editCell?.id === app.id && editCell.field === "location";
            const isEditingStatus = editCell?.id === app.id && editCell.field === "status";

            const notesText = app.notes ?? "";
            const notesTruncated = notesText.length > 50;
            const notesExpanded = expandedNotes === app.id;
            const notesDisplay = notesTruncated && !notesExpanded
              ? notesText.slice(0, 50) + "..."
              : notesText || "—";

            return (
              <tr
                key={app.id}
                style={{ height: "40px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = SURFACE; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; }}
              >
                {/* Company Name */}
                <td
                  style={{ ...tdStyle, cursor: "text" }}
                  onClick={() => { if (!isEditingCompany) startEdit(app.id, "company", app.company); }}
                >
                  {isEditingCompany ? (
                    <input
                      autoFocus
                      style={inlineInputStyle}
                      value={editValue}
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "company")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                    />
                  ) : (
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
                  )}
                </td>

                {/* Role / Position */}
                <td
                  style={{ ...tdStyle, cursor: "text" }}
                  onClick={() => { if (!isEditingRole) startEdit(app.id, "role", app.role); }}
                >
                  {isEditingRole ? (
                    <input
                      autoFocus
                      style={inlineInputStyle}
                      value={editValue}
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "role")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                    />
                  ) : (
                    app.role
                  )}
                </td>

                {/* Location */}
                <td
                  style={{ ...tdStyle, color: TEXT_SECONDARY, cursor: "text" }}
                  onClick={() => { if (!isEditingLocation) startEdit(app.id, "location", app.location ?? ""); }}
                >
                  {isEditingLocation ? (
                    <input
                      autoFocus
                      style={inlineInputStyle}
                      value={editValue}
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "location")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                    />
                  ) : (
                    app.location ?? "—"
                  )}
                </td>

                {/* Application Date (read-only) */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>{fmtDate(app.applied_date)}</td>

                {/* Application Status */}
                <td
                  style={{ ...tdStyle, cursor: "pointer" }}
                  onClick={() => { if (!isEditingStatus) startEdit(app.id, "status", app.status); }}
                >
                  {isEditingStatus ? (
                    <select
                      autoFocus
                      style={inlineInputStyle}
                      value={editValue}
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "status")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  ) : (
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
                  )}
                </td>

                {/* Application Link / Portal (read-only) */}
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

                {/* Contact Person (always —) */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>—</td>

                {/* Email / Phone (always —) */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>—</td>

                {/* Deadline (read-only) */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>{fmtDate(app.follow_up_date)}</td>

                {/* Notes (expand on click) */}
                <td
                  style={{
                    ...tdStyle,
                    color: TEXT_SECONDARY,
                    whiteSpace: notesExpanded ? "normal" : "nowrap",
                    maxWidth: "200px",
                    overflow: notesExpanded ? "visible" : "hidden",
                    textOverflow: notesTruncated && !notesExpanded ? "ellipsis" : "unset",
                    cursor: notesTruncated ? "pointer" : "default",
                  }}
                  onClick={() => { if (notesTruncated || notesExpanded) toggleNotes(app.id); }}
                  title={notesTruncated && !notesExpanded ? notesText : undefined}
                >
                  {notesDisplay}
                </td>
              </tr>
            );
          })}

          {/* + New item row */}
          <tr
            onClick={onAdd}
            style={{ cursor: "pointer", height: "36px" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = SURFACE; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <td colSpan={10} style={{ ...tdStyle, color: TEXT_SECONDARY, fontSize: "12px" }}>
              + New item
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
