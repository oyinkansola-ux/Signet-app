/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F5F4F0',
        surface: '#FFFFFF',
        nav: '#1C1C1E',
        'nav-hover': '#2C2C2A',
        primary: '#1C1C1E',
        secondary: '#6B6B6B',
        tertiary: '#9A9A9A',
        border: '#E4E3DF',
        amber: '#E8A020',
        'amber-dark': '#D4911A',
        success: '#2D7A4F',
        'success-bg': '#F0FAF4',
        error: '#C0392B',
        'error-bg': '#FDF2F2',
        'input-bg': '#FFFFFF',
        'row-hover': '#FAFAF8',
        'warn-bg': '#FFFBF2',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out forwards',
        'slide-in-top': 'slideInTop 200ms ease-out forwards',
        'slide-in-right': 'slideInRight 250ms ease-out forwards',
        'stagger-1': 'fadeIn 300ms ease-out 100ms forwards',
        'stagger-2': 'fadeIn 300ms ease-out 200ms forwards',
        'stagger-3': 'fadeIn 300ms ease-out 300ms forwards',
        'stagger-4': 'fadeIn 300ms ease-out 400ms forwards',
        'flood': 'flood 300ms ease-out forwards',
        'slide-up': 'slideUp 250ms ease-out forwards',
        'slide-down': 'slideDown 200ms ease-in forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInTop: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        flood: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
