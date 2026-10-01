/** @type {import('tailwindcss').Config} */
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

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
        out: EASE_OUT,
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translate3d(0, 2rem, 0)" },
          to: { opacity: "1", transform: "none" },
        },
        settle: {
          from: { opacity: "0", transform: "scale(1.08)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "page-in": {
          from: { opacity: "0", transform: "translate3d(0, 0.75rem, 0)" },
          to: { opacity: "1", transform: "none" },
        },
        "menu-in": {
          from: { opacity: "0", transform: "translate3d(0, -0.75rem, 0)" },
          to: { opacity: "1", transform: "none" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        "line-up": {
          from: { transform: "translate3d(0, 105%, 0)" },
          to: { transform: "none" },
        },
        marquee: {
          from: { transform: "translate3d(0, 0, 0)" },
          to: { transform: "translate3d(-50%, 0, 0)" },
        },
      },
      animation: {
        rise: `rise 700ms ${EASE_OUT} both`,
        "line-up": `line-up 900ms ${EASE_OUT} both`,
        settle: `settle 900ms ${EASE_OUT} both`,
        "page-in": `page-in 450ms ${EASE_OUT} both`,
        "menu-in": `menu-in 400ms ${EASE_OUT} both`,
        pop: `pop 450ms ${EASE_OUT}`,
        marquee: "marquee 48s linear infinite",
      },
    },
  },
  plugins: [],
};
