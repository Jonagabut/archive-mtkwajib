"use client";
// components/board/ConfessionBoard.tsx
// VOID design: scrollable grid, 3 cols desktop / 2 cols tablet / 1 col mobile
// No password, no dragging — just post and scroll.
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, MessageSquare } from "lucide-react";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Confession, NoteColor } from "@/lib/supabase/database.types";

// Color palette for the cards
const ACCENTS: Record<NoteColor, { border: string; dot: string; label: string }> = {
  yellow:   { border: "rgba(56,178,255,0.5)",  dot: "#38b2ff", label: "Biru"     },
  pink:     { border: "rgba(255,95,126,0.5)",  dot: "#ff5f7e", label: "Pink"     },
  lavender: { border: "rgba(77,207,176,0.5)",  dot: "#4dcfb0", label: "Tosca"    },
};

const COLOR_OPTS: NoteColor[] = ["yellow", "pink", "lavender"];

// Post directly via anon Supabase client (no server action, no passcode)
function usePostNote() {
  const post = async (content: string, color: NoteColor) => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const x_pos        = Math.random() * 600 + 40;
    const y_pos        = Math.random() * 400 + 40;
    const rotation_deg = (Math.random() - 0.5) * 10;
    const { data, error } = await sb
      .from("confessions")
      .insert({ content, color, x_pos, y_pos, rotation_deg })
      .select("id, content, color, x_pos, y_pos, rotation_deg, created_at")
      .single();
    if (error) throw error;
    return data as Confession;
  };
  return { post };
}

// Individual note card
function NoteCard({ note, index }: { note: Confession; index: number }) {
  const color = (note.color as NoteColor) || "yellow";
  const accent = ACCENTS[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index < 12 ? index * 0.03 : 0, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-2.5 rounded-xl p-3.5"
      style={{
        background: "var(--card)",
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${accent.border}`,
        minHeight: 88,
      }}>
      {/* dot accent top right */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-body text-sm leading-relaxed flex-1"
          style={{ color: "var(--ink)", fontSize: 13, lineHeight: 1.55 }}>
          {note.content}
        </p>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
          style={{ background: accent.dot, opacity: 0.7 }} />
      </div>
      <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
        anonim
      </span>
    </motion.div>
  );
}

// Post modal
function PostModal({ onClose, onPosted }: {
  onClose: () => void;
  onPosted: (note: Confession) => void;
}) {
  const { post }                    = usePostNote();
  const [color, setColor]           = useState<NoteColor>("yellow");
  const [content, setContent]       = useState("");
  const [status, setStatus]         = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setStatus("loading"); setErrMsg("");
    try {
      const note = await post(trimmed, color);
      onPosted(note);
      setStatus("success");
      setTimeout(onClose, 1100);
    } catch {
      setErrMsg("Gagal posting. Coba lagi?");
      setStatus("error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(3,8,15,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="card-glass w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}>

        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg" style={{ color: "var(--ink)", fontStyle: "italic" }}>
                Tulis Note
              </h3>
              <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>
                anonim · tidak bisa dihapus
              </p>
            </div>
            <button onClick={onClose} style={{ color: "var(--muted)" }}>
              <X size={18} />
            </button>
          </div>

          {status === "success" ? (
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6">
              <MessageSquare size={32} className="mx-auto mb-3" style={{ color: "var(--gold)" }} />
              <p className="font-display text-xl" style={{ color: "var(--gold)", fontStyle: "italic" }}>
                Tertempel!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Color picker */}
              <div className="flex items-center gap-3">
                {COLOR_OPTS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="transition-all duration-150"
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: ACCENTS[c].dot,
                      border: color === c ? "2px solid var(--ink)" : "2px solid transparent",
                      transform: color === c ? "scale(1.2)" : "scale(1)",
                    }}
                    title={ACCENTS[c].label} />
                ))}
                <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>warna aksen</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[11px] tracking-wide" style={{ color: "var(--muted)" }}>
                    TULIS SESUATU *
                  </label>
                  <span className="font-mono text-[10px]"
                    style={{ color: content.length > 270 ? "var(--coral)" : "var(--muted)" }}>
                    {content.length}/300
                  </span>
                </div>
                <textarea
                  value={content} onChange={(e) => setContent(e.target.value)}
                  required maxLength={300} rows={4}
                  placeholder="Rahasia, roast, hal yang pengen lo sampaikan..."
                  className="input-void resize-none" />
              </div>

              {errMsg && (
                <p className="text-sm rounded-xl px-3 py-2"
                  style={{ color: "var(--coral)", background: "rgba(255,95,126,0.1)" }}>
                  {errMsg}
                </p>
              )}

              <button type="submit"
                disabled={status === "loading" || !content.trim()}
                className="btn-gold justify-center w-full disabled:opacity-50">
                {status === "loading"
                  ? <><Loader2 size={14} className="animate-spin" /> Nempel...</>
                  : <><MessageSquare size={14} /> Tempel ke Board</>
                }
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Live indicator
function LiveDot({ on }: { on: boolean }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px]"
      style={{ color: on ? "var(--muted)" : "rgba(74,106,144,0.4)" }}>
      {on && <span className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: "var(--sage)" }} />}
      <span>{on ? "live" : "–"}</span>
    </div>
  );
}

// Main
export default function ConfessionBoard({ initialConfessions }: { initialConfessions: Confession[] }) {
  const [notes, setNotes]           = useState<Confession[]>(initialConfessions);
  const [showModal, setShowModal]   = useState(false);
  const [realtimeOk, setRealtimeOk] = useState(false);

  useEffect(() => {
    const sb      = createClient();
    const channel = sb.channel("board-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confessions" }, (p) => {
        setNotes((prev) => {
          if (prev.some((n) => n.id === (p.new as Confession).id)) return prev;
          return [p.new as Confession, ...prev];
        });
      })
      .subscribe((s) => setRealtimeOk(s === "SUBSCRIBED"));
    return () => { sb.removeChannel(channel); };
  }, []);

  const handlePosted = useCallback((note: Confession) => {
    setNotes((prev) => prev.some((n) => n.id === note.id) ? prev : [note, ...prev]);
  }, []);

  return (
    <>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <LiveDot on={realtimeOk} />
          <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold py-2 px-4 text-xs">
          <Plus size={13} /> Tempel Note
        </button>
      </div>

      {/* Scrollable grid */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <MessageSquare size={36} style={{ color: "rgba(74,106,144,0.3)" }} />
          <p className="font-display text-xl" style={{ color: "var(--muted)", fontStyle: "italic" }}>
            Board masih kosong.
          </p>
          <p className="font-mono text-[11px]" style={{ color: "var(--muted)", opacity: 0.6 }}>
            Jadi yang pertama!
          </p>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
          }}>
          {notes.map((n, i) => (
            <NoteCard key={n.id} note={n} index={i} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <PostModal onClose={() => setShowModal(false)} onPosted={handlePosted} />
        )}
      </AnimatePresence>
    </>
  );
}
