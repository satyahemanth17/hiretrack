"use client";
import { useState } from "react";

export const STATUS_OPTIONS = [
  { value: "withdrawn", label: "Not Applied Yet", color: "#606060", outerColor: "#2a2a2a" },
  { value: "applied", label: "Applied", color: "#1a6fd4", outerColor: "#0a4a99" },
  { value: "phone_screen", label: "In Progress", color: "#d9a21b", outerColor: "#7a4500" },
  { value: "interview", label: "Interview Scheduled", color: "#7c51bb", outerColor: "#3d1a6e" },
  { value: "offer", label: "Offer Received", color: "#2e7d32", outerColor: "#0d4020" },
  { value: "rejected", label: "Rejected", color: "#b71c1c", outerColor: "#6d0f0f" },
] as const;

export type StatusValue = typeof STATUS_OPTIONS[number]["value"];

export function StatusPill({ label, color, outerColor }: { label: string; color: string; outerColor: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        backgroundColor: outerColor,
        borderRadius: "999px",
        padding: "3px 10px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: color, fontSize: "8px", lineHeight: 1, flexShrink: 0 }}>●</span>
      <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: 500 }}>{label}</span>
    </span>
  );
}

export default function StatusDropdown({
  value,
  onChange,
}: {
  value: StatusValue;
  onChange: (v: StatusValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[1];

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#1e1e1e",
          border: "1px solid #2e2e2e",
          borderRadius: "4px",
          padding: "6px 10px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <StatusPill label={selected.label} color={selected.color} outerColor={selected.outerColor} />
        <span style={{ color: "#787878", fontSize: "11px", marginLeft: "auto" }}>▼</span>
      </div>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 100,
              backgroundColor: "#252525",
              border: "1px solid #2e2e2e",
              borderRadius: "6px",
              padding: "4px",
              minWidth: "220px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <div
                key={s.value}
                onClick={() => { onChange(s.value); setOpen(false); }}
                style={{
                  padding: "6px 8px",
                  cursor: "pointer",
                  borderRadius: "4px",
                  backgroundColor: value === s.value ? "rgba(255,255,255,0.06)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    value === s.value ? "rgba(255,255,255,0.06)" : "transparent";
                }}
              >
                <StatusPill label={s.label} color={s.color} outerColor={s.outerColor} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
