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
        void:    "#08080d",
        surface: "#0e0d14",
        card:    "#151420",
        border:  "#22203a",
        faint:   "#1c1b2c",
        ink:     "#eeeae0",
        muted:   "#5e5c78",
        soft:    "#9896b0",
        gold: { DEFAULT: "#f0b429", dim: "#c4901e" },
        coral:   "#e06a55",
        sage:    "#6db891",
      },
      boxShadow: {
        "gold-glow": "0 0 28px rgba(240,180,41,0.22), 0 0 56px rgba(240,180,41,0.08)",
        "card-lift": "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,180,41,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
