import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070F1E',
          900: '#0B1528',
          800: '#111F38',
          700: '#1E293B',
        },
        aqua: {
          400: '#00E5FF',
          500: '#00C2E0',
        },
        gold: {
          400: '#FFD700',
          500: '#EAB308',
        },
        coral: {
          500: '#FF5B00',
        },
        'primary-coral': '#FF5B00',
        'secondary-forest': '#00473F',
        'neutral-canvas': '#070F1E',
        'neutral-light': '#0B1528',
      },
      borderWidth: {
        '3': '3px',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        scan: 'scan 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
