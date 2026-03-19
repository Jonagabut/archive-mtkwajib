"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, Quote, X } from "lucide-react";
import type { Student } from "@/lib/supabase/database.types";

const PH_CLASS = "https://images.unsplash.com/photo-1529111290557-82f6d5c6cf85?w=400&q=80";
const PH_GRAD  = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80";

// ── Bottom sheet (mobile) ──────────────────────────────────────────
function DetailSheet({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(3,8,15,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden pb-safe"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="relative w-full h-52 overflow-hidden">
          <Image src={student.photo_grad_url || PH_GRAD} alt={student.name} fill
            className="object-cover object-top" />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, var(--card) 10%, transparent 60%)" }} />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(3,8,15,0.65)", color: "var(--soft)" }}>
            <X size={14} />
          </button>
        </div>
        <div className="px-5 pb-8 flex flex-col gap-3">
          <div>
            <h3 className="font-display text-2xl" style={{ color: "var(--ink)", fontStyle: "italic" }}>
              {student.name}
            </h3>
            {student.custom_title && (
              <span className="font-mono text-[10px]" style={{ color: "var(--gold)" }}>
                {student.custom_title}
              </span>
            )}
          </div>
          {student.quote && (
            <div className="flex items-start gap-2">
              <Quote size={11} style={{ color: "var(--gold)", marginTop: 3, flexShrink: 0 }} />
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {student.quote}
              </p>
            </div>
          )}
          {student.destination && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} style={{ color: "var(--coral)", flexShrink: 0 }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--coral)" }}>
                {student.destination}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Mobile card — NO 3D transform, plain card ─────────────────────
function MobileCard({ student, index }: { student: Student; index: number }) {
  const [sheet, setSheet] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setSheet(true)}
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{
          border: "1px solid var(--border)",
          background: "var(--card)",
          WebkitTapHighlightColor: "transparent",
        }}>
        {/* photo — aspect ratio 3:4 */}
        <div className="relative w-full" style={{ aspectRatio: "3/4", background: "var(--faint)" }}>
          <Image
            src={student.photo_class_url || PH_CLASS}
            alt={student.name} fill sizes="50vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, var(--card) 0%, rgba(11,22,40,0.4) 40%, transparent 70%)",
          }} />
          {student.class_number && (
            <div className="absolute top-2 left-2 font-mono text-[9px] rounded px-1.5 py-0.5"
              style={{ background: "var(--gold)", color: "#03080f" }}>
              #{student.class_number.toString().padStart(2, "0")}
            </div>
          )}
          <div className="absolute top-2 right-2 font-mono text-[8px] rounded px-1.5 py-0.5"
            style={{ background: "rgba(3,8,15,0.65)", color: "var(--soft)" }}>
            tap
          </div>
        </div>
        {/* info */}
        <div className="p-3">
          <h3 className="font-display text-sm leading-tight truncate"
            style={{ color: "var(--ink)", fontStyle: "italic" }}>
            {student.name}
          </h3>
          {student.custom_title && (
            <p className="font-mono text-[9px] mt-0.5 truncate" style={{ color: "var(--gold)" }}>
              {student.custom_title}
            </p>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {sheet && <DetailSheet student={student} onClose={() => setSheet(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── Desktop card — flip ───────────────────────────────────────────
function DesktopCard({ student, index }: { student: Student; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (index % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flip-card h-[360px] cursor-pointer"
      onClick={() => setFlipped((v) => !v)}>
      <div className={`flip-card-inner ${flipped ? "flipped" : ""}`}>

        {/* Front */}
        <div className="flip-card-front rounded-xl overflow-hidden group"
          style={{ border: "1px solid var(--border)" }}>
          <div className="relative w-full h-[272px] overflow-hidden"
            style={{ background: "var(--faint)" }}>
            <Image src={student.photo_class_url || PH_CLASS} alt={student.name} fill
              sizes="(max-width:1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, var(--card) 0%, transparent 55%)" }} />
            {student.class_number && (
              <div className="absolute top-2 left-2 font-mono text-[9px] rounded px-1.5 py-0.5"
                style={{ background: "var(--gold)", color: "#03080f" }}>
                #{student.class_number.toString().padStart(2, "0")}
              </div>
            )}
            <div className="absolute top-2 right-2 font-mono text-[9px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(3,8,15,0.7)", color: "var(--soft)" }}>
              flip →
            </div>
          </div>
          <div className="p-3" style={{ background: "var(--card)" }}>
            <h3 className="font-display text-base leading-tight truncate"
              style={{ color: "var(--ink)", fontStyle: "italic" }}>
              {student.name}
            </h3>
            <p className="font-mono text-[10px] mt-0.5 truncate" style={{ color: "var(--gold)" }}>
              {student.custom_title}
            </p>
          </div>
        </div>

        {/* Back */}
        <div className="flip-card-back rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(56,178,255,0.2)", background: "var(--card)" }}>
          <div className="relative w-full h-[210px] overflow-hidden" style={{ background: "var(--faint)" }}>
            <Image src={student.photo_grad_url || PH_GRAD} alt={`${student.name} wisuda`} fill
              sizes="33vw" className="object-cover object-top" />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, var(--card), rgba(11,22,40,0.3) 55%, transparent)" }} />
          </div>
          <div className="p-3 flex flex-col gap-2">
            <div>
              <h3 className="font-display text-sm" style={{ color: "var(--ink)", fontStyle: "italic" }}>
                {student.name}
              </h3>
              <span className="font-mono text-[9px]" style={{ color: "var(--gold)" }}>
                {student.custom_title}
              </span>
            </div>
            {student.quote && (
              <div className="flex items-start gap-1.5">
                <Quote size={9} style={{ color: "var(--gold)", marginTop: 2, flexShrink: 0 }} />
                <p className="font-body text-[11px] leading-relaxed line-clamp-3" style={{ color: "var(--muted)" }}>
                  {student.quote}
                </p>
              </div>
            )}
            {student.destination && (
              <div className="flex items-center gap-1 mt-auto">
                <MapPin size={9} style={{ color: "var(--coral)", flexShrink: 0 }} />
                <span className="font-mono text-[9px] truncate" style={{ color: "var(--coral)" }}>
                  {student.destination}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function StudentRoster({ students }: { students: Student[] }) {
  if (!students.length) return (
    <div className="flex flex-col items-center py-16 gap-3 text-center">
      <div className="text-5xl">🎓</div>
      <p className="font-display text-xl" style={{ color: "var(--muted)", fontStyle: "italic" }}>
        Belum ada data warga kelas.
      </p>
    </div>
  );

  const sorted = [...students].sort((a, b) =>
    a.is_featured === b.is_featured ? 0 : a.is_featured ? -1 : 1
  );

  return (
    <>
      {/* Mobile — clean card, no 3D */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto md:hidden">
        {sorted.map((s, i) => <MobileCard key={s.id} student={s} index={i} />)}
      </div>

      {/* Desktop — flip card */}
      <div className="hidden md:grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {sorted.map((s, i) => <DesktopCard key={s.id} student={s} index={i} />)}
      </div>
    </>
  );
}
