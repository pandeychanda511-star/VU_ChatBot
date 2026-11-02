/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vu: {
          navy: '#0b2545',
          gold: '#c59b27',
          blue: '#134074',
          light: '#eef4f8'
        }
      }
    },
  },
  plugins: [],
}

