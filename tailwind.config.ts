import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dress-code palette: Deep Plum, Eggplant, Darker Silver, Mauve Champagne
        plum: { DEFAULT: "#5b2a52", dark: "#3e1c36" },
        silver: "#847384",
        mauve: { DEFAULT: "#baa3a2", light: "#e6dad8" },
        paper: "#f9f6f1",
        ink: "#27142c",
      },
      keyframes: {
        // Slow Ken Burns-style zoom and pan for the background photo.
        drift: {
          "0%": { transform: "scale(1.08) translate(0, 0)" },
          "100%": { transform: "scale(1.22) translate(-2%, -3%)" },
        },
      },
      animation: {
        drift: "drift 30s ease-in-out infinite alternate",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
