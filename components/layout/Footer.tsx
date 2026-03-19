"use client";
import { Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t py-10 overflow-hidden"
      style={{ background: "var(--c-void)", borderColor: "var(--c-border)" }}>
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, var(--c-gold), transparent)", opacity: 0.3 }} />
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex flex-col items-center md:items-start gap-0.5">
            <span className="font-display text-xl font-bold" style={{ color: "var(--c-gold)" }}>MTK Wajib Archive</span>
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--c-muted)" }}>CLASS OF 2026 — FOREVER ARCHIVED</span>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            {["#roster","#gallery","#board"].map((href) => (
              <a key={href} href={href} className="font-mono text-[10px] tracking-wide capitalize transition-colors"
                style={{ color: "var(--c-muted)" }}>
                {href.replace("#","")}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: "var(--c-muted)" }}>
            <span>Made with</span><Heart size={10} style={{ color: "var(--c-coral)", fill: "var(--c-coral)" }} /><span>for 2026</span>
          </div>
        </div>
        <div className="mt-7 pt-5 flex flex-col sm:flex-row items-center justify-between gap-1.5"
          style={{ borderTop: "1px solid rgba(42,40,53,0.5)" }}>
          <p className="font-mono text-[9px]" style={{ color: "var(--c-muted)", opacity: 0.5 }}>
            © {year} MTK Wajib Archive. All memories reserved.
          </p>
          <p className="font-mono text-[9px]" style={{ color: "var(--c-muted)", opacity: 0.4 }}>
            Next.js · Supabase · Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
}
