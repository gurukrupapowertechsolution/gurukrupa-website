/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        /* Now that sections run edge to edge instead of stopping at 1280px,
           grids need a breakpoint above Tailwind's 2xl (1536px) to add columns
           on ultrawide displays rather than stretching the existing ones. */
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}