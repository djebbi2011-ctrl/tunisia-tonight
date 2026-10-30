/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#e8b84b',
          600: '#c8860a',
          700: '#92400e',
        },
        navy: {
          50:  '#f0f4f8',
          100: '#d0dce8',
          500: '#0d2a4a',
          600: '#0a1f38',
          700: '#080f1e',
          900: '#0a0e1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
