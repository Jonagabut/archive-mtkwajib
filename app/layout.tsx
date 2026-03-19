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
        <div aria-hidden className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.018]" />
        {children}
      </body>
    </html>
  );
}
