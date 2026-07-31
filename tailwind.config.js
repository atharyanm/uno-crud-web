/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#121110',
          card: '#1a1816',
          cardHover: '#221f1c',
          border: '#2a2622',
          borderHover: '#3d3832',
          amber: '#f59e0b',
          amberHover: '#d97706',
          gold: '#fbbf24',
          terracotta: '#ea580c',
          emerald: '#10b981',
          crimson: '#ef4444',
          text: '#f3f1ee',
          muted: '#a8a29e',
          subtle: '#78716c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        pulseFast: 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
