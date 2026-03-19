"use client";
// components/board/ConfessionBoard.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Plus, X, Loader2, Pin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Confession, NoteColor } from "@/lib/supabase/database.types";
import {
  postConfessionAction,
  updateConfessionPositionAction,
} from "@/app/actions/confessions";

const SHADOW_MAP: Record<NoteColor, string> = {
  yellow:   "4px 4px 0px #c9a232, 8px 8px 20px rgba(0,0,0,0.4)",
  pink:     "4px 4px 0px #c4674e, 8px 8px 20px rgba(0,0,0,0.4)",
  lavender: "4px 4px 0px #7a6faa, 8px 8px 20px rgba(0,0,0,0.4)",
};

const BG_MAP: Record<NoteColor, string> = {
  yellow:   "linear-gradient(135deg, #f5e27a 0%, #f0d84a 50%, #e8cc30 100%)",
  pink:     "linear-gradient(135deg, #f7b8a0 0%, #f0956e 50%, #e87850 100%)",
  lavender: "linear-gradient(135deg, #c4b8f0 0%, #a898e0 50%, #9080d0 100%)",
};

const PIN_COLOR_MAP: Record<NoteColor, string> = {
  yellow:   "#c9a232",
  pink:     "#c4674e",
  lavender: "#7a6faa",
};

const COLOR_OPTIONS: { value: NoteColor; label: string; preview: string }[] = [
  { value: "yellow",   label: "Kuning",   preview: "#f5e27a" },
  { value: "pink",     label: "Pink",     preview: "#f7b8a0" },
  { value: "lavender", label: "Lavender", preview: "#c4b8f0" },
];

function DraggableNote({
  confession,
  boardRef,
}: {
  confession: Confession;
  boardRef: React.RefObject<HTMLDivElement>;
}) {
  const x = useMotionValue(confession.x_pos);
  const y = useMotionValue(confession.y_pos);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const noteColor = (confession.color as NoteColor) || "yellow";

  const handleDragEnd = useCallback(async () => {
    setIsDragging(false);
    setIsSaving(true);
    setSaveFailed(false);
    try {
      const result = await updateConfessionPositionAction(confession.id, x.get(), y.get());
      if (result.error) setSaveFailed(true);
    } catch {
      setSaveFailed(true);
    } finally {
      setIsSaving(false);
    }
  }, [confession.id, x, y]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={boardRef}
      style={{
        x, y,
        position: "absolute",
        left: 0, top: 0,
        width: 165,
        background: BG_MAP[noteColor],
        boxShadow: isDragging
          ? `6px 6px 0px ${PIN_COLOR_MAP[noteColor]}, 12px 12px 30px rgba(0,0,0,0.6)`
          : SHADOW_MAP[noteColor],
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
      }}
      initial={{ scale: 0, opacity: 0, rotate: confession.rotation_deg }}
      animate={{ scale: 1, opacity: 1, rotate: confession.rotation_deg, zIndex: isDragging ? 100 : 1 }}
      whileDrag={{ scale: 1.06, rotate: confession.rotation_deg + 2, zIndex: 100 }}
      whileHover={{ scale: 1.02, zIndex: 50 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className="rounded-lg p-3 flex flex-col gap-2 min-h-[110px]"
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-void/20 flex items-center justify-center"
        style={{ background: PIN_COLOR_MAP[noteColor] }}>
        <Pin size={8} className="text-void/60 -rotate-45" />
      </div>
      <p className="font-body text-sm leading-relaxed text-void/90 break-words">{confession.content}</p>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[9px] font-mono text-void/50">anonim</span>
        <div className="flex items-center gap-1">
          {isSaving && <Loader2 size={9} className="text-void/40 animate-spin" />}
          {saveFailed && !isSaving && <span className="text-[8px] text-void/40">⚠</span>}
        </div>
      </div>
    </motion.div>
  );
}

function PostNoteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (note: Confession) => void }) {
  const [color, setColor]         = useState<NoteColor>("yellow");
  const [status, setStatus]       = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg]   = useState("");
  const [charCount, setCharCount] = useState(0);

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const result = await postConfessionAction(formData);
      if (result?.error) { setErrorMsg(result.error); setStatus("error"); }
      else {
        setStatus("success");
        if (result.data) {
          onSuccess({
            id: result.data.id,
            content: formData.get("content") as string,
            color, x_pos: Math.random() * 500 + 40,
            y_pos: Math.random() * 350 + 40,
            rotation_deg: (Math.random() - 0.5) * 8,
            created_at: new Date().toISOString(),
          });
        }
        setTimeout(onClose, 1400);
      }
    } catch {
      setErrorMsg("Waduh, gagal posting. Coba sekali lagi?");
      setStatus("error");
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-void/90 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="card-glass w-full sm:max-w-sm p-5 rounded-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg text-ink">Tempel Note</h3>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={18} /></button>
        </div>
        {status === "success" ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
            <p className="text-3xl mb-2">📌</p>
            <p className="font-display text-lg text-gold">Note ditempel!</p>
            <p className="font-body text-sm text-muted mt-1">Muncul di board sekarang.</p>
          </motion.div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="color" value={color} />
            <div>
              <label className="block font-mono text-[11px] text-muted mb-1.5 tracking-wide">PASSCODE KELAS *</label>
              <input name="passcode" type="password" placeholder="Yang tau cuma kita-kita aja" required className="input-dark" />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-1.5 tracking-wide">PILIH WARNA</label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setColor(opt.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === opt.value ? "border-ink scale-110 shadow-md" : "border-transparent scale-100 hover:scale-105"}`}
                    style={{ background: opt.preview }} title={opt.label} />
                ))}
              </div>
            </div>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-1.5 tracking-wide">
                TULIS SESUATU *{" "}<span className={charCount > 270 ? "text-coral" : "text-muted"}>({charCount}/300)</span>
              </label>
              <textarea name="content" required maxLength={300} rows={4}
                placeholder="Rahasia, roast, hal yang lo mau bilang tapi ga pernah sempat..."
                onChange={(e) => setCharCount(e.target.value.length)} className="input-dark resize-none" />
            </div>
            {errorMsg && <p className="text-coral text-sm bg-coral/10 rounded-lg px-3 py-2">{errorMsg}</p>}
            <button type="submit" disabled={status === "loading"} className="btn-gold justify-center disabled:opacity-60">
              {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Pin size={14} />}
              {status === "loading" ? "Lagi nempel..." : "Tempel ke Board"}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

