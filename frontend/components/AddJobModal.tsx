"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { createApplication, uploadResume, uploadCoverLetter } from "@/lib/api";
import StatusDropdown, { StatusValue } from "./StatusDropdown";

interface Props {
  initialStatus: StatusValue;
  onClose: () => void;
  onSaved: () => void;
}

// Dark theme tokens
const MODAL_BG = "#252525";
const INPUT_BG = "#1e1e1e";
const BORDER = "#2e2e2e";
const TEXT_PRIMARY = "#ffffff";
const TEXT_SECONDARY = "#787878";

function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["pdf", "docx"].includes(ext ?? "")) return "Only PDF and DOCX files are allowed.";
  if (file.size > 5 * 1024 * 1024) return "File must be under 5 MB.";
  return null;
}

export default function AddJobModal({ initialStatus, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    company: "",
    role: "",
    status: initialStatus as StatusValue,
    applied_date: "",
    location: "",
    job_url: "",
    salary_min: "",
    salary_max: "",
    follow_up_date: "",
    notes: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileSelect(file: File, field: "resume" | "coverLetter") {
    const err = validateFile(file);
    if (err) { setFileError(err); return; }
    setFileError("");
    if (field === "resume") setResumeFile(file);
    else setCoverLetterFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[AddJobModal] handleSubmit fired", form);
    if (!form.company || !form.role || !form.applied_date) {
      setError("Company, Role, and Applied Date are required.");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    console.log("[AddJobModal] token present:", !!token);
    try {
      console.log("[AddJobModal] calling createApplication...");
      const result = await createApplication({
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
      console.log("[AddJobModal] createApplication success:", result);
      if (resumeFile) await uploadResume(result.id, resumeFile);
      if (coverLetterFile) await uploadCoverLetter(result.id, coverLetterFile);
      onSaved();
    } catch (err) {
      console.error("[AddJobModal] createApplication error:", err);
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
            <StatusDropdown
              value={form.status}
              onChange={(v) => set("status", v)}
            />
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

          {fileError && (
            <p className="text-xs" style={{ color: "#DC2626" }}>{fileError}</p>
          )}

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
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  style={{ background: "none", border: "none", color: "#787878", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0 }}
                >×</button>
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
                <button
                  type="button"
                  onClick={() => setCoverLetterFile(null)}
                  style={{ background: "none", border: "none", color: "#787878", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0 }}
                >×</button>
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

          <div className="flex gap-2 pt-2">
            <motion.button
              type="submit"
              className="flex-1 py-2 rounded font-medium"
              whileHover={{ scale: 1.05, y: -1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ backgroundColor: "#0a7cff", color: "#fff", borderRadius: "4px", border: "none", cursor: "pointer" }}
            >
              Save
            </motion.button>
            <motion.button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded font-medium"
              whileHover={{ scale: 1.05, y: -1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ border: `1px solid ${BORDER}`, borderRadius: "4px", color: TEXT_SECONDARY, backgroundColor: "transparent", cursor: "pointer" }}
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
