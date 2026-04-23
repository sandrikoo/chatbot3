/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1218',
        panel: '#1c1f25',
        panelHi: '#262a31',
        divider: 'rgba(255,255,255,0.08)',
        accent: '#2479ff',
        textPri: '#ffffff',
        textSec: 'rgba(255,255,255,0.65)',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
