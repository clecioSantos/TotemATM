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
          light: '#FDFBF7',     // Off-white para fundos
          dark: '#1C1917',      // Carvão escuro para textos (stone-900)
          accent: '#EAB308',    // Âmbar/Dourado (yellow-500)
          accentHover: '#CA8A04', // yellow-600
          success: '#16A34A',   // Verde fresco (green-600)
          muted: '#78716C',     // Cinza quente para legendas (stone-500)
          border: '#E7E5E4',    // Stone-200
        }
      },
      borderRadius: {
        'premium': '18px',      // Seguindo o padrão de 18px das regras do projeto
      }
    },
  },
  plugins: [],
}
