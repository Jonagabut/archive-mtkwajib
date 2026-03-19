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
        display: ["'Syne'", "sans-serif"],
        body:    ["'Plus Jakarta Sans'", "sans-serif"],
        mono:    ["'DM Mono'", "monospace"],
      },
      colors: {
        void:    "#0c0b0f",
        surface: "#131218",
        card:    "#1a1920",
        border:  "#2a2835",
        faint:   "#222030",
        ink:     "#ede8df",
        muted:   "#6b6878",
        gold: {
          DEFAULT: "#f0b429",
          dim:     "#c48f1a",
        },
        coral:   "#e07560",
        sage:    "#7eb89a",
      },
      boxShadow: {
        "gold-glow":  "0 0 32px #f0b42928, 0 0 64px #f0b42910",
        "card-hover": "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px #f0b42918",
        "sticky-yellow":  "3px 3px 0 #c48f1a, 6px 6px 16px rgba(0,0,0,0.4)",
        "sticky-pink":    "3px 3px 0 #b85e48, 6px 6px 16px rgba(0,0,0,0.4)",
        "sticky-lavender":"3px 3px 0 #7060aa, 6px 6px 16px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "grid-lines": "linear-gradient(rgba(240,180,41,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(240,180,41,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "56px 56px",
      },
    },
  },
  plugins: [],
};
export default config;
