import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        mist: "#f3f0e8",
        sand: "#e6dcc7",
        moss: "#6e7b63",
        rust: "#9b5d38"
      }
    }
  },
  plugins: []
};

export default config;

