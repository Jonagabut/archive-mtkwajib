"use client";
// components/board/ConfessionBoard.tsx
// NO PASSWORD — notes can be posted freely. The board is meant to be fun and open.
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Plus, X, Loader2, Pin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Confession, NoteColor } from "@/lib/supabase/database.types";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const BG_MAP: Record<NoteColor, string> = {
  yellow:   "linear-gradient(145deg, #f9e97a 0%, #eecf2a 100%)",
  pink:     "linear-gradient(145deg, #f9bfaa 0%, #e88060 100%)",
  lavender: "linear-gradient(145deg, #cbbef8 0%, #9880d8 100%)",
};
const PIN_MAP: Record<NoteColor, string> = {
  yellow:   "#c48f1a",
  pink:     "#b85040",
  lavender: "#6050aa",
};
const SHADOW_MAP: Record<NoteColor, string> = {
  yellow:   "3px 3px 0 #c48f1a, 6px 6px 18px rgba(0,0,0,0.45)",
  pink:     "3px 3px 0 #b85040, 6px 6px 18px rgba(0,0,0,0.45)",
  lavender: "3px 3px 0 #6050aa, 6px 6px 18px rgba(0,0,0,0.45)",
};
const COLOR_OPTIONS: { value: NoteColor; bg: string }[] = [
  { value: "yellow",   bg: "#f9e97a" },
  { value: "pink",     bg: "#f9bfaa" },
  { value: "lavender", bg: "#cbbef8" },
];

// Post note directly to Supabase from client — no server action, no password
async function postNote(content: string, color: NoteColor) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const x_pos        = Math.random() * 560 + 40;
  const y_pos        = Math.random() * 380 + 40;
  const rotation_deg = (Math.random() - 0.5) * 10;
  const { data, error } = await supabase
    .from("confessions")
    .insert({ content, color, x_pos, y_pos, rotation_deg })
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id, x_pos, y_pos, rotation_deg };
}

// ── Draggable note ────────────────────────────────────────────────
function DraggableNote({ confession, boardRef }: {
  confession: Confession;
  boardRef: React.RefObject<HTMLDivElement>;
}) {
  const x = useMotionValue(confession.x_pos);
  const y = useMotionValue(confession.y_pos);
  const [dragging, setDragging] = useState(false);
  const color = (confession.color as NoteColor) || "yellow";

  return (
    <motion.div
      drag dragMomentum={false} dragConstraints={boardRef}
      style={{
        x, y, position: "absolute", left: 0, top: 0, width: 160,
        background: BG_MAP[color],
        boxShadow: dragging
          ? `5px 5px 0 ${PIN_MAP[color]}, 10px 10px 28px rgba(0,0,0,0.55)`
          : SHADOW_MAP[color],
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none", touchAction: "none",
        borderRadius: 10,
      }}
      initial={{ scale: 0, opacity: 0, rotate: confession.rotation_deg }}
      animate={{ scale: 1, opacity: 1, rotate: confession.rotation_deg, zIndex: dragging ? 100 : 1 }}
      whileDrag={{ scale: 1.07, zIndex: 100 }}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      className="p-3 flex flex-col gap-1.5 min-h-[105px]"
    >
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: PIN_MAP[color], border: "2px solid rgba(0,0,0,0.15)" }}>
        <Pin size={7} className="text-white/70 -rotate-45" />
      </div>
      <p className="font-body text-[13px] leading-snug text-void/90 break-words">{confession.content}</p>
      <span className="mt-auto font-mono text-[9px] text-void/45">anonim</span>
    </motion.div>
  );
}

