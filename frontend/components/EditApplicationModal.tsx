"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Application, updateApplication, deleteApplication, uploadResume, uploadCoverLetter, getResumeDownloadUrl, getCoverLetterDownloadUrl } from "@/lib/api";
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
    contact_person: app.contact_person ?? "",
    contact_email: app.contact_email ?? "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function validateFile(file: File): string | null {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) return "Only PDF and DOCX files are allowed.";
    if (file.size > 5 * 1024 * 1024) return "File must be under 5 MB.";
    return null;
  }

  function handleFileSelect(file: File, field: "resume" | "coverLetter") {
    const err = validateFile(file);
    if (err) { setFileError(err); return; }
    setFileError("");
    if (field === "resume") setResumeFile(file);
    else setCoverLetterFile(file);
  }

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
        contact_person: form.contact_person || undefined,
        contact_email: form.contact_email || undefined,
      });
      if (resumeFile) await uploadResume(app.id, resumeFile);
      if (coverLetterFile) await uploadCoverLetter(app.id, coverLetterFile);
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={labelStyle}>Contact Person</label>
              <input
                value={form.contact_person}
                onChange={(e) => setField("contact_person", e.target.value)}
                placeholder="Name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email / Phone</label>
              <input
                value={form.contact_email}
                onChange={(e) => setField("contact_email", e.target.value)}
                placeholder="email or phone"
                style={inputStyle}
              />
            </div>
          </div>

          {fileError && <p style={{ color: "#b71c1c", fontSize: "11px" }}>{fileError}</p>}

          <div>
            <label style={labelStyle}>Resume Used</label>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "resume"); }}
            />
            {resumeFile ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#2e9e50" }}>✓ {resumeFile.name}</span>
                <button type="button" onClick={() => setResumeFile(null)} style={{ background: "none", border: "none", color: "#787878", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ) : app.resume_file_path ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "#ffffff" }}>📄 {app.resume_filename || app.resume_file_path}</span>
                <a href={getResumeDownloadUrl(app.id)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: "12px", color: "#0a7cff", textDecoration: "none" }}>Download</a>
                <button type="button" onClick={() => resumeInputRef.current?.click()} style={{ fontSize: "12px", color: "#787878", background: "none", border: "1px solid #2e2e2e", borderRadius: "3px", cursor: "pointer", padding: "1px 6px" }}>Replace</button>
              </div>
            ) : (
              <motion.button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ ...inputStyle, textAlign: "left", cursor: "pointer", color: "#787878" }}
              >
                Upload Resume (PDF/DOCX)
              </motion.button>
            )}
          </div>

          <div>
            <label style={labelStyle}>Cover Letter Used</label>
            <input
              ref={coverLetterInputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, "coverLetter"); }}
            />
            {coverLetterFile ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#2e9e50" }}>✓ {coverLetterFile.name}</span>
                <button type="button" onClick={() => setCoverLetterFile(null)} style={{ background: "none", border: "none", color: "#787878", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ) : app.cover_letter_file_path ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "#ffffff" }}>📄 {app.cover_letter_filename || app.cover_letter_file_path}</span>
                <a href={getCoverLetterDownloadUrl(app.id)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: "12px", color: "#0a7cff", textDecoration: "none" }}>Download</a>
                <button type="button" onClick={() => coverLetterInputRef.current?.click()} style={{ fontSize: "12px", color: "#787878", background: "none", border: "1px solid #2e2e2e", borderRadius: "3px", cursor: "pointer", padding: "1px 6px" }}>Replace</button>
              </div>
            ) : (
              <motion.button
                type="button"
                onClick={() => coverLetterInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ ...inputStyle, textAlign: "left", cursor: "pointer", color: "#787878" }}
              >
                Upload Cover Letter (PDF/DOCX)
              </motion.button>
            )}
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
