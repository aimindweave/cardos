/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cardos: {
          bg: '#060b14',
          card: 'rgba(255,255,255,0.03)',
          border: 'rgba(255,255,255,0.06)',
          accent: '#ff4757',
          green: '#76b900',
        },
      },
    },
  },
  plugins: [],
};
