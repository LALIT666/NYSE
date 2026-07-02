/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0e0e10",
        panel: "#18181b",
        border: "#2a2a2e",
      },
    },
  },
  plugins: [],
};
