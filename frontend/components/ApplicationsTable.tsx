"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Application, updateApplication } from "@/lib/api";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG = "#191919";
const SURFACE = "#252525";
const BORDER = "#2e2e2e";
const TEXT_PRIMARY = "#ffffff";
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

// ── Company avatar palette ─────────────────────────────────────────────────────
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
type EditableField = "company" | "role" | "location" | "status" | "notes" | "resume_url" | "cover_letter_url";

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
// Full grid: border on all 4 sides of every cell
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
  border: `1px solid ${BORDER}`,
  backgroundColor: BG,
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: TEXT_PRIMARY,
  fontSize: "13px",
  whiteSpace: "nowrap",
  border: `1px solid ${BORDER}`,
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

// ── Sub-components at module scope ─────────────────────────────────────────────
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
  const [search, setSearch] = useState("");

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

  const filtered = search.trim()
    ? apps.filter((a) => a.company.toLowerCase().includes(search.toLowerCase()))
    : apps;
  const sorted = sortApps(filtered, sortKey, sortDir);

  return (
    <div style={{ overflowX: "auto", backgroundColor: BG, borderRadius: "6px", border: `1px solid ${BORDER}` }}>
      {/* Table header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "8px 12px",
          borderBottom: `1px solid ${BORDER}`,
          gap: "8px",
        }}
      >
        {/* Search bar */}
        <div style={{ position: "relative", marginRight: "auto" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company..."
            style={{
              backgroundColor: "#1e1e1e",
              border: `1px solid ${BORDER}`,
              borderRadius: "4px",
              color: TEXT_PRIMARY,
              fontSize: "13px",
              padding: "4px 28px 4px 10px",
              outline: "none",
              width: "200px",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: TEXT_SECONDARY,
                cursor: "pointer",
                fontSize: "14px",
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
        <motion.button
          onClick={onRefresh}
          whileHover={{ scale: 1.05, y: -1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
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
        </motion.button>
        <motion.button
          onClick={onAdd}
          whileHover={{ scale: 1.05, y: -1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#ffffff",
            backgroundColor: "#0a7cff",
            border: "none",
            borderRadius: "4px",
            padding: "5px 14px",
            cursor: "pointer",
          }}
        >
          + New
        </motion.button>
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
            <th style={{ ...thStyle, cursor: "default" }}>Resume URL</th>
            <th style={{ ...thStyle, cursor: "default" }}>Cover Letter URL</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={12} style={{ ...tdStyle, textAlign: "center", color: TEXT_SECONDARY, padding: "32px" }}>
                No applications yet.
              </td>
            </tr>
          )}
          {sorted.map((app) => {
            const initial = (app.company?.[0] ?? "?").toUpperCase();
            const avatarBg = avatarColor(app.company);
            const statusColor = STATUS_COLORS[app.status] ?? "#454545";
            const statusLabel = STATUS_LABELS[app.status] ?? app.status;

            const isEditing = (field: EditableField) =>
              editCell?.id === app.id && editCell.field === field;

            return (
              <tr
                key={app.id}
                style={{ height: "40px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = SURFACE; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; }}
              >
                {/* 1. Company Name */}
                <td
                  style={{ ...tdStyle, cursor: "text" }}
                  onClick={() => { if (!isEditing("company")) startEdit(app.id, "company", app.company); }}
                >
                  {isEditing("company") ? (
                    <input
                      autoFocus
                      style={inlineInputStyle}
                      value={editValue}
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "company")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter") commitEdit(app.id, "company"); }}
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

                {/* 2. Role / Position */}
                <td
                  style={{ ...tdStyle, cursor: "text" }}
                  onClick={() => { if (!isEditing("role")) startEdit(app.id, "role", app.role); }}
                >
                  {isEditing("role") ? (
                    <input
                      autoFocus
                      style={inlineInputStyle}
                      value={editValue}
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "role")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter") commitEdit(app.id, "role"); }}
                    />
                  ) : (
                    app.role
                  )}
                </td>

                {/* 3. Location */}
                <td
                  style={{ ...tdStyle, color: TEXT_SECONDARY, cursor: "text" }}
                  onClick={() => { if (!isEditing("location")) startEdit(app.id, "location", app.location ?? ""); }}
                >
                  {isEditing("location") ? (
                    <input
                      autoFocus
                      style={inlineInputStyle}
                      value={editValue}
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "location")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter") commitEdit(app.id, "location"); }}
                    />
                  ) : (
                    app.location ?? "—"
                  )}
                </td>

                {/* 4. Application Date (read-only) */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>{fmtDate(app.applied_date)}</td>

                {/* 5. Application Status */}
                <td
                  style={{ ...tdStyle, cursor: "pointer" }}
                  onClick={() => { if (!isEditing("status")) startEdit(app.id, "status", app.status); }}
                >
                  {isEditing("status") ? (
                    <select
                      autoFocus
                      style={{ ...inlineInputStyle, backgroundColor: "#1e1e1e" }}
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

                {/* 6. Application Link / Portal (read-only link) */}
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

                {/* 7. Contact Person (placeholder) */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>—</td>

                {/* 8. Email / Phone (placeholder) */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>—</td>

                {/* 9. Deadline (read-only) */}
                <td style={{ ...tdStyle, color: TEXT_SECONDARY }}>{fmtDate(app.follow_up_date)}</td>

                {/* 10. Notes (inline-editable) */}
                <td
                  style={{ ...tdStyle, cursor: "text", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}
                  onClick={() => { if (!isEditing("notes")) startEdit(app.id, "notes", app.notes ?? ""); }}
                  title={app.notes ?? undefined}
                >
                  {isEditing("notes") ? (
                    <input
                      autoFocus
                      style={{ ...inlineInputStyle, minWidth: "160px" }}
                      value={editValue}
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "notes")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter") commitEdit(app.id, "notes"); }}
                    />
                  ) : (
                    <span style={{ color: TEXT_SECONDARY }}>
                      {app.notes
                        ? (app.notes.length > 40 ? app.notes.slice(0, 40) + "…" : app.notes)
                        : "—"}
                    </span>
                  )}
                </td>

                {/* 11. Resume URL (editable, shown as link when set) */}
                <td
                  style={{ ...tdStyle, cursor: "text", maxWidth: "160px" }}
                  onClick={() => { if (!isEditing("resume_url")) startEdit(app.id, "resume_url", app.resume_url ?? ""); }}
                >
                  {isEditing("resume_url") ? (
                    <input
                      autoFocus
                      style={{ ...inlineInputStyle, minWidth: "160px" }}
                      value={editValue}
                      placeholder="https://..."
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "resume_url")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter") commitEdit(app.id, "resume_url"); }}
                    />
                  ) : app.resume_url ? (
                    <a
                      href={app.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: "#0a7cff",
                        textDecoration: "none",
                        display: "inline-block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "140px",
                        verticalAlign: "bottom",
                      }}
                      title={app.resume_url}
                    >
                      {app.resume_url.replace(/^https?:\/\//, "").split("/").pop() || app.resume_url.replace(/^https?:\/\//, "").split("/")[0]}
                    </a>
                  ) : (
                    <span style={{ color: TEXT_SECONDARY }}>—</span>
                  )}
                </td>

                {/* 12. Cover Letter URL (editable, shown as link when set) */}
                <td
                  style={{ ...tdStyle, cursor: "text", maxWidth: "160px" }}
                  onClick={() => { if (!isEditing("cover_letter_url")) startEdit(app.id, "cover_letter_url", app.cover_letter_url ?? ""); }}
                >
                  {isEditing("cover_letter_url") ? (
                    <input
                      autoFocus
                      style={{ ...inlineInputStyle, minWidth: "160px" }}
                      value={editValue}
                      placeholder="https://..."
                      onChange={(e) => { setEditValue(e.target.value); editValueRef.current = e.target.value; }}
                      onBlur={() => commitEdit(app.id, "cover_letter_url")}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter") commitEdit(app.id, "cover_letter_url"); }}
                    />
                  ) : app.cover_letter_url ? (
                    <a
                      href={app.cover_letter_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: "#0a7cff",
                        textDecoration: "none",
                        display: "inline-block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "140px",
                        verticalAlign: "bottom",
                      }}
                      title={app.cover_letter_url}
                    >
                      {app.cover_letter_url.replace(/^https?:\/\//, "").split("/").pop() || app.cover_letter_url.replace(/^https?:\/\//, "").split("/")[0]}
                    </a>
                  ) : (
                    <span style={{ color: TEXT_SECONDARY }}>—</span>
                  )}
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
            <td colSpan={12} style={{ ...tdStyle, color: TEXT_SECONDARY, fontSize: "12px" }}>
              + New item
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
