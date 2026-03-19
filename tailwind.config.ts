import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Instrument Serif'", "Georgia", "serif"],
        body:    ["'Syne'", "sans-serif"],
        mono:    ["'DM Mono'", "monospace"],
      },
      colors: {
        void:    "#03080f",
        surface: "#070e1c",
        card:    "#0b1628",
        border:  "#162d4e",
        faint:   "#0e1e30",
        ink:     "#daeaf8",
        muted:   "#4a6a90",
        soft:    "#7298c0",
        gold: { DEFAULT: "#38b2ff", dim: "#1d8fd6" },
        coral:   "#ff5f7e",
        sage:    "#4dcfb0",
      },
      boxShadow: {
        "gold-glow": "0 0 28px rgba(56,178,255,0.22), 0 0 56px rgba(56,178,255,0.08)",
        "card-lift": "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,178,255,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
