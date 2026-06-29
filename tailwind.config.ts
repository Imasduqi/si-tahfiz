import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#D1FAE5',
        },
        danger: '#EF4444',
        warning: '#F59E0B',
        orange: '#F97316',
        surface: '#F9FAFB',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'pulse-bg': {
          '0%, 100%': { backgroundColor: '#F3F4F6' },
          '50%': { backgroundColor: '#E5E7EB' },
        }
      },
      animation: {
        'pulse-bg': 'pulse-bg 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

export default config
