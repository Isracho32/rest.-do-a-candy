/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        wood: {
          50:  '#fdf8f3',
          100: '#f5e9d8',
          200: '#e8cfb0',
          300: '#d4a97a',
          400: '#c08448',
          500: '#a0632e',
          600: '#7d4820',
          700: '#5c3215',
          800: '#3e200c',
          900: '#261208',
        },
        cream: {
          50:  '#fffdf7',
          100: '#fef9ec',
          200: '#fdf0cd',
          300: '#fae3a2',
          400: '#f5cc5e',
          500: '#e8b02a',
        },
        ember: {
          50:  '#fff4f2',
          100: '#ffe4de',
          200: '#ffbfb3',
          300: '#ff8a77',
          400: '#f55a42',
          500: '#e33420',
          600: '#c0280f',
          700: '#9e220d',
        },
        gold: {
          400: '#f5cc5e',
          500: '#e8b02a',
          600: '#c98a10',
        },
      },
      backgroundImage: {
        'wood-texture': "url('/images/WhatsApp_Image_2026-03-28_at_9.39.05_PM.jpeg')",
      },
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};
