/** @type {import('tailwindcss').Config} */ 
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f6f5",
          100: "#e3edea",
          200: "#c8dad3",
          300: "#a6c2b7",
          400: "#7da493",
          500: "#5a8a78",
          600: "#3c6f5f",
          700: "#2f574a",
          800: "#26463c",
          900: "#1d372f",
        },
        sand: {
          50: "#faf8f5",
          100: "#f3eee8",
          200: "#e7dfd5",
          300: "#d2c3ae",
        },
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.04)",
        card: "0 4px 16px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        xl: "1rem",
        '2xl': "1.25rem",
      },
    },
  },
  plugins: [],
}
