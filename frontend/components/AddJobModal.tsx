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

export default function AddJobModal({ initialStatus, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    company: "", role: "", status: initialStatus, applied_date: "",
    location: "", job_url: "", salary_min: "", salary_max: "",
    follow_up_date: "", notes: "",
  });
  const [error, setError] = useState("");

  function set(field: keyof typeof form, value: string) {
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
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    }
  }

  const inputStyle = { width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "14px", outline: "none" };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-lg"
        style={{ backgroundColor: "var(--card-bg)", borderRadius: "6px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>Add Application</h2>
        {error && <p className="text-xs mb-3" style={{ color: "#DC2626" }}>{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Company *" value={form.company} onChange={(e) => set("company", e.target.value)} style={inputStyle} />
          <input placeholder="Role *" value={form.role} onChange={(e) => set("role", e.target.value)} style={inputStyle} />
          <select value={form.status} onChange={(e) => set("status", e.target.value)} style={inputStyle}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" placeholder="Applied Date *" value={form.applied_date} onChange={(e) => set("applied_date", e.target.value)} style={inputStyle} />
          <input placeholder="Location" value={form.location} onChange={(e) => set("location", e.target.value)} style={inputStyle} />
          <input placeholder="Job URL" value={form.job_url} onChange={(e) => set("job_url", e.target.value)} style={inputStyle} />
          <div className="flex gap-2">
            <input placeholder="Salary Min" type="number" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} style={{ ...inputStyle, width: "50%" }} />
            <input placeholder="Salary Max" type="number" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} style={{ ...inputStyle, width: "50%" }} />
          </div>
          <input type="date" placeholder="Follow-up Date" value={form.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} style={inputStyle} />
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2 rounded text-white font-medium" style={{ backgroundColor: "var(--primary)", borderRadius: "4px" }}>
              Save
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded font-medium" style={{ border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-secondary)" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
