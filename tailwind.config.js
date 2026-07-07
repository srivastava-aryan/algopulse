/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e0f',
        panel: '#0f1517',
        line: '#1c2628',
        cyan: '#5eead4',
        cyanDim: '#2dd4bf',
        text: '#d6e2e0',
        dim: '#7a8c8a',
        easy: '#5eead4',
        medium: '#f0c674',
        hard: '#f07178',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
