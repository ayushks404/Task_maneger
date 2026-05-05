/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        surface: {
          50: '#f8f9ff',
          100: '#f0f2ff',
          200: '#e4e7f8',
          800: '#1a1d2e',
          900: '#0f1020',
          950: '#080a14'
        },
        brand: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5'
        }
      }
    }
  },
  plugins: []
};
