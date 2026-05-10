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
        gov: {
          red: "#DA291C",
          navy: "#0D2B4E",
          blue: "#1F5CA8",
          lightblue: "#E8F0FB",
          gold: "#C9A227",
          gray: {
            50: "#F7F8FA",
            100: "#EDEEF2",
            300: "#C2C7D6",
            500: "#7A8099",
            700: "#4A4F66",
            900: "#1A1D2E",
          },
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(13,43,78,0.08), 0 4px 16px rgba(13,43,78,0.06)",
        "card-hover": "0 4px 12px rgba(13,43,78,0.12), 0 8px 32px rgba(13,43,78,0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
