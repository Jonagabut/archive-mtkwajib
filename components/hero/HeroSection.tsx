"use client";
// components/hero/HeroSection.tsx
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";

const SPOTIFY_PLAYLIST_ID =
  process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID ?? "37i9dQZF1DXcBWIGoYBM5M";

const GRADUATION_YEAR = 2026;

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });

  const bgY    = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
  };

  const itemVariants = {
    hidden:  { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-void"
    >
      {/* Parallax orbs — using arbitrary % values for opacity because
          Tailwind's opacity scale (/4, /3) doesn't include those fractions */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[8%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gold/[5%] blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-[5%] right-[5%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-coral/[5%] blur-[60px] sm:blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] rounded-full bg-lavender/[4%] blur-[50px] sm:blur-[80px]" />
      </motion.div>

      {/* Diagonal lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="absolute h-px w-full bg-gold"
            style={{ top: `${(i + 1) * 8}%`, transform: "rotate(-6deg) scaleX(1.2)" }} />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        style={{ y: titleY, opacity }}
        className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-5xl mx-auto"
      >
        <motion.div variants={containerVariants} initial="hidden" animate="visible"
          className="flex flex-col items-center gap-5 sm:gap-6">

          {/* Label */}
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <span className="h-px w-8 sm:w-12 bg-gold/60" />
            <span className="section-label">Kelas XII — {GRADUATION_YEAR}</span>
            <span className="h-px w-8 sm:w-12 bg-gold/60" />
          </motion.div>

          {/* Title — scales from 4xl on xs up to 9xl on xl */}
          <motion.h1 variants={itemVariants}
            className="font-display text-[clamp(3rem,12vw,8rem)] text-ink hero-text-shadow leading-[0.9]">
            MTK
            <br />
            <span className="text-gold">Wajib</span>
            <br />
            Archive
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants}
            className="font-body text-muted text-sm sm:text-base md:text-lg max-w-xs sm:max-w-lg">
            Tiga tahun. Ribuan kenangan. Satu tempat yang bakal ada selamanya.
          </motion.p>

          {/* CTA buttons — stack on xs, side by side on sm+ */}
          <motion.div variants={itemVariants}
            className="flex flex-col xs:flex-row flex-wrap items-center gap-3 justify-center mt-1 w-full sm:w-auto">
            <a href="#roster" className="btn-gold w-full xs:w-auto justify-center">Lihat Warga Kelas</a>
            <a href="#gallery" className="btn-outline w-full xs:w-auto justify-center">The Archive</a>
          </motion.div>

          {/* Spotify embed — full width on mobile, capped on sm+ */}
          <motion.div variants={itemVariants} className="w-full sm:max-w-sm mt-2">
            <div className="card-glass p-3">
              <p className="section-label text-[10px] mb-2 text-center">🎵 Class Anthem</p>
              {/* frameBorder is deprecated — use style={{ border: 0 }} instead */}
              <iframe
                src={`https://open.spotify.com/embed/playlist/${SPOTIFY_PLAYLIST_ID}?utm_source=generator&theme=0`}
                width="100%"
                height="80"
                style={{ border: 0 }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-lg"
                title="Class playlist"
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted z-10">
        <span className="font-mono text-[10px] tracking-widest">SCROLL</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown size={18} className="text-gold" />
        </motion.div>
      </motion.div>

      {/* Year stamp */}
      <div className="absolute top-8 right-6 sm:right-8 font-mono text-[10px] text-muted tracking-widest opacity-50 hidden md:block">
        CLASS OF {GRADUATION_YEAR}
      </div>
    </section>
  );
}
