"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Application, updateApplication, deleteApplication } from "@/lib/api";
import StatusDropdown, { StatusValue } from "./StatusDropdown";

interface Props {
  app: Application;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: "4px",
  border: "1px solid #2e2e2e",
  fontSize: "13px",
  outline: "none",
  backgroundColor: "#1e1e1e",
  color: "#ffffff",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  color: "#787878",
  marginBottom: "4px",
};

export default function EditApplicationModal({ app, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState({
    company: app.company,
    role: app.role,
    status: app.status as StatusValue,
    applied_date: app.applied_date ?? "",
    location: app.location ?? "",
    job_url: app.job_url ?? "",
    follow_up_date: app.follow_up_date ?? "",
    notes: app.notes ?? "",
    resume_url: app.resume_url ?? "",
    cover_letter_url: app.cover_letter_url ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.company || !form.role || !form.applied_date) {
      setError("Company, Role, and Applied Date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateApplication(app.id, {
        company: form.company,
        role: form.role,
        status: form.status,
        applied_date: form.applied_date,
        location: form.location || undefined,
        job_url: form.job_url || undefined,
        follow_up_date: form.follow_up_date || undefined,
        notes: form.notes || undefined,
        resume_url: form.resume_url || undefined,
        cover_letter_url: form.cover_letter_url || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete application for ${app.company}?`)) return;
    setDeleting(true);
    try {
      await deleteApplication(app.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: "#252525", borderRadius: "8px", padding: "24px", maxWidth: "520px", width: "90%", border: "1px solid #2e2e2e", maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px", margin: 0 }}>Edit Application</h2>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05, y: -1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ background: "none", border: "none", color: "#787878", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </motion.button>
        </div>

        {error && <p style={{ color: "#b71c1c", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={labelStyle}>Company *</label>
              <input value={form.company} onChange={(e) => setField("company", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role *</label>
              <input value={form.role} onChange={(e) => setField("role", e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <StatusDropdown value={form.status} onChange={(v) => setField("status", v)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={labelStyle}>Applied Date *</label>
              <input
                type="date"
                value={form.applied_date}
                onChange={(e) => setField("applied_date", e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) => setField("follow_up_date", e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              placeholder="e.g. Remote, New York NY"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Application Link / Portal</label>
            <input
              type="url"
              value={form.job_url}
              onChange={(e) => setField("job_url", e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" } as React.CSSProperties}
            />
          </div>

          <div>
            <label style={labelStyle}>Resume URL</label>
            <input
              type="url"
              value={form.resume_url}
              onChange={(e) => setField("resume_url", e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Cover Letter URL</label>
            <input
              type="url"
              value={form.cover_letter_url}
              onChange={(e) => setField("cover_letter_url", e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={saving ? {} : { scale: 1.05, y: -1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              flex: 1,
              backgroundColor: "#0a7cff",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "9px 0",
              fontSize: "14px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </motion.button>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05, y: -1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              color: "#787878",
              border: "1px solid #2e2e2e",
              borderRadius: "4px",
              padding: "9px 0",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleDelete}
            disabled={deleting}
            whileHover={deleting ? {} : { scale: 1.05, y: -1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              flex: 1,
              backgroundColor: "#6d0f0f",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "9px 0",
              fontSize: "14px",
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
