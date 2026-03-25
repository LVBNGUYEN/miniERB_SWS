/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-surface': 'var(--bg-surface)', 
        'bg-card': 'var(--bg-card)',    
        'bg-primary': 'var(--bg-primary)', 
        'text-primary': 'var(--text-primary)', 
        'text-secondary': 'var(--text-secondary)', 
        'accent-blue': 'var(--accent-blue)',  
        'status-green': 'var(--status-green)',  
        'status-red': 'var(--status-red)',    
        'status-yellow': 'var(--status-yellow)', 
        'border-primary': 'var(--border-color)',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'main': '12px',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
