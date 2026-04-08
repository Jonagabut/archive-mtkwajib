"use client";
// components/board/ConfessionBoard.tsx
// SENIOR DEV REVIEW:
// 1. Fixed drag snap bug using useMotionValue (Bug 1)
// 2. Replaced hard reload with router.refresh() (Bug 2)
// 3. Added Realtime updates for both INSERT and UPDATE (Bug 7)
// 4. Added "Human-touch" microcopy and UI refinements

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Plus, X, Loader2, MessageSquare, Clock, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Confession, NoteColor } from "@/lib/supabase/database.types";
import { updateConfessionPositionAction, reactToConfessionAction } from "@/app/actions/confessions";

const ACCENTS: Record<NoteColor, { border: string; dot: string; label: string; shadow: string; heart: string }> = {
  yellow:   { border: "rgba(56,178,255,0.5)",  dot: "#38b2ff", label: "Biru",  shadow: "rgba(56,178,255,0.25)", heart: "#38b2ff" },
  pink:     { border: "rgba(255,95,126,0.5)",  dot: "#ff5f7e", label: "Pink",  shadow: "rgba(255,95,126,0.25)", heart: "#ff5f7e" },
  lavender: { border: "rgba(77,207,176,0.5)",  dot: "#4dcfb0", label: "Tosca", shadow: "rgba(77,207,176,0.25)", heart: "#4dcfb0" },
};

const COLOR_OPTS: NoteColor[] = ["yellow", "pink", "lavender"];

// ── Time helpers ──────────────────────────────────────────────────
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const secs  = Math.floor(diff / 1000);
  const mins  = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);

  if (secs  <  60) return "baru saja";
  if (mins  <  60) return `${mins}m lalu`;
  if (hours <  24) return `${hours}j lalu`;
  if (days  <   7) return `${days}h lalu`;
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "numeric", month: "short",
  });
}

function formatAbsoluteTime(isoString: string): string {
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Floating Heart Animation ──────────────────────────────────────
function FloatingHeart({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5, x: 0 }}
      animate={{ opacity: 0, y: -80, scale: 2, x: (Math.random() - 0.5) * 40 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 100 }}
    >
      <Heart size={20} fill={color} style={{ color }} />
    </motion.div>
  );
}

