import type { Config } from "tailwindcss";

// Design tokens for the study companion app.
// Deliberately not the generic "cream + serif + terracotta" AI-default —
// a calm, forest/growth palette for the momentum-tracking angle of the app,
// with amber reserved for attention/nudges.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F3F4F1",
        surface: "#FFFFFF",
        ink: "#1F2A24",
        "ink-muted": "#5B655F",
        forest: "#2F6F4E",
        "forest-light": "#DCEAE1",
        amber: "#C17A3D",
        "amber-light": "#F3E3D2",
        violet: "#6B5B95",
        "violet-light": "#E7E3F0",
        blue: "#3B6EA5",
        "blue-light": "#DFE9F3",
        border: "#E4E3DC",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
