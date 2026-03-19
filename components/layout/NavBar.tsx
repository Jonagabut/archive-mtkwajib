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
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-40 transition-all duration-500"
      style={scrolled ? {
        background: "rgba(3,8,15,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      } : { background: "transparent" }}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between" style={{ height: 60 }}>
        <a href="#" className="flex items-center gap-3">
          <span className="font-display text-xl" style={{ color: "var(--gold)", fontStyle: "italic" }}>
            MTK<span style={{ color: "var(--ink)" }}>W</span>
          </span>
          <span className="hidden sm:block font-mono text-[9px] tracking-[0.28em] pl-3"
            style={{ color: "var(--muted)", borderLeft: "1px solid var(--border)" }}>
            ARCHIVE 2026
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="px-4 py-2 font-body text-sm rounded-lg transition-colors duration-200"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
              {l.label}
            </a>
          ))}
          <a href="#board" className="btn-gold ml-3 py-2 px-4 text-[12px]">+ Post Note</a>
        </nav>

        <button onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2" style={{ color: "var(--muted)" }} aria-label="Menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden"
            style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <nav className="flex flex-col p-4 gap-1">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 font-body text-sm rounded-xl"
                  style={{ color: "var(--muted)" }}>
                  {l.label}
                </a>
              ))}
              <a href="#board" onClick={() => setMobileOpen(false)}
                className="btn-gold mt-1 justify-center">
                + Post Note
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
