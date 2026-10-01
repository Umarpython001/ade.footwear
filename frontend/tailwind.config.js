/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Workshop bench at night: warm near-blacks, bone type, one ADE gold.
        ink: "#0d0b09",
        coal: "#16120e",
        bark: "#211a13",
        seam: "#3a2e23",
        bone: "#f6f1e9",
        sand: "#bcae9c",
        gold: {
          DEFAULT: "#edb52a",
          deep: "#c9931b",
        },
        cognac: "#9a5b2e",
        walnut: "#4a3020",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Schibsted Grotesk"', "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "80rem",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
