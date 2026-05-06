"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Application, createApplication } from "@/lib/api";
import StatusDropdown, { StatusValue, StatusPill, STATUS_OPTIONS } from "./StatusDropdown";
import EditApplicationModal from "./EditApplicationModal";

interface Props {
  apps: Application[];
  onRefresh?: () => void;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export default function DeadlinesCalendar({ apps, onRefresh }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<{
    company: string;
    role: string;
    location: string;
    applied_date: string;
    status: StatusValue;
  }>({ company: "", role: "", location: "", applied_date: today, status: "applied" });
  const [addError, setAddError] = useState("");
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function openAddModal(day: string) {
    setAddingToDay(day);
    setAddForm((f) => ({ ...f, applied_date: day }));
    setAddError("");
  }

  async function handleAdd() {
    if (!addForm.company || !addForm.role || !addForm.applied_date) {
      setAddError("Company, Role, and Applied Date are required.");
      return;
    }
    try {
      await createApplication({
        company: addForm.company,
        role: addForm.role,
        location: addForm.location || undefined,
        status: addForm.status,
        applied_date: addForm.applied_date,
        follow_up_date: addingToDay ?? undefined,
      });
      setAddingToDay(null);
      setAddForm({ company: "", role: "", location: "", applied_date: today, status: "applied" });
      setAddError("");
      onRefresh?.();
    } catch {
      setAddError("Failed to save. Please try again.");
    }
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const byDate: Record<string, Application[]> = {};
  for (const app of apps) {
    if (app.follow_up_date) {
      (byDate[app.follow_up_date] ??= []).push(app);
    }
  }

  const monthLabel = currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" });
  const selectedApps = selectedDay ? (byDate[selectedDay] ?? []) : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <motion.button
          onClick={prevMonth}
          whileHover={{ scale: 1.05, y: -1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            background: "none",
            border: "1px solid #2e2e2e",
            borderRadius: "4px",
            color: "#ffffff",
            cursor: "pointer",
            padding: "4px 10px",
          }}
        >
          ←
        </motion.button>
        <span
          style={{
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "16px",
            minWidth: "160px",
            textAlign: "center",
          }}
        >
          {monthLabel}
        </span>
        <motion.button
          onClick={nextMonth}
          whileHover={{ scale: 1.05, y: -1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            background: "none",
            border: "1px solid #2e2e2e",
            borderRadius: "4px",
            color: "#ffffff",
            cursor: "pointer",
            padding: "4px 10px",
          }}
        >
          →
        </motion.button>
        <motion.button
          onClick={() => openAddModal(today)}
          whileHover={{ scale: 1.05, y: -1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "1px solid #2e2e2e",
            borderRadius: "4px",
            color: "#787878",
            cursor: "pointer",
            padding: "4px 10px",
            fontSize: "13px",
          }}
        >
          + New
        </motion.button>
      </div>

      {/* Day-of-week headers + day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "1px",
          backgroundColor: "#2e2e2e",
          borderRadius: "6px 6px 0 0",
        }}
      >
        {DOW.map((d) => (
          <div
            key={d}
            style={{
              backgroundColor: "#252525",
              padding: "8px",
              textAlign: "center",
              fontSize: "12px",
              color: "#787878",
              fontWeight: 500,
            }}
          >
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          const appsOnDay = day ? (byDate[day] ?? []) : [];
          const isToday = day === today;
          const isSelected = day === selectedDay;
          return (
            <motion.div
              key={i}
              onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
              whileHover={day ? { scale: 1.06, zIndex: 1 } : {}}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                backgroundColor: isSelected ? "#2a2a3a" : "#191919",
                padding: "8px",
                minHeight: "72px",
                cursor: day ? "pointer" : "default",
                borderTop: "1px solid #2e2e2e",
                position: "relative",
              }}
              onMouseEnter={() => { if (day) setHoveredDay(day); }}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {day && (
                <>
                  <span
                    style={{
                      fontSize: "13px",
                      color: isToday ? "#0a7cff" : "#ffffff",
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {parseInt(day.slice(8), 10)}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                    {appsOnDay.slice(0, 3).map((app, j) => {
                      const opt = STATUS_OPTIONS.find((o) => o.value === app.status) ?? STATUS_OPTIONS[1];
                      return (
                        <div
                          key={j}
                          title={`${app.company} — ${app.role}`}
                          style={{ display: "flex", alignItems: "center", gap: "3px" }}
                        >
                          <span style={{ color: opt.color, fontSize: "7px", flexShrink: 0 }}>●</span>
                          <span style={{ color: "#ffffff", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72px" }}>
                            {app.company}
                          </span>
                        </div>
                      );
                    })}
                    {appsOnDay.length > 3 && (
                      <span style={{ fontSize: "10px", color: "#787878" }}>
                        +{appsOnDay.length - 3}
                      </span>
                    )}
                  </div>
                  {hoveredDay === day && (
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddModal(day);
                      }}
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "4px",
                        color: "#ffffff",
                        cursor: "pointer",
                        fontSize: "18px",
                        lineHeight: 1,
                        padding: "2px 6px",
                        fontWeight: 300,
                      }}
                      title="Add application"
                    >
                      +
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add application — centered modal overlay */}
      {addingToDay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => { setAddingToDay(null); setAddError(""); }}
        >
          <div
            style={{
              backgroundColor: "#252525",
              borderRadius: "8px",
              border: "1px solid #2e2e2e",
              padding: "24px",
              width: "90%",
              maxWidth: "520px",
              boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <p style={{ color: "#ffffff", fontSize: "15px", fontWeight: 600, margin: 0 }}>
                Add application —{" "}
                {new Date(addingToDay + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <motion.button
                onClick={() => { setAddingToDay(null); setAddError(""); }}
                whileHover={{ scale: 1.05, y: -1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ background: "none", border: "none", color: "#787878", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}
              >
                ×
              </motion.button>
            </div>

            {addError && (
              <p style={{ color: "#b71c1c", fontSize: "12px", marginBottom: "12px" }}>{addError}</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#787878", marginBottom: "4px" }}>Company *</label>
                  <input
                    placeholder="e.g. Acme Corp"
                    value={addForm.company}
                    onChange={(e) => setAddForm((f) => ({ ...f, company: e.target.value }))}
                    style={{ width: "100%", backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffff", padding: "7px 10px", fontSize: "13px", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#787878", marginBottom: "4px" }}>Role *</label>
                  <input
                    placeholder="e.g. Software Engineer"
                    value={addForm.role}
                    onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                    style={{ width: "100%", backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffff", padding: "7px 10px", fontSize: "13px", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#787878", marginBottom: "4px" }}>Location</label>
                <input
                  placeholder="e.g. Remote, New York NY"
                  value={addForm.location}
                  onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
                  style={{ width: "100%", backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffff", padding: "7px 10px", fontSize: "13px", boxSizing: "border-box", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#787878", marginBottom: "4px" }}>Applied Date *</label>
                  <input
                    type="date"
                    value={addForm.applied_date}
                    onChange={(e) => setAddForm((f) => ({ ...f, applied_date: e.target.value }))}
                    style={{ width: "100%", backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffff", padding: "7px 10px", fontSize: "13px", boxSizing: "border-box", outline: "none", colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#787878", marginBottom: "4px" }}>Status</label>
                  <StatusDropdown
                    value={addForm.status}
                    onChange={(v) => setAddForm((f) => ({ ...f, status: v }))}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <motion.button
                onClick={handleAdd}
                whileHover={{ scale: 1.05, y: -1 }}
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
                  cursor: "pointer",
                }}
              >
                Save Application
              </motion.button>
              <motion.button
                onClick={() => { setAddingToDay(null); setAddError(""); }}
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
            </div>
          </div>
        </div>
      )}

      {/* Selected day detail — centered modal overlay */}
      {selectedDay && !addingToDay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            style={{
              backgroundColor: "#252525",
              borderRadius: "8px",
              border: "1px solid #2e2e2e",
              padding: "24px",
              width: "90%",
              maxWidth: "480px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ color: "#787878", fontSize: "12px", margin: 0 }}>
                Deadlines on{" "}
                {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); openAddModal(selectedDay); setSelectedDay(null); }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{
                    background: "none",
                    border: "1px solid #2e2e2e",
                    borderRadius: "4px",
                    color: "#787878",
                    cursor: "pointer",
                    fontSize: "12px",
                    padding: "3px 8px",
                  }}
                >
                  + Add
                </motion.button>
                <motion.button
                  onClick={() => setSelectedDay(null)}
                  whileHover={{ scale: 1.05, y: -1 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{ background: "none", border: "none", color: "#787878", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}
                >
                  ×
                </motion.button>
              </div>
            </div>
            {selectedApps.length === 0 ? (
              <p style={{ color: "#787878", fontSize: "13px" }}>No deadlines on this day.</p>
            ) : (
              selectedApps.map((app) => {
                const opt = STATUS_OPTIONS.find((o) => o.value === app.status) ?? STATUS_OPTIONS[1];
                return (
                  <div
                    key={app.id}
                    onClick={() => { setSelectedDay(null); setEditingApp(app); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 0",
                      borderBottom: "1px solid #2e2e2e",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                  >
                    <span style={{ color: "#ffffff", fontWeight: 500, fontSize: "13px" }}>
                      {app.company}
                    </span>
                    <span style={{ color: "#787878", fontSize: "13px" }}>{app.role}</span>
                    <span style={{ marginLeft: "auto" }}>
                      <StatusPill label={opt.label} color={opt.color} outerColor={opt.outerColor} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {editingApp && (
        <EditApplicationModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSaved={() => { setEditingApp(null); onRefresh?.(); }}
          onDeleted={() => { setEditingApp(null); onRefresh?.(); }}
        />
      )}
    </div>
  );
}
