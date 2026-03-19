"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, Quote, X } from "lucide-react";
import type { Student } from "@/lib/supabase/database.types";

const PH_CLASS = "https://images.unsplash.com/photo-1529111290557-82f6d5c6cf85?w=400&q=80";
const PH_GRAD  = "https://images.unsplash.com/photo-1546961342-ea5f62d5a23b?w=400&q=80";

// Mobile bottom sheet
function DetailSheet({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-void/90 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ type:"spring", stiffness:320, damping:32 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden pb-safe"
        style={{ background:"var(--c-card)", border:"1px solid var(--c-border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full" style={{ background:"var(--c-border)" }} /></div>
        <div className="relative w-full h-44 overflow-hidden">
          <Image src={student.photo_grad_url || PH_GRAD} alt={student.name} fill className="object-cover object-top" />
          <div className="absolute inset-0" style={{ background:"linear-gradient(to top, var(--c-card), transparent)" }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background:"rgba(0,0,0,0.5)", color:"var(--c-muted)" }}><X size={14} /></button>
        </div>
        <div className="p-5 flex flex-col gap-3 pb-6">
          <div>
            <h3 className="font-display text-xl font-bold" style={{ color:"var(--c-ink)" }}>{student.name}</h3>
            <span className="font-mono text-[10px]" style={{ color:"var(--c-gold)" }}>{student.custom_title}</span>
          </div>
          {student.quote && (
            <div className="flex items-start gap-2">
              <Quote size={12} style={{ color:"var(--c-gold)", marginTop:2, flexShrink:0 }} />
              <p className="font-body text-sm leading-relaxed" style={{ color:"var(--c-muted)" }}>{student.quote}</p>
            </div>
          )}
          {student.destination && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} style={{ color:"var(--c-coral)", flexShrink:0 }} />
              <span className="font-mono text-[10px]" style={{ color:"var(--c-coral)" }}>{student.destination}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StudentCard({ student, index }: { student: Student; index: number }) {
  const [flipped, setFlipped]   = useState(false);
  const [sheet, setSheet]       = useState(false);

  const handleTap = () => {
    if (window.matchMedia("(max-width:767px)").matches) setSheet(true);
    else setFlipped((v) => !v);
  };

  return (
    <>
      <motion.div
        initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true, margin:"-40px" }}
        transition={{ duration:0.55, delay:(index%8)*0.065, ease:[0.22,1,0.36,1] }}
        className="flip-card md:h-[370px] cursor-pointer"
        onClick={handleTap}>
        <div className={`flip-card-inner ${flipped ? "flipped" : ""}`}>

          {/* Front */}
          <div className="flip-card-front rounded-2xl overflow-hidden group"
            style={{ border:"1px solid var(--c-border)" }}>
            <div className="relative w-full h-[190px] md:h-[250px] overflow-hidden"
              style={{ background:"var(--c-faint)" }}>
              <Image src={student.photo_class_url || PH_CLASS} alt={student.name}
                fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
                className="object-cover object-top transition-transform duration-600 group-hover:scale-[1.04]" />
              <div className="absolute inset-0"
                style={{ background:"linear-gradient(to top, var(--c-card) 0%, transparent 60%)" }} />
              {student.class_number && (
                <div className="absolute top-2 left-2 font-mono text-[9px] rounded-md px-1.5 py-0.5"
                  style={{ background:"var(--c-gold)", color:"#0c0b0f" }}>
                  #{student.class_number.toString().padStart(2,"0")}
                </div>
              )}
              <div className="hidden md:block absolute top-2 right-2 font-mono text-[9px] rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background:"rgba(0,0,0,0.6)", color:"var(--c-muted)" }}>flip →</div>
              <div className="md:hidden absolute top-2 right-2 font-mono text-[9px] rounded-md px-1.5 py-0.5"
                style={{ background:"rgba(0,0,0,0.6)", color:"var(--c-muted)" }}>tap</div>
            </div>
            <div className="p-3" style={{ background:"var(--c-card)" }}>
              <h3 className="font-display text-sm md:text-base font-semibold leading-tight truncate"
                style={{ color:"var(--c-ink)" }}>{student.name}</h3>
              <p className="font-mono text-[9px] md:text-[10px] mt-0.5 truncate" style={{ color:"var(--c-gold)" }}>
                {student.custom_title}</p>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back rounded-2xl overflow-hidden"
            style={{ border:"1px solid rgba(240,180,41,0.25)", background:"var(--c-card)" }}>
            <div className="relative w-full h-[170px] overflow-hidden" style={{ background:"var(--c-faint)" }}>
              <Image src={student.photo_grad_url || PH_GRAD} alt={`${student.name} wisuda`}
                fill sizes="25vw" className="object-cover object-top" />
              <div className="absolute inset-0"
                style={{ background:"linear-gradient(to top, var(--c-card), rgba(26,25,32,0.3) 50%, transparent)" }} />
            </div>
            <div className="p-3 flex flex-col gap-2.5">
              <div>
                <h3 className="font-display text-sm font-semibold" style={{ color:"var(--c-ink)" }}>{student.name}</h3>
                <span className="font-mono text-[9px]" style={{ color:"var(--c-gold)" }}>{student.custom_title}</span>
              </div>
              {student.quote && (
                <div className="flex items-start gap-1.5">
                  <Quote size={10} style={{ color:"var(--c-gold)", marginTop:2, flexShrink:0 }} />
                  <p className="font-body text-[11px] leading-relaxed line-clamp-3" style={{ color:"var(--c-muted)" }}>
                    {student.quote}</p>
                </div>
              )}
              {student.destination && (
                <div className="flex items-center gap-1 mt-auto">
                  <MapPin size={10} style={{ color:"var(--c-coral)", flexShrink:0 }} />
                  <span className="font-mono text-[9px] truncate" style={{ color:"var(--c-coral)" }}>
                    {student.destination}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {sheet && <DetailSheet student={student} onClose={() => setSheet(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function StudentRoster({ students }: { students: Student[] }) {
  if (!students.length) return (
    <div className="col-span-full flex flex-col items-center py-16 gap-3 text-center">
      <div className="text-5xl">🎓</div>
      <p className="font-display text-xl" style={{ color:"var(--c-muted)" }}>Belum ada data warga kelas.</p>
    </div>
  );
  const sorted = [...students].sort((a,b) => a.is_featured === b.is_featured ? 0 : a.is_featured ? -1 : 1);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {sorted.map((s,i) => <StudentCard key={s.id} student={s} index={i} />)}
    </div>
  );
}
