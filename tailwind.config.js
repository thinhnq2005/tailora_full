/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-gold': '#FBBF24',
        'gold-hover': '#F59E0B',
        'dark-navy': '#0F172A',
        'text-dark': '#111827',
        primary: "var(--primary-gold, #FBBF24)",
        dark: "var(--dark, #0F172A)",
      },
    },
  },
  plugins: [],
};
