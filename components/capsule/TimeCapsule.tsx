"use client";
// components/capsule/TimeCapsule.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Send, Loader2, Clock } from "lucide-react";
import { submitCapsuleAction } from "@/app/actions/capsule";

const UNLOCK_DATE = new Date(
  process.env.NEXT_PUBLIC_CAPSULE_UNLOCK_DATE ?? "2031-07-01T00:00:00.000Z"
);

// ────────────────────────────────────────────
// COUNTDOWN HOOK
// ────────────────────────────────────────────
interface TimeLeft {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(target: Date): TimeLeft {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculate() {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const years = Math.floor(totalDays / 365);
      const days = totalDays % 365;

      return { years, days, hours, minutes, seconds };
    }

    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [target]);

  return timeLeft;
}

// ────────────────────────────────────────────
// COUNTDOWN SEGMENT
// ────────────────────────────────────────────
function Segment({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      key={value}
      initial={{ y: -6, opacity: 0.5 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="countdown-segment"
    >
      <span className="font-display text-4xl md:text-5xl text-gold font-bold leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-mono text-[9px] text-muted mt-1 tracking-widest uppercase">
        {label}
      </span>
    </motion.div>
  );
}

// ────────────────────────────────────────────
// SUBMIT FORM
// ────────────────────────────────────────────
function CapsuleForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const result = await submitCapsuleAction(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Gagal mengirim. Coba lagi.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4 py-12 text-center"
      >
        <motion.div
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-5xl"
        >
          🔐
        </motion.div>
        <p className="font-display text-2xl text-gold">Pesan Terkunci!</p>
        <p className="font-body text-sm text-muted max-w-xs">
          Pesan kamu tersegel sampai{" "}
          <span className="text-ink font-semibold">1 Juli 2031</span>. See you
          there. 🚀
        </p>
      </motion.div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 w-full max-w-lg mx-auto">
      <div>
        <label className="block font-mono text-[11px] text-muted mb-1.5">
          PASSCODE KELAS *
        </label>
        <input
          name="passcode"
          type="password"
          placeholder="Masukkan passcode"
          required
          className="input-dark"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] text-muted mb-1.5">
          NAMA LO (opsional)
        </label>
        <input
          name="authorName"
          type="text"
          placeholder="Biar lo kenal tulisan lo sendiri nanti"
          maxLength={80}
          className="input-dark"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] text-muted mb-1.5">
          PESAN KE DIRI LO DI 2031 *{" "}
          <span className={charCount > 900 ? "text-coral" : "text-muted"}>
            ({charCount}/1000)
          </span>
        </label>
        <textarea
          name="content"
          required
          maxLength={1000}
          rows={5}
          placeholder="Dear me at 25... Semoga lo udah jadi orang yang lo harapin. Semoga lo masih inget nama-nama orang yang ada di kelas ini..."
          onChange={(e) => setCharCount(e.target.value.length)}
          className="input-dark resize-none"
        />
        <p className="mt-1 font-mono text-[10px] text-muted/50">
          Akan dibuka pada 1 Juli 2031 — Reuni 5 Tahun 🎓
        </p>
      </div>

      {errorMsg && (
        <p className="text-coral text-sm bg-coral/10 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-gold justify-center disabled:opacity-60"
      >
        {status === "loading" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Lock size={14} />
        )}
        {status === "loading" ? "Mengunci pesan..." : "Kunci Pesan Sampai 2031"}
      </button>
    </form>
  );
}

// ────────────────────────────────────────────
// MAIN TIME CAPSULE COMPONENT
// ────────────────────────────────────────────
export default function TimeCapsule() {
  const timeLeft = useCountdown(UNLOCK_DATE);
  const isUnlocked = UNLOCK_DATE.getTime() <= Date.now();

  return (
    <div className="container mx-auto px-4 md:px-8">
      {/* ── Background orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/3 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-lavender/5 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-14"
        >
          <p className="section-label mb-3">2026 → 2031</p>
          <h2 className="section-title">
            Time <span className="text-gold">Capsule</span>
          </h2>
          <p className="mt-4 text-muted max-w-md mx-auto font-body text-sm">
            Tulis pesan buat diri lo di masa depan. Tersegel sampai reuni 5
            tahun—1 Juli 2031.
          </p>
        </motion.div>

        {/* ── Countdown Timer ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-14 w-full"
        >
          {isUnlocked ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="text-5xl">🎉</span>
              <p className="font-display text-3xl text-gold">
                The capsule is open!
              </p>
              <p className="text-muted font-body text-sm">
                Baca semua pesan yang tersimpan selama ini.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock size={14} className="text-muted" />
                <span className="font-mono text-[11px] text-muted tracking-widest">
                  MEMBUKA DALAM
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Segment value={timeLeft.years} label="tahun" />
                <span className="font-display text-3xl text-muted pb-4">:</span>
                <Segment value={timeLeft.days} label="hari" />
                <span className="font-display text-3xl text-muted pb-4">:</span>
                <Segment value={timeLeft.hours} label="jam" />
                <span className="font-display text-3xl text-muted pb-4">:</span>
                <Segment value={timeLeft.minutes} label="menit" />
                <span className="font-display text-3xl text-muted pb-4">:</span>
                <Segment value={timeLeft.seconds} label="detik" />
              </div>
              <p className="mt-4 font-mono text-[10px] text-muted">
                Target: 1 Juli 2031, 00:00 UTC
              </p>
            </>
          )}
        </motion.div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4 w-full max-w-lg mb-10">
          <div className="flex-1 h-px bg-border" />
          <span className="font-mono text-[10px] text-muted tracking-widest">KIRIM PESAN</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full"
        >
          <CapsuleForm />
        </motion.div>

        {/* ── Decorative vault graphic ── */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mt-16 opacity-10 font-display text-[120px] leading-none select-none"
          aria-hidden
        >
          🔒
        </motion.div>
      </div>
    </div>
  );
}
