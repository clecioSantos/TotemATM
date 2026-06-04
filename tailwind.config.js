/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#F7F7F7',      // Cor de fundo do Veloce
          surface: '#FFFFFF',    // Superfície clara
          dark: '#202020',       // Texto principal
          muted: '#666666',      // Texto secundário
          border: '#EAEAEA',     // Bordas
          primary: 'oklch(60% 0.18 25)', // Vermelho Veloce
          primaryHover: 'oklch(55% 0.18 25)',
          success: '#00A650',
          alert: '#FFB800',
        }
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'premium': '18px',
      }
    },
  },
  plugins: [],
}
