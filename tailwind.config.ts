import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#ffe156",
          primaryDark: "#f5c518",
          night: "#050507",
          ink: "#111113",
        },
        slate: {
          850: "#1b1d22",
          900: "#0f1115",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        glow: "0 15px 60px rgba(255, 225, 86, 0.15)",
      },
    },
  },
  plugins: [forms],
};

export default config;
