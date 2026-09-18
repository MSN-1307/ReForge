/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        },
        console: {
          dark: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          evidence: '#238636',
          analysis: '#1f6feb',
          hypothesis: '#8957e5'
        }
      }
    },
  },
  plugins: [],
}