// ── Post modal — NO PASSWORD ──────────────────────────────────────
function PostModal({ onClose, onPosted }: {
  onClose: () => void;
  onPosted: (note: Confession) => void;
}) {
  const [color, setColor]         = useState<NoteColor>("yellow");
  const [content, setContent]     = useState("");
  const [status, setStatus]       = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errMsg, setErrMsg]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setStatus("loading"); setErrMsg("");
    try {
      const result = await postNote(content.trim(), color);
      const note: Confession = {
        id: result.id, content: content.trim(), color,
        x_pos: result.x_pos, y_pos: result.y_pos,
        rotation_deg: result.rotation_deg,
        created_at: new Date().toISOString(),
      };
      onPosted(note);
      setStatus("success");
      setTimeout(onClose, 1200);
    } catch {
      setErrMsg("Gagal posting. Coba lagi?");
      setStatus("error");
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-void/90 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="card-glass w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border mb-1" />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-ink">Tempel Note</h3>
            <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={18} /></button>
          </div>

          {status === "success" ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-6">
              <p className="text-3xl mb-2">📌</p>
              <p className="font-display text-lg text-gold">Tertempel!</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Color picker */}
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => setColor(o.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === o.value ? "border-ink scale-110 shadow-md" : "border-transparent hover:scale-105"
                    }`} style={{ background: o.bg }} />
                ))}
                <span className="font-mono text-[10px] text-muted ml-1">warna note</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[11px] text-muted tracking-wide">TULIS SESUATU *</label>
                  <span className={`font-mono text-[10px] ${content.length > 270 ? "text-coral" : "text-muted"}`}>
                    {content.length}/300
                  </span>
                </div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                  required maxLength={300} rows={4}
                  placeholder="Rahasia, roast, hal yang pengen lo sampaikan..."
                  className="input-dark resize-none" />
              </div>

              {errMsg && <p className="text-coral text-sm bg-coral/10 rounded-xl px-3 py-2">{errMsg}</p>}

              <button type="submit" disabled={status === "loading" || !content.trim()} className="btn-gold justify-center w-full disabled:opacity-50">
                {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Pin size={14} />}
                {status === "loading" ? "Nempel..." : "Tempel ke Board"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function LiveDot({ on }: { on: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 font-mono text-[10px] ${on ? "text-muted" : "text-muted/40"}`}>
      {on && <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />}
      <span>{on ? "live" : "–"}</span>
    </div>
  );
}

export default function ConfessionBoard({ initialConfessions }: { initialConfessions: Confession[] }) {
  const boardRef                      = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal]     = useState(false);
  const [notes, setNotes]             = useState<Confession[]>(initialConfessions);
  const [realtimeOk, setRealtimeOk]   = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase
      .channel("board-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confessions" },
        (payload) => {
          setNotes((prev) => {
            if (prev.some((n) => n.id === (payload.new as Confession).id)) return prev;
            return [payload.new as Confession, ...prev];
          });
        })
      .subscribe((s) => setRealtimeOk(s === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePosted = useCallback((note: Confession) => {
    setNotes((prev) => prev.some((n) => n.id === note.id) ? prev : [note, ...prev]);
  }, []);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <LiveDot on={realtimeOk} />
          <button onClick={() => setShowModal(true)} className="btn-gold">
            <Plus size={15} /> Tempel Note
          </button>
        </div>

        <motion.div ref={boardRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="board-bg relative w-full rounded-2xl border border-border overflow-hidden"
          style={{ height: "clamp(360px, 55vw, 680px)" }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{ backgroundImage: "radial-gradient(circle, #f0b429 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          {notes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <p className="text-3xl">📌</p>
              <p className="font-display text-lg text-muted">Board masih kosong.</p>
              <p className="font-body text-sm text-muted/60">Jadi yang pertama!</p>
            </div>
          )}

          <AnimatePresence>
            {notes.map((n) => (
              <DraggableNote key={n.id} confession={n} boardRef={boardRef as React.RefObject<HTMLDivElement>} />
            ))}
          </AnimatePresence>
        </motion.div>

        <p className="mt-2 font-mono text-[10px] text-muted text-right">
          {notes.length} note{notes.length !== 1 ? "s" : ""}{notes.length > 0 && " — drag buat geser"}
        </p>
      </div>

      <AnimatePresence>
        {showModal && <PostModal onClose={() => setShowModal(false)} onPosted={handlePosted} />}
      </AnimatePresence>
    </>
  );
}
