/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef3f9',
          100: '#d9e4f1',
          200: '#b3c8e2',
          300: '#7f9fc6',
          400: '#4f77a6',
          500: '#2f5a88',
          600: '#214770',
          700: '#18395b',
          800: '#112a45',
          900: '#0b1d33',
          950: '#071424',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        'drawer-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'drawer-in': 'drawer-in 200ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};
