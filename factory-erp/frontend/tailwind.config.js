/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'abc': {
          'orange': {
            50: '#fff8f0',
            100: '#ffebd6',
            200: '#ffd6ad',
            300: '#ffb873',
            400: '#ff9238',
            500: '#f97316',
            600: '#e55c00',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          'steel': {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          },
          'safety': {
            yellow: '#ffd700',
            green: '#10b981',
            red: '#ef4444',
            blue: '#3b82f6',
          }
        },
        primary: {
          50: '#fff8f0',
          100: '#ffebd6',
          200: '#ffd6ad',
          300: '#ffb873',
          400: '#ff9238',
          500: '#f97316',
          600: '#e55c00',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          DEFAULT: '#f97316',
          dark: '#ea580c',
          light: '#fdba74',
        }
      },
      fontFamily: {
        'abc-industrial': ['ABC Industrial', 'system-ui', 'sans-serif'],
        'abc-display': ['ABC Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'factory-pattern': "url('/branding/patterns/factory-bg.svg')",
        'gradient-orange': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'gradient-steel': 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      },
      animation: {
        'factory-pulse': 'factory-pulse 2s ease-in-out infinite',
        'conveyor-move': 'conveyor-move 20s linear infinite',
        'gear-rotate': 'gear-rotate 5s linear infinite',
      },
      keyframes: {
        'factory-pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'conveyor-move': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'gear-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
