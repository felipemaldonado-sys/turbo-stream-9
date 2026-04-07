import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0c0e12",
          raised: "#12151c",
          border: "#1e2430",
        },
        accent: {
          DEFAULT: "#22d3ee",
          muted: "#0891b2",
        },
      },
    },
  },
  plugins: [],
};

export default config;
