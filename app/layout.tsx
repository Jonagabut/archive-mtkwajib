// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTK Wajib Archive — Class of 2026",
  description: "Digital yearbook & archive for the graduating class of MTK Wajib 2026.",
  openGraph: {
    title: "MTK Wajib Archive — Class of 2026",
    description: "Memories, forever archived.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="bg-void text-ink antialiased">
        {/* Subtle grain overlay */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.022]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "256px",
            mixBlendMode: "overlay",
          }}
        />
        {children}
      </body>
    </html>
  );
}
