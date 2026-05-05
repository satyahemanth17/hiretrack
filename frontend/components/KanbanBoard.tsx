"use client";

import { useEffect, useState, useCallback } from "react";
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

// Dark theme status dot / title colors
const STATUS_DOT_COLORS: Record<Status, string> = {
  applied: "#0a7cff",
  phone_screen: "#d9a21b",
  interview: "#7c51bb",
  offer: "#2e7d32",
  rejected: "#b71c1c",
  withdrawn: "#454545",
};

function Card({ app }: { app: Application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const style = transform
    ? { transform: `translate(${transform.x}px,${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.15, type: "tween" }}
        style={{
          backgroundColor: "#1e1e1e",
          border: "1px solid #2e2e2e",
          borderRadius: "6px",
          cursor: "grab",
          padding: "10px 12px",
          marginBottom: "8px",
        }}
        className="select-none"
      >
        <p style={{ color: "#ffffffcf", fontWeight: 600, fontSize: "13px", margin: 0 }}>{app.company}</p>
        <p style={{ color: "#787878", fontSize: "13px", marginTop: "2px", marginBottom: 0 }}>{app.role}</p>
        <p style={{ color: "#787878", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>{app.applied_date}</p>
      </motion.div>
    </div>
  );
}

function Column({ status, cards, onAdd }: { status: Status; cards: Application[]; onAdd: (s: Status) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const dotColor = STATUS_DOT_COLORS[status];

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: "220px",
        backgroundColor: isOver ? "#333333" : STATUS_BG_COLORS[status],
        border: "1px solid #2e2e2e",
        borderRadius: "6px",
        padding: "12px",
        transition: "background-color 0.15s",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: dotColor,
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 500, fontSize: "13px", color: dotColor }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            padding: "1px 7px",
            borderRadius: "9999px",
            backgroundColor: "#2e2e2e",
            color: "#787878",
          }}
        >
          {cards.length}
        </span>
      </div>

      {cards.map((c) => <Card key={c.id} app={c} />)}

      <button
        onClick={() => onAdd(status)}
        style={{
          width: "100%",
          fontSize: "12px",
          marginTop: "4px",
          padding: "5px 0",
          borderRadius: "4px",
          color: "#787878",
          border: "1px dashed #2e2e2e",
          backgroundColor: "transparent",
          cursor: "pointer",
        }}
      >
        + New item
      </button>
    </div>
  );
}

export default function KanbanBoard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [modalStatus, setModalStatus] = useState<Status | null>(null);

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

  const byStatus = (s: Status) => apps.filter((a) => a.status === s);

  return (
    <>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => (
            <Column key={s} status={s} cards={byStatus(s)} onAdd={(st) => setModalStatus(st)} />
          ))}
        </div>
      </DndContext>
      <button
        onClick={() => setModalStatus("applied")}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full text-white text-2xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: "#0a7cff" }}
        title="Add application"
      >
        +
      </button>
      {modalStatus && (
        <AddJobModal
          initialStatus={modalStatus}
          onClose={() => setModalStatus(null)}
          onSaved={() => { setModalStatus(null); load(); }}
        />
      )}
    </>
  );
}