// ── Individual note card ──────────────────────────────────────────
function NoteCard({ note, constraintsRef, isMobile }: { 
  note: Confession; 
  constraintsRef: React.RefObject<HTMLDivElement>;
  isMobile: boolean;
}) {
  const [showAbsTime, setShowAbsTime] = useState(false);
  const [isUpdating, setIsUpdating]   = useState(false);
  const [hearts, setHearts]           = useState<{ id: number }[]>([]);
  
  const x = useMotionValue(note.x_pos);
  const y = useMotionValue(note.y_pos);

  const color  = (note.color as NoteColor) || "yellow";
  const accent = ACCENTS[color];

  // Scale down on mobile for better fit
  const scaleValue = isMobile ? 0.84 : 1;

  const handleDragEnd = async () => {
    const currentX = x.get();
    const currentY = y.get();
    if (Math.abs(currentX - note.x_pos) > 5 || Math.abs(currentY - note.y_pos) > 5) {
      setIsUpdating(true);
      try { await updateConfessionPositionAction(note.id, currentX, currentY); }
      catch (err) { console.error(err); }
      finally { setIsUpdating(false); }
    }
  };

  const handleReact = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Local animation
    setHearts((prev) => [...prev, { id: Date.now() }]);
    setTimeout(() => setHearts((prev) => prev.slice(1)), 1000);

    try {
      await reactToConfessionAction(note.id);
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  useEffect(() => {
    x.set(note.x_pos);
    y.set(note.y_pos);
  }, [note.x_pos, note.y_pos, x, y]);

  // Show floating hearts when likes_count changes (from Realtime)
  const prevLikes = useRef((note as any).likes_count || 0);
  useEffect(() => {
    const currentLikes = (note as any).likes_count || 0;
    if (currentLikes > prevLikes.current) {
      setHearts((prev) => [...prev, { id: Date.now() }]);
      setTimeout(() => setHearts((prev) => prev.slice(1)), 1000);
    }
    prevLikes.current = currentLikes;
  }, [(note as any).likes_count]);

  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      style={{ x, y, left: 0, top: 0, position: "absolute", rotate: note.rotation_deg, scale: scaleValue }}
      whileDrag={{ 
        scale: scaleValue * 1.05, 
        zIndex: 40, 
        boxShadow: `0 20px 40px ${accent.shadow}`,
        cursor: "grabbing" 
      }}
      className="flex flex-col gap-2.5 rounded-xl p-3.5 w-[210px] sm:w-[230px] cursor-grab active:cursor-grabbing select-none"
      initial={{ opacity: 0, scale: scaleValue * 0.8 }}
      animate={{ opacity: 1, scale: scaleValue }}
      exit={{ opacity: 0, scale: scaleValue * 0.8 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div 
        className="absolute inset-0 rounded-xl -z-10"
        style={{ 
          background: "var(--card)", 
          border: "1px solid var(--border)",
          borderLeft: `4px solid ${accent.border}`,
          boxShadow: isUpdating ? `0 0 15px ${accent.shadow}` : "none"
        }} 
      />

      {/* Floating hearts container */}
      <AnimatePresence>
        {hearts.map((h) => (
          <FloatingHeart key={h.id} x={100} y={0} color={accent.heart} />
        ))}
      </AnimatePresence>
      
      <div className="flex items-start justify-between gap-2">
        <p className="font-body text-sm leading-relaxed flex-1"
          style={{ color: "var(--ink)", fontSize: 13, lineHeight: 1.58 }}>
          {note.content}
        </p>
        <button 
          onClick={handleReact}
          className="group relative flex flex-col items-center gap-1 mt-1 transition-transform active:scale-125"
          style={{ color: (note as any).likes_count > 0 ? accent.heart : "var(--muted)" }}
        >
          <Heart 
            size={16} 
            fill={(note as any).likes_count > 0 ? accent.heart : "transparent"} 
            className="group-hover:scale-110 transition-transform" 
          />
          {(note as any).likes_count > 0 && (
            <span className="font-mono text-[8px] font-bold">{(note as any).likes_count}</span>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
          anonim
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowAbsTime((v) => !v); }}
          className="flex items-center gap-1 transition-opacity"
          style={{ opacity: 0.65 }}>
          <Clock size={8} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
            {showAbsTime
              ? formatAbsoluteTime(note.created_at)
              : formatRelativeTime(note.created_at)}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function ConfessionBoard({ initialConfessions }: { initialConfessions: Confession[] }) {
  const [notes, setNotes]           = useState<Confession[]>(initialConfessions);
  const [showModal, setShowModal]   = useState(false);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [isMobile, setIsMobile]     = useState(false);
  const containerRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const sb = createClient();
    const channel = sb.channel("board-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confessions" }, (p) => {
        setNotes((prev) => prev.some((n) => n.id === (p.new as Confession).id) ? prev : [p.new as Confession, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "confessions" }, (p) => {
        setNotes((prev) => prev.map((n) => n.id === (p.new as Confession).id ? (p.new as Confession) : n));
      })
      .subscribe((s) => setRealtimeOk(s === "SUBSCRIBED"));
    return () => { sb.removeChannel(channel); };
  }, []);

  return (
    <div className="flex flex-col h-full min-h-[600px] sm:min-h-[700px]">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4 px-2">
        <div className="flex items-center gap-4">
          <LiveIndicator on={realtimeOk} />
          <div className="flex flex-col">
            <p className="font-mono text-[10px] uppercase tracking-widest leading-none" style={{ color: "var(--muted)" }}>
              {notes.length} notes
            </p>
            <p className="font-mono text-[8px] text-muted opacity-60 mt-1">DRAG TO REARRANGE</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold px-6 group">
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> 
          Tempel Note
        </button>
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 rounded-3xl overflow-hidden border-2 border-dashed touch-pan-x touch-pan-y"
        style={{ 
          background: "rgba(7,14,28,0.25)", 
          borderColor: "var(--border)",
          minHeight: 550
        }}
      >
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

        <AnimatePresence>
          {notes.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare size={48} className="mb-4" style={{ color: "var(--border)" }} />
              <p className="font-display text-2xl font-italic" style={{ color: "var(--muted)" }}>Board masih sepi...</p>
            </motion.div>
          ) : (
            notes.map((n) => (
              <NoteCard key={n.id} note={n} constraintsRef={containerRef} isMobile={isMobile} />
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && <PostModal onClose={() => setShowModal(false)} onPosted={(n) => setNotes((v) => [n, ...v])} />}
      </AnimatePresence>
    </div>
  );
}

// ── Post modal ────────────────────────────────────────────────────
function PostModal({ onClose, onPosted }: {
  onClose: () => void;
  onPosted: (note: Confession) => void;
}) {
  const router                = useRouter();
  const [color, setColor]     = useState<NoteColor>("yellow");
  const [content, setContent] = useState("");
  const [passcode, setPasscode] = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setStatus("loading"); setErrMsg("");
    
    try {
      const sb = createClient();
      const { data, error } = await (sb.from("confessions") as any)
        .insert({ 
          content: trimmed, 
          color, 
          x_pos: Math.random() * 400 + 40,
          y_pos: Math.random() * 300 + 40,
          rotation_deg: (Math.random() - 0.5) * 12
        })
        .select()
        .single();

      if (error) throw error;
      
      onPosted(data as Confession);
      setStatus("success");
      
      router.refresh(); 
      setTimeout(onClose, 1100);
    } catch (err: any) {
      setErrMsg("Waduh, gagal posting. Coba lagi?");
      setStatus("error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(3,8,15,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="card-glass w-full sm:max-w-sm rounded-3xl sm:rounded-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}>

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-xl" style={{ color: "var(--ink)", fontStyle: "italic" }}>
                Tempel Note Baru
              </h3>
              <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>
                anonim · tidak bisa dihapus
              </p>
            </div>
            <button onClick={onClose} style={{ color: "var(--muted)" }}>
              <X size={20} />
            </button>
          </div>

          {status === "success" ? (
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8">
              <MessageSquare size={36} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
              <p className="font-display text-2xl" style={{ color: "var(--gold)", fontStyle: "italic" }}>
                Tertempel!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block font-mono text-[10px] mb-2 tracking-wide" style={{ color: "var(--muted)" }}>
                  PILIH WARNA
                </label>
                <div className="flex items-center gap-3">
                  {COLOR_OPTS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className="transition-all duration-200"
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: ACCENTS[c].dot,
                        border: color === c ? "2px solid var(--ink)" : "2px solid transparent",
                        transform: color === c ? "scale(1.15)" : "scale(1)",
                        boxShadow: color === c ? `0 0 15px ${ACCENTS[c].shadow}` : "none"
                      }} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] mb-2 tracking-wide" style={{ color: "var(--muted)" }}>
                  TULIS PESAN *
                </label>
                <textarea
                  value={content} onChange={(e) => setContent(e.target.value)}
                  required maxLength={300} rows={4}
                  placeholder="Rahasia, roast, atau apapun..."
                  className="input-void resize-none text-sm" />
              </div>

              {errMsg && (
                <p className="text-xs rounded-xl px-3 py-2.5"
                  style={{ color: "var(--coral)", background: "rgba(255,95,126,0.1)" }}>
                  {errMsg}
                </p>
              )}

              <button type="submit"
                disabled={status === "loading" || !content.trim()}
                className="btn-gold justify-center w-full py-3 disabled:opacity-50">
                {status === "loading"
                  ? <><Loader2 size={16} className="animate-spin" /> Lagi nempel...</>
                  : <><MessageSquare size={16} /> Tempel ke Board</>
                }
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function LiveIndicator({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-faint" style={{ borderColor: on ? "var(--border)" : "red" }}>
      <div className={`w-1.5 h-1.5 rounded-full ${on ? "animate-pulse" : ""}`} style={{ background: on ? "var(--sage)" : "red" }} />
      <span className="font-mono text-[9px] tracking-wider uppercase" style={{ color: on ? "var(--soft)" : "red" }}>{on ? "live" : "offline"}</span>
    </div>
  );
}

// Re-implement simplified PostModal briefly for context or just leave as is if only updating the main export
// (Actually I'll keep the multi_replace flow but for now let's use the replace_file_content for the whole thing to be safe)

