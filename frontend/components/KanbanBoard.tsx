"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { DndContext, DragEndEvent, useDroppable, useDraggable } from "@dnd-kit/core";
import { listApplications, updateApplication, Application } from "@/lib/api";
import AddJobModal from "./AddJobModal";

const STATUSES = ["applied", "phone_screen", "interview", "offer", "rejected", "withdrawn"] as const;
type Status = typeof STATUSES[number];

const STATUS_LABELS: Record<Status, string> = {
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STATUS_BG_COLORS: Record<Status, string> = {
  applied: "#1e3a5f",
  phone_screen: "#3d2e00",
  interview: "#2d1b4e",
  offer: "#1a3d2b",
  rejected: "#3d1a1a",
  withdrawn: "#2a2a2a",
};

const CARD_BG_COLORS: Record<Status, string> = {
  applied: "#264875",
  phone_screen: "#523d00",
  interview: "#3a2462",
  offer: "#205038",
  rejected: "#502020",
  withdrawn: "#363636",
};

// ── Application detail modal ───────────────────────────────────────────────────
function DetailModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Company", app.company],
    ["Role", app.role],
    ["Status", app.status.replace("_", " ")],
    ["Applied Date", app.applied_date ?? "—"],
    ["Location", app.location ?? "—"],
    ["Job URL", app.job_url ?? "—"],
    ["Follow-up Date", app.follow_up_date ?? "—"],
    ["Notes", app.notes ?? "—"],
    ["Resume URL", app.resume_url ?? "—"],
    ["Cover Letter URL", app.cover_letter_url ?? "—"],
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: "#252525", borderRadius: "8px", padding: "24px", maxWidth: "480px", width: "90%", border: "1px solid #2e2e2e", maxHeight: "80vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px", margin: 0 }}>{app.company}</h2>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05, y: -1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ background: "none", border: "none", color: "#787878", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </motion.button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "#787878", fontSize: "12px", minWidth: "120px", flexShrink: 0, paddingTop: "1px" }}>{label}</span>
              <span style={{ color: "#ffffff", fontSize: "13px", wordBreak: "break-all" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
function Card({ app, onOpenDetail }: { app: Application; onOpenDetail: (a: Application) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const dragOccurred = useRef(false);
  const status = (STATUSES.includes(app.status as Status) ? app.status : "withdrawn") as Status;
  const cardBg = CARD_BG_COLORS[status];

  const style = transform
    ? { transform: `translate(${transform.x}px,${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onPointerDown={() => { dragOccurred.current = false; }}
      onPointerMove={() => { dragOccurred.current = true; }}
      onClick={() => { if (!dragOccurred.current) onOpenDetail(app); dragOccurred.current = false; }}
    >
      <motion.div
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          backgroundColor: cardBg,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "6px",
          cursor: "grab",
          padding: "10px 12px",
          marginBottom: "8px",
        }}
        className="select-none"
      >
        <p style={{ color: "#ffffff", fontWeight: 600, fontSize: "13px", margin: 0 }}>{app.company}</p>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginTop: "2px", marginBottom: 0 }}>{app.role}</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>{app.applied_date}</p>
      </motion.div>
    </div>
  );
}

// ── Column ─────────────────────────────────────────────────────────────────────
function Column({
  status,
  cards,
  onAdd,
  onOpenDetail,
}: {
  status: Status;
  cards: Application[];
  onAdd: (s: Status) => void;
  onOpenDetail: (a: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: "220px",
        backgroundColor: isOver ? "#333333" : STATUS_BG_COLORS[status],
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "8px",
        padding: "12px",
        transition: "background-color 0.15s",
      }}
    >
      {/* Plain text header — no box */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          padding: "2px 4px",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "12px", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {STATUS_LABELS[status]}
        </span>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
          {cards.length}
        </span>
      </div>

      {cards.map((c) => <Card key={c.id} app={c} onOpenDetail={onOpenDetail} />)}

      <motion.button
        onClick={() => onAdd(status)}
        whileHover={{ scale: 1.05, y: -1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          width: "100%",
          fontSize: "12px",
          marginTop: "4px",
          padding: "5px 0",
          borderRadius: "4px",
          color: "rgba(255,255,255,0.4)",
          border: "1px dashed rgba(255,255,255,0.15)",
          backgroundColor: "transparent",
          cursor: "pointer",
        }}
      >
        + New item
      </motion.button>
    </div>
  );
}

// ── KanbanBoard ────────────────────────────────────────────────────────────────
export default function KanbanBoard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [modalStatus, setModalStatus] = useState<Status | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const data = await listApplications();
    setApps(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newStatus = over.id as string;
    if (!STATUSES.includes(newStatus as Status)) return;
    const prevApps = apps;
    setApps((prev) => prev.map((a) => a.id === active.id ? { ...a, status: newStatus } : a));
    try {
      await updateApplication(active.id as string, { status: newStatus });
    } catch {
      setApps(prevApps);
    }
  }

  const filtered = search.trim()
    ? apps.filter((a) => a.company.toLowerCase().includes(search.toLowerCase()))
    : apps;

  const byStatus = (s: Status) => filtered.filter((a) => a.status === s);

  return (
    <>
      {/* Search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <div style={{ position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company..."
            style={{
              backgroundColor: "#1e1e1e",
              border: "1px solid #2e2e2e",
              borderRadius: "4px",
              color: "#ffffff",
              fontSize: "13px",
              padding: "6px 28px 6px 10px",
              outline: "none",
              width: "220px",
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
                color: "#787878",
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
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <Column
              key={s}
              status={s}
              cards={byStatus(s)}
              onAdd={(st) => setModalStatus(st)}
              onOpenDetail={setSelectedApp}
            />
          ))}
        </div>
      </DndContext>

      <motion.button
        onClick={() => setModalStatus("applied")}
        whileHover={{ scale: 1.05, y: -1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full text-white text-2xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: "#0a7cff" }}
        title="Add application"
      >
        +
      </motion.button>

      {modalStatus && (
        <AddJobModal
          initialStatus={modalStatus}
          onClose={() => setModalStatus(null)}
          onSaved={() => { setModalStatus(null); load(); }}
        />
      )}

      {selectedApp && (
        <DetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </>
  );
}
