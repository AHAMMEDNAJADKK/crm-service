/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        crm: {
          bg: 'var(--crm-bg)',
          surface: 'var(--crm-surface)',
          'surface-elevated': 'var(--crm-surface-elevated)',
          border: 'var(--crm-border)',
          'border-subtle': 'var(--crm-border-subtle)',
          'text-primary': 'var(--crm-text-primary)',
          'text-secondary': 'var(--crm-text-secondary)',
          'text-muted': 'var(--crm-text-muted)',
          primary: 'var(--crm-primary)',
          'primary-hover': 'var(--crm-primary-hover)',
          'primary-soft': 'var(--crm-primary-soft)',
          accent: 'var(--crm-accent)',
          'accent-soft': 'var(--crm-accent-soft)',
          success: 'var(--crm-success)',
          'success-soft': 'var(--crm-success-soft)',
          warning: 'var(--crm-warning)',
          'warning-soft': 'var(--crm-warning-soft)',
          danger: 'var(--crm-danger)',
          'danger-soft': 'var(--crm-danger-soft)',
        },
        navy: {
          950: '#070b14', // Deepest sidebar / drawer
          900: '#0a0f1d', // App Dark Background
          850: '#0e1628', // Dark Topbar
          800: '#131e35', // Dark Card Surface
          750: '#17243e', // Dark Elevated Surface / Hover
          700: '#1e2f50', // Dark Border
          600: '#2a416e',
          500: '#3b5a96'
        },
        darkBg: '#0a0f1d',
        darkCard: '#131e35',
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#032030'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'Noto Sans Malayalam', 'sans-serif'],
        malayalam: ['Noto Sans Malayalam', 'sans-serif']
      }
    }
  },
  plugins: []
};
