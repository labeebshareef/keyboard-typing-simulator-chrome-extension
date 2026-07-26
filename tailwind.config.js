/** @type {import('tailwindcss').Config} */
export default {
  content: ['./entrypoints/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // TypeReel brand indigo, anchored on #5B5BD6 (see brand brief).
        primary: {
          50: '#f1f1fb',
          100: '#e3e3f8',
          200: '#c9c9f0',
          300: '#ababe7',
          400: '#8384dd',
          500: '#5b5bd6',
          600: '#4a48c4',
          700: '#3d3aa5',
          800: '#333185',
          900: '#2d2c6b',
        },
      },
    },
  },
  plugins: [],
};
