"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Application, createApplication } from "@/lib/api";

interface Props {
  apps: Application[];
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  applied: "#0a7cff",
  phone_screen: "#d9a21b",
  interview: "#7c51bb",
  offer: "#2e7d32",
  rejected: "#b71c1c",
  withdrawn: "#454545",
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DeadlinesCalendar({ apps, onRefresh }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // "YYYY-MM-DD"
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ company: "", role: "", location: "", applied_date: today, status: "applied" });
  const [addError, setAddError] = useState("");
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  function prevMonth() {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  async function handleAdd(day: string) {
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
        follow_up_date: day,
      });
      setAddingToDay(null);
      setAddForm({ company: "", role: "", location: "", applied_date: today, status: "applied" });
      setAddError("");
      onRefresh?.();
    } catch (e) {
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

  // Group apps by follow_up_date
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
        <button
          onClick={prevMonth}
          style={{
            background: "none",
            border: "1px solid #2e2e2e",
            borderRadius: "4px",
            color: "#ffffffcf",
            cursor: "pointer",
            padding: "4px 10px",
          }}
        >
          ←
        </button>
        <span
          style={{
            color: "#ffffffcf",
            fontWeight: 600,
            fontSize: "16px",
            minWidth: "160px",
            textAlign: "center",
          }}
        >
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: "none",
            border: "1px solid #2e2e2e",
            borderRadius: "4px",
            color: "#ffffffcf",
            cursor: "pointer",
            padding: "4px 10px",
          }}
        >
          →
        </button>
        <button
          onClick={() => { setAddingToDay(today); setAddForm(f => ({ ...f, applied_date: today })); }}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "1px solid #2e2e2e",
            borderRadius: "4px",
            color: "#787878",
            cursor: "pointer",
            padding: "4px 10px",
            fontSize: "12px",
          }}
        >
          + New
        </button>
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
        {DOW.map(d => (
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
              whileHover={day ? { scale: 1.02, zIndex: 1 } : {}}
              transition={{ duration: 0.1, type: "tween" }}
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
                      color: isToday ? "#0a7cff" : "#ffffffcf",
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {parseInt(day.slice(8), 10)}
                  </span>
                  <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "4px" }}>
                    {appsOnDay.slice(0, 3).map((app, j) => (
                      <span
                        key={j}
                        title={`${app.company} — ${app.role}`}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: STATUS_COLORS[app.status] ?? "#454545",
                          display: "inline-block",
                        }}
                      />
                    ))}
                    {appsOnDay.length > 3 && (
                      <span style={{ fontSize: "10px", color: "#787878" }}>
                        +{appsOnDay.length - 3}
                      </span>
                    )}
                  </div>
                  {hoveredDay === day && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingToDay(day);
                        setAddForm(f => ({ ...f, applied_date: day }));
                      }}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "none",
                        border: "none",
                        color: "#787878",
                        cursor: "pointer",
                        fontSize: "14px",
                        lineHeight: 1,
                        padding: "0 2px",
                      }}
                      title="Add application"
                    >
                      +
                    </button>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Inline add form */}
      {addingToDay && (
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "#252525",
            borderRadius: "6px",
            border: "1px solid #2e2e2e",
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ color: "#ffffffcf", fontSize: "13px", fontWeight: 600, margin: 0 }}>
              Add application — {new Date(addingToDay + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <button
              onClick={() => { setAddingToDay(null); setAddError(""); }}
              style={{ background: "none", border: "none", color: "#787878", cursor: "pointer", fontSize: "16px" }}
            >
              ×
            </button>
          </div>
          {addError && <p style={{ color: "#b71c1c", fontSize: "12px", marginBottom: "8px" }}>{addError}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
            <input
              placeholder="Company *"
              value={addForm.company}
              onChange={e => setAddForm(f => ({ ...f, company: e.target.value }))}
              style={{ backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffffcf", padding: "6px 10px", fontSize: "13px" }}
            />
            <input
              placeholder="Role *"
              value={addForm.role}
              onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
              style={{ backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffffcf", padding: "6px 10px", fontSize: "13px" }}
            />
            <input
              placeholder="Location"
              value={addForm.location}
              onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
              style={{ backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffffcf", padding: "6px 10px", fontSize: "13px" }}
            />
            <input
              type="date"
              value={addForm.applied_date}
              onChange={e => setAddForm(f => ({ ...f, applied_date: e.target.value }))}
              style={{ backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffffcf", padding: "6px 10px", fontSize: "13px" }}
            />
            <select
              value={addForm.status}
              onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
              style={{ backgroundColor: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: "4px", color: "#ffffffcf", padding: "6px 10px", fontSize: "13px" }}
            >
              <option value="applied">Applied</option>
              <option value="phone_screen">Phone Screen</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <button
            onClick={() => handleAdd(addingToDay)}
            style={{
              backgroundColor: "#0a7cff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "6px 16px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      )}

      {/* Selected day detail */}
      {selectedDay && (
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "#252525",
            borderRadius: "6px",
            border: "1px solid #2e2e2e",
            padding: "16px",
          }}
        >
          <p style={{ color: "#787878", fontSize: "12px", marginBottom: "12px" }}>
            Deadlines on{" "}
            {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {selectedApps.length === 0 ? (
            <p style={{ color: "#787878", fontSize: "13px" }}>No deadlines on this day.</p>
          ) : (
            selectedApps.map(app => (
              <div
                key={app.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 0",
                  borderBottom: "1px solid #2e2e2e",
                }}
              >
                <span style={{ color: "#ffffffcf", fontWeight: 500, fontSize: "13px" }}>
                  {app.company}
                </span>
                <span style={{ color: "#787878", fontSize: "13px" }}>{app.role}</span>
                <span
                  style={{
                    fontSize: "11px",
                    backgroundColor: STATUS_COLORS[app.status] ?? "#454545",
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  {app.status.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
