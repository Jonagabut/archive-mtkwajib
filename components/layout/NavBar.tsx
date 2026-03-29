"use client";
// components/layout/NavBar.tsx
// FIX: tambah active section highlight via IntersectionObserver
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#roster",  label: "Warga Kelas", sectionId: "roster"  },
  { href: "#gallery", label: "Archive",     sectionId: "gallery" },
  { href: "#board",   label: "Board",       sectionId: "board"   },
];

export default function NavBar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [activeId,    setActiveId]    = useState<string | null>(null);

  // Scroll + active section detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Track which section is most visible using IntersectionObserver
    const sectionIds = LINKS.map((l) => l.sectionId);
    const ratioMap   = new Map<string, number>(sectionIds.map((id) => [id, 0]));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratioMap.set(entry.target.id, entry.intersectionRatio);
        });
        // Set active to the section with highest visible ratio
        let best = "";
        let bestRatio = 0;
        ratioMap.forEach((ratio, id) => {
          if (ratio > bestRatio) { bestRatio = ratio; best = id; }
        });
        setActiveId(bestRatio > 0.05 ? best : null);
      },
      { threshold: [0, 0.05, 0.2, 0.5, 0.8, 1] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
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
          {LINKS.map((l) => {
            const isActive = activeId === l.sectionId;
            return (
              <a key={l.href} href={l.href}
                className="relative px-4 py-2 font-body text-sm rounded-lg transition-colors duration-200"
                style={{ color: isActive ? "var(--ink)" : "var(--muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? "var(--ink)" : "var(--muted)")}>
                {l.label}
                {/* Active underline indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      key="underline"
                      layoutId="nav-active"
                      initial={{ opacity: 0, scaleX: 0.5 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0.5 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute bottom-0.5 left-3 right-3 h-px rounded-full"
                      style={{ background: "var(--gold)" }}
                    />
                  )}
                </AnimatePresence>
              </a>
            );
          })}
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
              {LINKS.map((l) => {
                const isActive = activeId === l.sectionId;
                return (
                  <a key={l.href} href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 font-body text-sm rounded-xl flex items-center justify-between"
                    style={{
                      color: isActive ? "var(--ink)" : "var(--muted)",
                      background: isActive ? "var(--faint)" : "transparent",
                      borderLeft: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                    }}>
                    {l.label}
                    {isActive && (
                      <span className="font-mono text-[8px]" style={{ color: "var(--gold)" }}>
                        ●
                      </span>
                    )}
                  </a>
                );
              })}
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