function RealtimeStatus({ connected }: { connected: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 font-mono text-[10px] transition-colors duration-500 ${connected ? "text-muted" : "text-coral/70"}`}>
      {connected
        ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span>live</span></>
        : <span>offline</span>}
    </div>
  );
}

export default function ConfessionBoard({ initialConfessions }: { initialConfessions: Confession[] }) {
  const boardRef                    = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal]   = useState(false);
  const [confessions, setConfessions] = useState<Confession[]>(initialConfessions);
  const [realtimeOk, setRealtimeOk] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase.channel("confessions-board-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confessions" },
        (payload) => {
          setConfessions((prev) => {
            if (prev.some((c) => c.id === payload.new.id)) return prev;
            return [payload.new as Confession, ...prev];
          });
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "confessions" },
        (payload) => {
          setConfessions((prev) =>
            prev.map((c) => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        })
      .subscribe((status) => setRealtimeOk(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleNotePosted = useCallback((newNote: Confession) => {
    setConfessions((prev) => {
      if (prev.some((c) => c.id === newNote.id)) return prev;
      return [newNote, ...prev];
    });
  }, []);

  return (
    <>
      <div className="relative">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <RealtimeStatus connected={realtimeOk} />
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)} className="btn-gold">
            <Plus size={16} /> Tempel Note
          </motion.button>
        </div>

        {/* Board — clamp height so it's usable on all screen sizes */}
        <motion.div ref={boardRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="board-bg relative w-full rounded-2xl border border-border overflow-hidden"
          style={{ height: "clamp(380px, 60vw, 700px)" }}>
          <div className="absolute inset-0 opacity-[0.02] bg-repeat pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #f5c842 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

          {confessions.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center pointer-events-none">
              <p className="text-4xl">📌</p>
              <p className="font-display text-xl text-muted">Board masih kosong.</p>
              <p className="font-body text-sm text-muted/60">Jadi yang pertama!</p>
            </div>
          )}

          <AnimatePresence>
            {confessions.map((c) => (
              <DraggableNote key={c.id} confession={c} boardRef={boardRef as React.RefObject<HTMLDivElement>} />
            ))}
          </AnimatePresence>
        </motion.div>

        <p className="mt-3 font-mono text-[11px] text-muted text-right">
          {confessions.length} note{confessions.length !== 1 ? "s" : ""} di board
          {confessions.length > 0 && " — drag buat pindah-pindahin"}
        </p>
      </div>

      <AnimatePresence>
        {showModal && <PostNoteModal onClose={() => setShowModal(false)} onSuccess={handleNotePosted} />}
      </AnimatePresence>
    </>
  );
}
