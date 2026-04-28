"use client";

import { useState } from "react";
import { createApplication } from "@/lib/api";

const STATUSES = ["applied", "phone_screen", "interview", "offer", "rejected", "withdrawn"] as const;
type Status = typeof STATUSES[number];

interface Props {
  initialStatus: Status;
  onClose: () => void;
  onSaved: () => void;
}

// Dark theme tokens
const MODAL_BG = "#252525";
const INPUT_BG = "#1e1e1e";
const BORDER = "#2e2e2e";
const TEXT_PRIMARY = "#ffffffcf";
const TEXT_SECONDARY = "#787878";

export default function AddJobModal({ initialStatus, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    company: "",
    role: "",
    status: initialStatus,
    applied_date: "",
    location: "",
    job_url: "",
    salary_min: "",
    salary_max: "",
    follow_up_date: "",
    notes: "",
    resume_used: "",
    cover_letter_used: false,
  });
  const [error, setError] = useState("");

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company || !form.role || !form.applied_date) {
      setError("Company, Role, and Applied Date are required.");
      return;
    }
    try {
      await createApplication({
        company: form.company,
        role: form.role,
        status: form.status,
        applied_date: form.applied_date,
        location: form.location || undefined,
        job_url: form.job_url || undefined,
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
        follow_up_date: form.follow_up_date || undefined,
        notes: form.notes || undefined,
        resume_used: form.resume_used || undefined,
        cover_letter_used: form.cover_letter_used,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    borderRadius: "4px",
    border: `1px solid ${BORDER}`,
    fontSize: "14px",
    outline: "none",
    backgroundColor: INPUT_BG,
    color: TEXT_PRIMARY,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    color: TEXT_SECONDARY,
    marginBottom: "4px",
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-lg"
        style={{
          backgroundColor: MODAL_BG,
          borderRadius: "6px",
          maxHeight: "90vh",
          overflowY: "auto",
          border: `1px solid ${BORDER}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="font-semibold text-base mb-4"
          style={{ color: TEXT_PRIMARY }}
        >
          Add Application
        </h2>

        {error && (
          <p className="text-xs mb-3" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label style={labelStyle}>Company *</label>
            <input
              placeholder="e.g. Acme Corp"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Role *</label>
            <input
              placeholder="e.g. Software Engineer"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              style={inputStyle}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} style={{ backgroundColor: "#1e1e1e" }}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Applied Date *</label>
            <input
              type="date"
              value={form.applied_date}
              onChange={(e) => set("applied_date", e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input
              placeholder="e.g. Remote, New York NY"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Job URL</label>
            <input
              placeholder="https://..."
              value={form.job_url}
              onChange={(e) => set("job_url", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Salary Min</label>
              <input
                placeholder="80000"
                type="number"
                value={form.salary_min}
                onChange={(e) => set("salary_min", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Salary Max</label>
              <input
                placeholder="120000"
                type="number"
                value={form.salary_max}
                onChange={(e) => set("salary_max", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Follow-up Date</label>
            <input
              type="date"
              value={form.follow_up_date}
              onChange={(e) => set("follow_up_date", e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              placeholder="Any notes about this application..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Resume Used</label>
            <input
              placeholder="Resume version (e.g., v3-SWE)"
              value={form.resume_used}
              onChange={(e) => set("resume_used", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "2px" }}>
            <input
              id="cover_letter_used"
              type="checkbox"
              checked={form.cover_letter_used}
              onChange={(e) => set("cover_letter_used", e.target.checked)}
              style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "#0a7cff" }}
            />
            <label
              htmlFor="cover_letter_used"
              style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}
            >
              Cover letter included?
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded font-medium"
              style={{ backgroundColor: "#0a7cff", color: "#fff", borderRadius: "4px", border: "none", cursor: "pointer" }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded font-medium"
              style={{ border: `1px solid ${BORDER}`, borderRadius: "4px", color: TEXT_SECONDARY, backgroundColor: "transparent", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
