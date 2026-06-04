/** @type {import('tailwind-config').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#EA1D2C', // Vermelho iFood
          dark: '#C21522',
          light: '#FBE8EA',
        },
        neutral: {
          background: '#F7F7F7',
          surface: '#FFFFFF',
          border: '#E8E8E8',
          textPrimary: '#3E3E3E',
          textSecondary: '#717171',
        },
        status: {
          success: '#27AE60',
          warning: '#F2994A',
        }
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'ifood-card': '0px 2px 10px rgba(0, 0, 0, 0.05)',
        'ifood-hover': '0px 12px 28px rgba(0, 0, 0, 0.06)',
        'ifood-bottom': '0px -2px 10px rgba(0, 0, 0, 0.05)',
        'ifood-modal': '0px 20px 40px rgba(0, 0, 0, 0.15)',
        'ifood-button': '0px 4px 12px rgba(234, 29, 44, 0.25)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}