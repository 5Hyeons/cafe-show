/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cafeshow: {
          red: '#da203d',
          pink: '#fff5f7',
          gray: {
            100: '#feffff',
            200: '#dddddd',
            300: '#bcbcbc',
            900: '#111111',
          }
        }
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
}
