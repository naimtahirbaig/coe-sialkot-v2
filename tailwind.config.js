/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#1a3a7a',
          600: '#162f63',
          700: '#11244d',
          800: '#0d1a38',
          900: '#0a0f1c',
        },
        gold: {
          DEFAULT: '#c9a33e',
          light: '#dbb854',
          dark: '#a8862f',
          soft: 'rgba(201,163,62,0.12)',
        }
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
