"use client";
import { useState } from "react";
import { Application } from "@/lib/api";

interface Props {
  apps: Application[];
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

export default function DeadlinesCalendar({ apps }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // "YYYY-MM-DD"

  function prevMonth() {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
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
  const today = new Date().toISOString().slice(0, 10);

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
      </div>

      {/* Day-of-week headers + day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "1px",
          backgroundColor: "#2e2e2e",
          borderRadius: "6px 6px 0 0",
          overflow: "hidden",
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
            <div
              key={i}
              onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
              style={{
                backgroundColor: isSelected ? "#2a2a3a" : "#191919",
                padding: "8px",
                minHeight: "72px",
                cursor: day ? "pointer" : "default",
                borderTop: "1px solid #2e2e2e",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (day) e.currentTarget.style.backgroundColor = "#252525";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isSelected ? "#2a2a3a" : "#191919";
              }}
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
                </>
              )}
            </div>
          );
        })}
      </div>

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
