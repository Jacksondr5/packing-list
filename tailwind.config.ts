import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "!./src/**/*.{stories,spec}.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
