/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gruvbox: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          bg0_h: 'rgb(var(--color-bg0_h) / <alpha-value>)',
          bg0_s: 'rgb(var(--color-bg0_s) / <alpha-value>)',
          bg1: 'rgb(var(--color-bg1) / <alpha-value>)',
          bg2: 'rgb(var(--color-bg2) / <alpha-value>)',
          bg3: 'rgb(var(--color-bg3) / <alpha-value>)',
          bg4: 'rgb(var(--color-bg4) / <alpha-value>)',
          fg: 'rgb(var(--color-fg) / <alpha-value>)',
          fg0: 'rgb(var(--color-fg0) / <alpha-value>)',
          fg1: 'rgb(var(--color-fg1) / <alpha-value>)',
          fg2: 'rgb(var(--color-fg2) / <alpha-value>)',
          fg3: 'rgb(var(--color-fg3) / <alpha-value>)',
          fg4: 'rgb(var(--color-fg4) / <alpha-value>)',
          gray: 'rgb(var(--color-gray) / <alpha-value>)',
          red: 'rgb(var(--color-red) / <alpha-value>)',
          red_light: 'rgb(var(--color-red_light) / <alpha-value>)',
          green: 'rgb(var(--color-green) / <alpha-value>)',
          green_light: 'rgb(var(--color-green_light) / <alpha-value>)',
          yellow: 'rgb(var(--color-yellow) / <alpha-value>)',
          yellow_light: 'rgb(var(--color-yellow_light) / <alpha-value>)',
          blue: 'rgb(var(--color-blue) / <alpha-value>)',
          blue_light: 'rgb(var(--color-blue_light) / <alpha-value>)',
          purple: 'rgb(var(--color-purple) / <alpha-value>)',
          purple_light: 'rgb(var(--color-purple_light) / <alpha-value>)',
          aqua: 'rgb(var(--color-aqua) / <alpha-value>)',
          aqua_light: 'rgb(var(--color-aqua_light) / <alpha-value>)',
          orange: 'rgb(var(--color-orange) / <alpha-value>)',
          orange_light: 'rgb(var(--color-orange_light) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
