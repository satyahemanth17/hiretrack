"use client";

import { useEffect, useState, useCallback } from "react";
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

const STATUS_COLORS: Record<Status, { bg: string; text: string }> = {
  applied: { bg: "#EFF6FF", text: "#2563EB" },
  phone_screen: { bg: "#F5F3FF", text: "#7C3AED" },
  interview: { bg: "#FFF7ED", text: "#C2410C" },
  offer: { bg: "#F0FDF4", text: "#15803D" },
  rejected: { bg: "#FEF2F2", text: "#DC2626" },
  withdrawn: { bg: "#F9FAFB", text: "#6B7280" },
};

function Card({ app }: { app: Application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const style = transform
    ? { transform: `translate(${transform.x}px,${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;
  const colors = STATUS_COLORS[app.status as Status] ?? { bg: "#F9FAFB", text: "#6B7280" };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "grab" }}
      className="p-3 mb-2 select-none"
      {...listeners}
      {...attributes}
    >
      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{app.company}</p>
      <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{app.role}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{app.applied_date}</p>
      <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: colors.bg, color: colors.text, borderRadius: "9999px" }}>
        {STATUS_LABELS[app.status as Status] ?? app.status}
      </span>
    </div>
  );
}

function Column({ status, cards, onAdd }: { status: Status; cards: Application[]; onAdd: (s: Status) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      style={{ minWidth: "220px", backgroundColor: isOver ? "#EFF6FF" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "12px", transition: "background-color 0.15s" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{STATUS_LABELS[status]}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--border)", color: "var(--text-secondary)", borderRadius: "9999px" }}>{cards.length}</span>
      </div>
      {cards.map((c) => <Card key={c.id} app={c} />)}
      <button
        onClick={() => onAdd(status)}
        className="w-full text-xs mt-1 py-1 rounded"
        style={{ color: "var(--text-secondary)", border: "1px dashed var(--border)" }}
      >
        + Add
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
        style={{ backgroundColor: "var(--primary)" }}
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
