/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tecmilenio Official Green & Neutral Tones
        tecmilenio: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00a859', // Official Tecmilenio Primary Green
          600: '#008744', // Darker Brand Green
          700: '#006c35',
          800: '#00542a',
          900: '#033a1e',
          950: '#012111',
        },
        surface: {
          base: '#0c120e',
          card: '#131c16',
          panel: '#18241d',
          hover: '#1f2e25',
          border: '#26382c',
          borderLight: '#344c3c',
        },
        turf: {
          dark: '#08170d',
          DEFAULT: '#0d2214',
          stripe: '#102a19',
          line: '#ffffff',
          hash: 'rgba(255, 255, 255, 0.4)',
        },
        offense: {
          DEFAULT: '#00a859', // Tecmilenio Green
          dark: '#008744',
          light: '#22c55e',
        },
        defense: {
          DEFAULT: '#e11d48', // Athletic Rose/Red
          dark: '#be123c',
          light: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', '"Outfit"', 'sans-serif'],
      },
      boxShadow: {
        'clean': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'clean-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
        'card': '0 0 0 1px #26382c, 0 4px 12px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
