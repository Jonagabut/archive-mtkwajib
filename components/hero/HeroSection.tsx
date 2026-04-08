"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

const SPOTIFY_ID = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID ?? "37i9dQZF1DXcBWIGoYBM5M";
const YEAR = 2026;

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const bgY   = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const txtY  = useTransform(scrollYProgress, [0, 1], ["0%", "48%"]);
  const fade  = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  const wrap = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.11, delayChildren: 0.2 } },
  };
  const item = {
    hidden:  { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--void)" }}>

      {/* Ambient blobs */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div style={{
          position: "absolute", top: "6%", left: "4%",
          width: "clamp(240px,40vw,520px)", height: "clamp(240px,40vw,520px)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,178,255,0.08) 0%, transparent 68%)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", bottom: "8%", right: "4%",
          width: "clamp(200px,32vw,400px)", height: "clamp(200px,32vw,400px)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(77,207,176,0.06) 0%, transparent 68%)",
          filter: "blur(55px)",
        }} />
        <div style={{
          position: "absolute", top: "42%", left: "42%",
          width: "clamp(160px,22vw,300px)", height: "clamp(160px,22vw,300px)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(29,143,214,0.05) 0%, transparent 68%)",
          filter: "blur(45px)",
        }} />
      </motion.div>

      {/* Thin diagonal lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.025 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute", height: 1, width: "140%", left: "-20%",
            background: "var(--gold)",
            top: `${(i + 1) * 9}%`,
            transform: "rotate(-4deg)",
          }} />
        ))}
      </div>

      {/* Content */}
      <motion.div
        style={{ y: txtY, opacity: fade }}
        className="relative z-10 flex flex-col items-center text-center px-5 w-full max-w-4xl mx-auto">
        <motion.div variants={wrap} initial="hidden" animate="visible"
          className="flex flex-col items-center gap-5">

          {/* Eyebrow */}
          <motion.div variants={item} className="flex items-center gap-3">
            <span style={{ width: 32, height: 1, background: "rgba(56,178,255,0.5)" }} />
            <span className="section-eyebrow">Kelas XII — {YEAR}</span>
            <span style={{ width: 32, height: 1, background: "rgba(56,178,255,0.5)" }} />
          </motion.div>

          {/* Main title */}
          <motion.h1 variants={item}
            className="hero-glow font-display font-normal"
            style={{
              fontSize: "clamp(3.2rem, 12vw, 8.5rem)",
              lineHeight: 0.9,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}>
            MTK<br />
            <em style={{ color: "var(--gold)" }}>Wajib</em><br />
            Archive
          </motion.h1>

          {/* Sub */}
          <motion.p variants={item}
            className="font-body max-w-xs sm:max-w-md"
            style={{ color: "var(--muted)", fontSize: "clamp(0.875rem, 2vw, 1.05rem)", lineHeight: 1.7 }}>
            Tiga tahun, enam orang, satu circle. Semua tersimpan di sini.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item}
            className="flex flex-col xs:flex-row flex-wrap items-center gap-3 justify-center w-full xs:w-auto">
            <a href="#roster"  className="btn-gold w-full xs:w-auto justify-center">Kenalan Sama Kita</a>
            <a href="#gallery" className="btn-ghost w-full xs:w-auto justify-center">Buka Archive</a>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10">
        <span className="font-mono text-[9px] tracking-[0.3em]" style={{ color: "var(--muted)" }}>SCROLL</span>
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown size={15} style={{ color: "var(--gold)" }} />
        </motion.div>
      </motion.div>

      {/* Year stamp */}
      <div className="absolute top-6 right-5 font-mono text-[9px] tracking-[0.28em] opacity-35 hidden md:block"
        style={{ color: "var(--muted)" }}>CLASS OF {YEAR}</div>
    </section>
  );
}
