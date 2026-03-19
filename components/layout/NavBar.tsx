"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#roster",  label: "Warga Kelas" },
  { href: "#gallery", label: "Archive"     },
  { href: "#board",   label: "Board"       },
];

export default function NavBar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }} animate={{ y:0, opacity:1 }}
      transition={{ delay:0.4, duration:0.55, ease:[0.22,1,0.36,1] }}
      className="fixed top-0 inset-x-0 z-40 transition-all duration-400"
      style={scrolled ? {
        background: "rgba(12,11,15,0.88)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--c-border)",
      } : { background: "transparent" }}>
      <div className="container mx-auto px-4 md:px-8 h-15 flex items-center justify-between" style={{ height: 60 }}>
        <a href="#" className="flex items-center gap-2.5">
          <span className="font-display text-base font-bold" style={{ color: "var(--c-gold)" }}>
            MTK<span style={{ color: "var(--c-ink)" }}>W</span>
          </span>
          <span className="hidden sm:block font-mono text-[9px] tracking-widest pl-2.5"
            style={{ color: "var(--c-muted)", borderLeft: "1px solid var(--c-border)" }}>
            ARCHIVE 2026
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="px-4 py-2 font-body text-sm rounded-xl transition-colors duration-200"
              style={{ color: "var(--c-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-muted)")}>
              {l.label}
            </a>
          ))}
          <a href="#board" className="btn-gold ml-2 py-2 px-4 text-xs">+ Post Note</a>
        </nav>

        <button onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 transition-colors"
          style={{ color: "var(--c-muted)" }} aria-label="Toggle menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:[0.22,1,0.36,1] }}
            className="md:hidden overflow-hidden" style={{ background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)" }}>
            <nav className="flex flex-col p-4 gap-1">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 font-body text-sm rounded-xl transition-colors"
                  style={{ color: "var(--c-muted)" }}>
                  {l.label}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
