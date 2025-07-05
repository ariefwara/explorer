/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'explorer-blue': '#0078d4',
        'explorer-light-blue': '#e5f3ff',
        'explorer-gray': '#f5f5f5',
        'explorer-border': '#e1e5e9',
        'explorer-sidebar': '#f8f9fa',
        'explorer-hover': '#e8e8e8',
        'explorer-selected': '#cce8ff',
      },
      fontFamily: {
        'segoe': ['Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'explorer': '0 1px 3px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}