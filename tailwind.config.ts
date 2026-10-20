import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SCDS Official Brand System
        // Primary Electric Blue (#0048E8)
        brand: {
          50: "#F5F8FF",
          100: "#E6EEFF",
          200: "#C5D8FF",
          300: "#94B8FF",
          400: "#578EFF",
          500: "#1F64FF",
          600: "#0048E8", // Official Primary Electric Blue
          700: "#003AC2", // Primary Hover
          800: "#002E99",
          900: "#0B1F50", // Official Deep Navy Blue
          950: "#071333",
        },
        // Secondary Golden Yellow (#F8B820)
        gold: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#F8B820", // Official Secondary Golden Yellow
          500: "#F8B820", // Official Secondary Golden Yellow
          600: "#D99B0C",
          700: "#B47B09",
          800: "#925F0E",
          900: "#784D0F",
        },
        // Deep Navy (#0B1F50) & Charcoal Black (#252525) mapped for consistent hierarchy
        navy: {
          DEFAULT: "#0B1F50",
          800: "#102A6B",
          900: "#0B1F50",
          950: "#071436",
        },
        charcoal: {
          DEFAULT: "#252525",
        },
        surface: {
          DEFAULT: "#F5F8FF",
        },
        slate: {
          50: "#F5F8FF", // Light Blue Surface (--color-surface)
          800: "#162F6E",
          900: "#0B1F50", // Deep Navy Blue (--color-navy)
          950: "#0B1F50", // Deep Navy Blue (--color-navy)
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
