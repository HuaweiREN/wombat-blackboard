/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d8efff',
          200: '#b8e3ff',
          300: '#84d1ff',
          400: '#48b4f5',
          500: '#1f95dc',
          600: '#1278bd',
          700: '#116099',
          800: '#134f7d',
          900: '#164366',
        },
        wombat: {
          ink: '#102033',
          moss: '#2F7D6B',
          sand: '#F4E7D3',
          coral: '#E56B5D',
          night: '#08111F',
        },
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.10)',
        panel: '0 12px 36px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 1px rgba(31, 149, 220, 0.18), 0 20px 70px rgba(31, 149, 220, 0.16)',
      },
      borderRadius: {
        panel: '1.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
