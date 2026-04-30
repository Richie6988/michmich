import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        barry: {
          blue: '#2563EB',
          coral: '#F97316',
          green: '#10B981',
          grey: '#64748B',
          canvas: '#FAFAFA',
          red: '#EF4444',
          yellow: '#F59E0B',
          black: '#0F172A',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'barry-bounce': 'barryBounce 2s ease-in-out infinite',
        'barry-wave': 'barryWave 1.5s ease-in-out infinite',
        'pin-drop': 'pinDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ripple': 'ripple 0.8s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        barryBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        barryWave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(15deg)' },
          '75%': { transform: 'rotate(-15deg)' },
        },
        pinDrop: {
          '0%': { transform: 'translateY(-100px) scale(0.5)', opacity: '0' },
          '60%': { transform: 'translateY(10px) scale(1.1)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
