/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
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
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'fade-in-scale': 'fade-in-scale 0.2s ease-out both',
        'slide-in-down': 'slide-in-down 0.2s ease-out both',
        'slide-in-up': 'slide-in-up 0.2s ease-out both',
        'bounce-in': 'bounce-in 0.25s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
