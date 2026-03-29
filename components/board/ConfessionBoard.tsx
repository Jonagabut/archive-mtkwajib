"use client";
// components/board/ConfessionBoard.tsx
// FIX: hapus createBrowserClient duplikat — pakai shared createClient() dari project
// FIX: hapus dead code (postConfessionAction, updateConfessionPositionAction tidak pernah dipanggil)
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, MessageSquare, ArrowUpDown, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Confession, NoteColor } from "@/lib/supabase/database.types";

const ACCENTS: Record<NoteColor, { border: string; dot: string; label: string }> = {
  yellow:   { border: "rgba(56,178,255,0.5)",  dot: "#38b2ff", label: "Biru"  },
  pink:     { border: "rgba(255,95,126,0.5)",  dot: "#ff5f7e", label: "Pink"  },
  lavender: { border: "rgba(77,207,176,0.5)",  dot: "#4dcfb0", label: "Tosca" },
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

// ── Post via shared project Supabase client ───────────────────────
// FIX: was creating a raw `new createBrowserClient(url, key)` on every call.
// Now reuses the shared singleton client from @/lib/supabase/client.
function usePostNote() {
  const post = async (content: string, color: NoteColor) => {
    const sb           = createClient(); // ✅ shared client, no memory leak
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

// ── Individual note card ──────────────────────────────────────────
function NoteCard({ note, index }: { note: Confession; index: number }) {
  const [showAbsTime, setShowAbsTime] = useState(false);
  const color  = (note.color as NoteColor) || "yellow";
  const accent = ACCENTS[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index < 12 ? index * 0.03 : 0, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-2.5 rounded-xl p-3.5"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${accent.border}`,
        minHeight: 88,
      }}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-body text-sm leading-relaxed flex-1"
          style={{ color: "var(--ink)", fontSize: 13, lineHeight: 1.55 }}>
          {note.content}
        </p>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
          style={{ background: accent.dot, opacity: 0.7 }} />
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="font-mono text-[9px]" style={{ color: "var(--muted)" }}>
          anonim
        </span>
        <button
          onClick={() => setShowAbsTime((v) => !v)}
          title={showAbsTime ? formatRelativeTime(note.created_at) : formatAbsoluteTime(note.created_at)}
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

// ── Post modal ────────────────────────────────────────────────────
function PostModal({ onClose, onPosted }: {
  onClose: () => void;
  onPosted: (note: Confession) => void;
}) {
  const router                = useRouter();
  const { post }              = usePostNote();
  const [color, setColor]     = useState<NoteColor>("yellow");
  const [content, setContent] = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setStatus("loading"); setErrMsg("");
    try {
      const note = await post(trimmed, color);
      onPosted(note);          // optimistic: langsung tampil di UI
      setStatus("success");
      router.refresh();        // invalidate Next.js cache biar server data fresh
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

// ── Live indicator ────────────────────────────────────────────────
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

// ── Sort toggle ───────────────────────────────────────────────────
type SortOrder = "newest" | "oldest";

function SortToggle({ order, onChange }: { order: SortOrder; onChange: (o: SortOrder) => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={() => onChange(order === "newest" ? "oldest" : "newest")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200"
      style={{ background: "var(--faint)", borderColor: "var(--border)", color: "var(--muted)" }}>
      <ArrowUpDown size={10} />
      <span className="font-mono text-[9px] tracking-wide">
        {order === "newest" ? "Terbaru" : "Terlama"}
      </span>
    </motion.button>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function ConfessionBoard({ initialConfessions }: { initialConfessions: Confession[] }) {
  const [notes, setNotes]           = useState<Confession[]>(initialConfessions);
  const [showModal, setShowModal]   = useState(false);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [sortOrder, setSortOrder]   = useState<SortOrder>("newest");

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

  const sortedNotes = [...notes].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortOrder === "newest" ? -diff : diff;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <LiveDot on={realtimeOk} />
          <span className="font-mono text-[10px]" style={{ color: "var(--muted)" }}>
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </span>
          {notes.length > 1 && (
            <SortToggle order={sortOrder} onChange={setSortOrder} />
          )}
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold py-2 px-4 text-xs">
          <Plus size={13} /> Tempel Note
        </button>
      </div>

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
        <div className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))" }}>
          <AnimatePresence mode="popLayout">
            {sortedNotes.map((n, i) => (
              <NoteCard key={n.id} note={n} index={i} />
            ))}
          </AnimatePresence>
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
