/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'void-black': '#0D0D0D',
        'stardust': '#E8E6E1',
        'art-deco-brass': '#D4AF37',
        'oxidized-copper': '#4B7F78',
        'nebula-red': '#B84A4A',
        'deep-space': '#161616',
      },
      fontFamily: {
        sans: ['"Josefin Sans"', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
}