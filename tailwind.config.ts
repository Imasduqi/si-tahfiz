import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#059669',
          dark:    '#047857',
          light:   '#D1FAE5',
          lighter: '#ECFDF5',
        },
        danger:  '#EF4444',
        warning: '#F59E0B',
        orange:  '#F97316',
        surface: '#F9FAFB',
        border:  '#E5E7EB',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        /* Background pulse (blobs) */
        'pulse-bg': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.08)' },
        },
        /* Fade in */
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        /* Slide up + fade in */
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /* Slide down + fade in */
        'fade-in-down': {
          '0%':   { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /* Scale in */
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.88)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        /* Gentle float */
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        /* Shimmer sweep */
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        /* Spin slow */
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        /* Blob morph */
        'blob-morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', transform: 'translate(0,0) rotate(0deg)' },
          '33%':      { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%', transform: 'translate(20px,-15px) rotate(60deg)' },
          '66%':      { borderRadius: '50% 50% 20% 80% / 25% 80% 20% 75%', transform: 'translate(-10px,15px) rotate(120deg)' },
        },
        /* Glow pulse */
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(5,150,105,0.3)' },
          '50%':      { boxShadow: '0 0 50px rgba(5,150,105,0.6), 0 0 80px rgba(5,150,105,0.2)' },
        },
        /* Slide right */
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'pulse-bg':       'pulse-bg 5s ease-in-out infinite',
        'fade-in':        'fade-in 0.5s ease-out both',
        'fade-in-up':     'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-down':   'fade-in-down 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':       'scale-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'float':          'float 5s ease-in-out infinite',
        'shimmer':        'shimmer 2.5s infinite',
        'spin-slow':      'spin-slow 20s linear infinite',
        'blob-morph':     'blob-morph 12s ease-in-out infinite',
        'glow-pulse':     'glow-pulse 3s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}

export default config
