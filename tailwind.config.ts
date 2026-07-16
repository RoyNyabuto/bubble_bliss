import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3ACF5A",
        secondary: "#6C63FF",
        accent: "#FF7EDB",
        bgdark: "#0B0B0B",
        lightgray: "#F5F5F5"
      },
      keyframes: {
        floatUp: {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0.6" },
          "100%": { transform: "translateY(-600px) translateX(40px)", opacity: "0" }
        },
        spinSlow: { to: { transform: "rotate(360deg)" } }
      },
      animation: {
        floatUp: "floatUp 8s linear infinite",
        spinSlow: "spinSlow 6s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
