/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./src/**/*.{js,jsx,ts,tsx}",
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Momo Trust Display', 'sans-serif'],
      },
      colors: {
        'ard-blue': {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80c0ff',
          300: '#4da7ff',
          400: '#1a8eff',
          500: '#003480',
          600: '#002d73',
          700: '#002666',
          800: '#001f59',
          900: '#00184c',
        },
      },
    },
  },
  plugins: [],
}

