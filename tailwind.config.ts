import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-coral': '#FF5B00',
        'secondary-forest': '#00473F',
        'neutral-canvas': '#FFFFFF',
        'neutral-light': '#F8F9FA',
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
