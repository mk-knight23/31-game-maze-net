/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        maze: {
          neon: '#00f3ff',
          grid: '#1e1b4b',
          bg: '#020617',
          success: '#10b981'
        }
      },
      fontFamily: {
        game: ['"Press Start 2P"', 'system-ui'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
