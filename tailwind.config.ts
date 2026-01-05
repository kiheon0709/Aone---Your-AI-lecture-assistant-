import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#5B6EFF",
          hover: "#4A5EEE",
        },
        secondary: {
          DEFAULT: "#F5F6FA",
          hover: "#E8EBF5",
        },
      },
    },
  },
  plugins: [],
};
export default config;



