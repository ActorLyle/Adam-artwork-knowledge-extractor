import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#25251f",
        paper: "#f5f3ed",
        accent: "#e56843",
      },
      fontFamily: {
        serif: ["var(--font-editorial)", "Georgia", "serif"],
        sans: ["var(--font-ui)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
