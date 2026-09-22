/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        person: {
          a: {
            50: '#fefce8',
            100: '#fef9c3',
            400: '#facc15',
            500: '#eab308',
            700: '#a16207',
            900: '#713f12',
          },
          b: {
            50: '#faf5ff',
            100: '#f3e8ff',
            400: '#c084fc',
            500: '#a855f7',
            700: '#7e22ce',
            900: '#581c87',
          },
        },
      },
    },
  },
  plugins: [],
};
