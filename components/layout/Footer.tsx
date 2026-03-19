"use client";
import { Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden py-12"
      style={{ background: "var(--void)", borderTop: "1px solid var(--border)" }}>
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(240,180,41,0.35), transparent)" }} />

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-display text-2xl"
              style={{ color: "var(--gold)", fontStyle: "italic" }}>
              MTK Wajib Archive
            </span>
            <span className="font-mono text-[9px] tracking-[0.28em]"
              style={{ color: "var(--muted)" }}>
              CLASS OF 2026 — FOREVER ARCHIVED
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-5">
            {["#roster", "#gallery", "#board"].map((href) => (
              <a key={href} href={href}
                className="font-mono text-[10px] tracking-wide capitalize transition-colors duration-200"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                {href.replace("#", "")}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 font-mono text-[10px]"
            style={{ color: "var(--muted)" }}>
            <span>Made with</span>
            <Heart size={10} style={{ color: "var(--coral)", fill: "var(--coral)" }} />
            <span>for Angkatan 2026</span>
          </div>
        </div>

        <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderTop: "1px solid rgba(34,32,58,0.6)" }}>
          <p className="font-mono text-[9px]" style={{ color: "rgba(94,92,120,0.5)" }}>
            © {year} MTK Wajib Archive. All memories reserved.
          </p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(94,92,120,0.4)" }}>
            Next.js · Supabase · Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
}
