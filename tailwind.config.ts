import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F3EFEC',
        surface: '#FAF9F7',
        primary: '#C96442',
        textMain: '#24211D',
        textMuted: '#7A7570',
        borderInner: '#E8E5E0',
        borderOuter: '#D4D0CA',
        accent: '#C96442',
        success: '#2F593F',
        error: '#8C2F2B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
        lg: '0.5rem',
      },
      animation: {
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
