"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { DndContext, DragEndEvent, useDroppable, useDraggable } from "@dnd-kit/core";
import { listApplications, updateApplication, Application } from "@/lib/api";
import AddJobModal from "./AddJobModal";
import EditApplicationModal from "./EditApplicationModal";
import { StatusPill, STATUS_OPTIONS } from "./StatusDropdown";

const STATUSES = ["applied", "phone_screen", "interview", "offer", "rejected", "withdrawn"] as const;
type Status = typeof STATUSES[number];

const STATUS_BG_COLORS: Record<Status, string> = {
  applied: "#111827",
  phone_screen: "#1a1500",
  interview: "#130d1f",
  offer: "#0d1f14",
  rejected: "#1f0d0d",
  withdrawn: "#111111",
};

const CARD_BG_COLORS: Record<Status, string> = {
  applied: "#2a4f7a",
  phone_screen: "#5a4200",
  interview: "#3f2870",
  offer: "#265c40",
  rejected: "#5c2828",
  withdrawn: "#333333",
};

const CARD_BORDER_COLORS: Record<Status, string> = {
  applied: "#3a6090",
  phone_screen: "#6e5100",
  interview: "#513490",
  offer: "#327550",
  rejected: "#703333",
  withdrawn: "#444444",
};

const NEW_ITEM_COLORS: Record<Status, string> = {
  applied: "#1a6fd4",
  phone_screen: "#d9a21b",
  interview: "#7c51bb",
  offer: "#2e9e50",
  rejected: "#d93b3b",
  withdrawn: "#909090",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Card ───────────────────────────────────────────────────────────────────────
function Card({ app, onOpenDetail }: { app: Application; onOpenDetail: (a: Application) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const dragOccurred = useRef(false);

  const cardBg = CARD_BG_COLORS[app.status as Status] ?? "#1e1e1e";
  const cardBorder = CARD_BORDER_COLORS[app.status as Status] ?? "#2e2e2e";

  const style = transform
    ? {
        transform: `translate(${transform.x}px,${transform.y}px) scale(${isDragging ? 1.02 : 1})`,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onMouseDown={() => { dragOccurred.current = false; }}
      onPointerMove={() => { dragOccurred.current = true; }}
      onClick={() => { if (!dragOccurred.current) onOpenDetail(app); dragOccurred.current = false; }}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: "6px",
          cursor: isDragging ? "grabbing" : "grab",
          padding: "10px 12px",
          marginBottom: "8px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
        }}
        className="select-none"
      >
        <p style={{ color: "#ffffff", fontWeight: 600, fontSize: "13px", margin: 0 }}>{app.company}</p>
        <p style={{ color: "#ffffff", fontSize: "13px", marginTop: "2px", marginBottom: 0 }}>{app.role}</p>
        <p style={{ color: "rgba(255,255,255,0.67)", fontSize: "12px", marginTop: "4px", marginBottom: 0 }}>{formatDate(app.applied_date)}</p>
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
  const opt = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[1];

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: "220px",
        backgroundColor: STATUS_BG_COLORS[status],
        border: isOver ? "1px solid rgba(10,124,255,0.5)" : "1px solid rgba(0,0,0,0.1)",
        boxShadow: isOver ? "0 0 0 2px rgba(10,124,255,0.25)" : "none",
        borderRadius: "8px",
        padding: "12px",
        transition: "border 0.15s, box-shadow 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          padding: "2px 4px",
        }}
      >
        <StatusPill label={opt.label} color={opt.color} outerColor={opt.outerColor} />
        <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginLeft: "8px" }}>
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
          color: NEW_ITEM_COLORS[status],
          border: `1px dashed ${NEW_ITEM_COLORS[status]}55`,
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
        style={{ backgroundColor: "#0a7cff", cursor: "pointer" }}
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
        <EditApplicationModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSaved={() => { setSelectedApp(null); load(); }}
          onDeleted={() => { setSelectedApp(null); load(); }}
        />
      )}
    </>
  );
}
