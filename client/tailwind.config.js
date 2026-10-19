/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      colors: {
        canvas: '#F3F4F5',
        surface: '#FFFFFF',
        line: '#E1E3E6',
        ink: {
          DEFAULT: '#24272B',
          muted: '#69717B',
          soft: '#8C939D'
        },
        graphite: {
          50: '#F4F5F6',
          100: '#E9EBED',
          200: '#D5D8DC',
          300: '#B4B9C0',
          400: '#8C939D',
          500: '#69717B',
          600: '#4F565F',
          700: '#3C4148',
          800: '#2E3237',
          900: '#24272B',
          950: '#17191C'
        },
        accent: {
          50: '#FFF4ED',
          100: '#FFE6D5',
          200: '#FECAAC',
          300: '#FDA974',
          400: '#F47732',
          500: '#E85F16',
          600: '#C94A0B',
          700: '#A73B0B',
          800: '#873110',
          900: '#6F2C10'
        },
        success: {
          50: '#ECF8F3',
          100: '#D2F0E2',
          200: '#A5E0C6',
          500: '#16805C',
          600: '#126B4C',
          700: '#0E5540'
        },
        warning: {
          50: '#FEF7E8',
          100: '#FCEBC7',
          200: '#F8D68B',
          500: '#D97706',
          600: '#B65F04',
          700: '#924C05'
        },
        danger: {
          50: '#FDF0EF',
          100: '#FADFDD',
          200: '#F3BFBB',
          500: '#C2413B',
          600: '#A53631',
          700: '#872B27'
        }
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '18px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 25, 28, 0.04), 0 1px 3px rgba(23, 25, 28, 0.06)',
        raised: '0 16px 40px -20px rgba(23, 25, 28, 0.28), 0 2px 8px rgba(23, 25, 28, 0.06)',
        focus: '0 0 0 3px rgba(244, 119, 50, 0.28)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        'step-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'step-in': 'step-in 220ms cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
}
