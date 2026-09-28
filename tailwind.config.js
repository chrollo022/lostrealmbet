/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#0a0e17',
          900: '#0e1420',
          850: '#131b2b',
          800: '#182234',
          750: '#1e2b40',
          700: '#26354d',
          600: '#334460',
          500: '#4b5e7e',
          400: '#7688a2',
          300: '#a3b1c6',
          border: 'rgba(255, 255, 255, 0.08)',
          card: '#131b2a',
          'card-hover': '#182235',
          blue: '#0074e4',
          'blue-hover': '#0284c7',
          gold: '#f59e0b',
          green: '#10b981',
          cyan: '#38bdf8',
          purple: '#8b5cf6',
          bgl: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 116, 228, 0.35)',
        'glow-cyan': '0 0 20px rgba(56, 189, 248, 0.35)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.35)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
