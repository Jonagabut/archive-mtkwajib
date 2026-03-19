"use client";
// components/roster/StudentRoster.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, Quote, X } from "lucide-react";
import type { Student } from "@/lib/supabase/database.types";

const PLACEHOLDER_CLASS =
  "https://images.unsplash.com/photo-1529111290557-82f6d5c6cf85?w=400&q=80";
const PLACEHOLDER_GRAD =
  "https://images.unsplash.com/photo-1546961342-ea5f62d5a23b?w=400&q=80";

// ── Student detail modal (mobile) ─────────────────────────────────
// On small screens, the 3D flip effect is hard to trigger and the card
// is too narrow to read the back content comfortably.
// Solution: flip card stays on md+, tap opens a bottom sheet on mobile.
function StudentDetailSheet({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-void/90 backdrop-blur-sm p-0"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg bg-card rounded-t-3xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Grad photo */}
        <div className="relative w-full h-48 bg-faint overflow-hidden">
          <Image
            src={student.photo_grad_url || PLACEHOLDER_GRAD}
            alt={`${student.name} wisuda`}
            fill
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-void/60 text-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col gap-3 pb-8">
          <div>
            <h3 className="font-display text-xl text-ink">{student.name}</h3>
            <span className="font-mono text-[11px] text-gold">{student.custom_title}</span>
          </div>

          {student.quote && (
            <div className="flex items-start gap-2">
              <Quote size={13} className="text-gold mt-0.5 shrink-0" />
              <p className="font-body text-sm text-muted leading-relaxed">
                {student.quote}
              </p>
            </div>
          )}

          {student.destination && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-coral shrink-0" />
              <span className="font-mono text-[11px] text-coral">
                {student.destination}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Student Card ──────────────────────────────────────────────────
function StudentCard({ student, index }: { student: Student; index: number }) {
  const [flipped, setFlipped]           = useState(false);
  const [sheetOpen, setSheetOpen]       = useState(false);

  const handleTap = () => {
    // On mobile (touch), open the detail sheet instead of flipping.
    // The flip card CSS still works on md+.
    // We detect touch capability via a media query check — avoids
    // importing a heavy pointer detection library.
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSheetOpen(true);
    } else {
      setFlipped((v) => !v);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{
          duration: 0.6,
          delay: (index % 8) * 0.07,
          ease: [0.22, 1, 0.36, 1],
        }}
        // On mobile: fixed height removed, card is auto-height (image + name).
        // On md+: fixed height for the flip card perspective to work correctly.
        className="flip-card md:h-[380px] cursor-pointer"
        onClick={handleTap}
      >
        <div className={`flip-card-inner ${flipped ? "flipped" : ""}`}>
          {/* ── Front ── */}
          <div className="flip-card-front rounded-2xl overflow-hidden border border-border group">
            {/* Image — fixed height only on md+ */}
            <div className="relative w-full h-[200px] md:h-[260px] bg-faint overflow-hidden">
              <Image
                src={student.photo_class_url || PLACEHOLDER_CLASS}
                alt={student.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

              {student.class_number && (
                <div className="absolute top-2 left-2 font-mono text-[10px] text-void bg-gold rounded-md px-1.5 py-0.5">
                  #{student.class_number.toString().padStart(2, "0")}
                </div>
              )}

              {/* Flip hint — desktop only */}
              <div className="hidden md:block absolute top-2 right-2 font-mono text-[10px] text-muted bg-void/70 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                tap to flip →
              </div>

              {/* Tap hint — mobile only */}
              <div className="md:hidden absolute top-2 right-2 font-mono text-[10px] text-muted bg-void/70 rounded-md px-1.5 py-0.5">
                tap →
              </div>
            </div>

            <div className="bg-card p-3 md:p-4">
              <h3 className="font-display text-sm md:text-lg text-ink leading-tight truncate">
                {student.name}
              </h3>
              <p className="font-mono text-[10px] md:text-[11px] text-gold mt-0.5 md:mt-1 truncate">
                {student.custom_title}
              </p>
            </div>
          </div>

          {/* ── Back (desktop only, mobile uses sheet) ── */}
          <div className="flip-card-back rounded-2xl overflow-hidden border border-gold/30 bg-card">
            <div className="relative w-full h-[180px] bg-faint overflow-hidden">
              <Image
                src={student.photo_grad_url || PLACEHOLDER_GRAD}
                alt={`${student.name} wisuda`}
                fill
                sizes="(max-width: 1024px) 33vw, 20vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div>
                <h3 className="font-display text-base text-ink leading-tight">
                  {student.name}
                </h3>
                <span className="font-mono text-[10px] text-gold">
                  {student.custom_title}
                </span>
              </div>

              {student.quote && (
                <div className="flex items-start gap-2">
                  <Quote size={12} className="text-gold mt-0.5 shrink-0" />
                  <p className="font-body text-xs text-muted leading-relaxed line-clamp-3">
                    {student.quote}
                  </p>
                </div>
              )}

              {student.destination && (
                <div className="flex items-center gap-1.5 mt-auto">
                  <MapPin size={11} className="text-coral shrink-0" />
                  <span className="font-mono text-[10px] text-coral truncate">
                    {student.destination}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <StudentDetailSheet
            student={student}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────
function EmptyRoster() {
  return (
    <div className="col-span-full flex flex-col items-center py-20 gap-4 text-center">
      <div className="text-5xl">🎓</div>
      <p className="font-display text-xl text-muted">Belum ada data warga kelas.</p>
      <p className="font-body text-sm text-muted/60">
        Tambahkan data siswa via Supabase dashboard.
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function StudentRoster({ students }: { students: Student[] }) {
  if (students.length === 0) return <EmptyRoster />;

  const sorted = [...students].sort((a, b) =>
    a.is_featured === b.is_featured ? 0 : a.is_featured ? -1 : 1
  );

  return (
    // 2 cols on mobile → 3 on sm → 4 on md → 5 on lg
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
      {sorted.map((student, i) => (
        <StudentCard key={student.id} student={student} index={i} />
      ))}
    </div>
  );
}
