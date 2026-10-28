/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B4FFF',
          dark: '#4A3FDB',
          light: '#7269FF',
        },
        success: {
          DEFAULT: '#2DD4BF',
          dark: '#14B8A6',
          light: '#5EEAD4',
        },
        danger: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#F87171',
        },
        warning: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FBBF24',
        },
      },
    },
  },
  plugins: [],
}
