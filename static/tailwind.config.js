module.exports = {
  darkMode: 'class',
  content: ['../templates/*.html'],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    extend: {
      colors: {
        'dark': '#101a23',
        'dark-2': '#182734'
      },
    },
    fontFamily: {
      'lato': ['Lato', 'sans-serif'],
      'yanone-kaffeesatz': ['Yanone Kaffeesatz', 'sans-serif'],
      'noto-sans': ['Noto Sans', 'sans-serif']
    }
  },
  plugins: [],
};