"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

const SPOTIFY_ID = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID ?? "37i9dQZF1DXcBWIGoYBM5M";
const YEAR = 2026;

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const bgY    = useTransform(scrollYProgress, [0,1], ["0%","28%"]);
  const titleY = useTransform(scrollYProgress, [0,1], ["0%","45%"]);
  const fade   = useTransform(scrollYProgress, [0,0.5], [1,0]);

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } } };
  const item    = { hidden: { opacity:0, y:36 }, visible: { opacity:1, y:0, transition: { duration:0.75, ease:[0.22,1,0.36,1] } } };

  return (
    <section ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--c-bg)" }}>

      {/* Ambient orbs */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[8%] left-[6%] w-[280px] sm:w-[480px] h-[280px] sm:h-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(240,180,41,0.07) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[8%] right-[6%] w-[220px] sm:w-[380px] h-[220px] sm:h-[380px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(126,184,154,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-[45%] left-[45%] w-[180px] sm:w-[280px] h-[180px] sm:h-[280px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(224,117,96,0.04) 0%, transparent 70%)", filter: "blur(50px)" }} />
      </motion.div>

      {/* Faint diagonal lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.025]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="absolute h-px w-full" style={{
            background: "var(--c-gold)", top: `${(i+1)*9}%`,
            transform: "rotate(-5deg) scaleX(1.3)"
          }} />
        ))}
      </div>

      {/* Content */}
      <motion.div style={{ y: titleY, opacity: fade }}
        className="relative z-10 flex flex-col items-center text-center px-5 max-w-4xl mx-auto w-full">
        <motion.div variants={stagger} initial="hidden" animate="visible"
          className="flex flex-col items-center gap-5">

          <motion.div variants={item} className="flex items-center gap-3">
            <span className="h-px w-8 sm:w-12" style={{ background: "var(--c-gold)", opacity: 0.5 }} />
            <span className="section-label">Kelas XII — {YEAR}</span>
            <span className="h-px w-8 sm:w-12" style={{ background: "var(--c-gold)", opacity: 0.5 }} />
          </motion.div>

          <motion.h1 variants={item}
            className="font-display hero-text-shadow leading-[0.92] font-bold"
            style={{ fontSize: "clamp(3rem,11vw,7.5rem)", color: "var(--c-ink)" }}>
            MTK<br />
            <span style={{ color: "var(--c-gold)" }}>Wajib</span><br />
            Archive
          </motion.h1>

          <motion.p variants={item} className="font-body max-w-sm sm:max-w-md"
            style={{ color: "var(--c-muted)", fontSize: "clamp(0.875rem,2vw,1.1rem)", lineHeight: 1.65 }}>
            Tiga tahun. Ribuan kenangan. Satu tempat yang bakal ada selamanya.
          </motion.p>

          <motion.div variants={item}
            className="flex flex-col xs:flex-row flex-wrap items-center gap-3 justify-center w-full xs:w-auto">
            <a href="#roster"  className="btn-gold w-full xs:w-auto justify-center">Lihat Warga Kelas</a>
            <a href="#gallery" className="btn-outline w-full xs:w-auto justify-center">The Archive</a>
          </motion.div>

          <motion.div variants={item} className="w-full sm:max-w-[340px]">
            <div className="card-glass p-3">
              <p className="section-label text-[9px] mb-2 text-center">🎵 Class Anthem</p>
              <iframe
                src={`https://open.spotify.com/embed/playlist/${SPOTIFY_ID}?utm_source=generator&theme=0`}
                width="100%" height="80" style={{ border: 0 }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy" className="rounded-lg" title="Class playlist" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2, duration:0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10"
        style={{ color: "var(--c-muted)" }}>
        <span className="font-mono text-[9px] tracking-[0.3em]">SCROLL</span>
        <motion.div animate={{ y:[0,7,0] }} transition={{ duration:1.4, repeat:Infinity, ease:"easeInOut" }}>
          <ChevronDown size={16} style={{ color: "var(--c-gold)" }} />
        </motion.div>
      </motion.div>

      <div className="absolute top-6 right-5 font-mono text-[9px] tracking-widest opacity-40 hidden md:block"
        style={{ color: "var(--c-muted)" }}>CLASS OF {YEAR}</div>
    </section>
  );
}
