// tailwind.config.cjs
// module.exports = {
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'iron-red': '#C53030',
        'iron-dark': '#0B0F14',
        'iron-gold': '#D4AF37',
        'iron-steel': '#1F2937',
        'iron-cyan': '#0EA5E9',
      },
      fontFamily: {
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 6px 30px rgba(197,48,48,0.18)',
        'soft-metal': '0 4px 10px rgba(2,6,23,0.6)',
      },
    },
  },
  plugins: [],
};
