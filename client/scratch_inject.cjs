const fs = require('fs');

const cssVars = `
@layer base {
  :root {
    --color-bg: 251 241 199;
    --color-bg0_h: 249 245 215;
    --color-bg0_s: 242 229 188;
    --color-bg1: 235 219 178;
    --color-bg2: 213 196 161;
    --color-bg3: 189 174 147;
    --color-bg4: 168 153 132;
    --color-fg: 60 56 54;
    --color-fg0: 40 40 40;
    --color-fg1: 60 56 54;
    --color-fg2: 80 73 69;
    --color-fg3: 102 92 84;
    --color-fg4: 124 111 100;
    --color-gray: 146 131 116;
    --color-red: 204 36 29;
    --color-red_light: 157 0 6;
    --color-green: 152 151 26;
    --color-green_light: 121 116 14;
    --color-yellow: 215 153 33;
    --color-yellow_light: 181 118 20;
    --color-blue: 69 133 136;
    --color-blue_light: 7 102 120;
    --color-purple: 177 98 134;
    --color-purple_light: 143 63 113;
    --color-aqua: 104 157 106;
    --color-aqua_light: 66 123 88;
    --color-orange: 214 93 14;
    --color-orange_light: 175 58 3;
  }

  .dark {
    --color-bg: 40 40 40;
    --color-bg0_h: 29 32 33;
    --color-bg0_s: 50 48 47;
    --color-bg1: 60 56 54;
    --color-bg2: 80 73 69;
    --color-bg3: 102 92 84;
    --color-bg4: 124 111 100;
    --color-fg: 235 219 178;
    --color-fg0: 251 241 199;
    --color-fg1: 235 219 178;
    --color-fg2: 213 196 161;
    --color-fg3: 189 174 147;
    --color-fg4: 168 153 132;
    --color-gray: 146 131 116;
    --color-red: 204 36 29;
    --color-red_light: 251 73 52;
    --color-green: 152 151 26;
    --color-green_light: 184 187 38;
    --color-yellow: 215 153 33;
    --color-yellow_light: 250 189 47;
    --color-blue: 50 93 102;
    --color-blue_light: 66 123 130;
    --color-purple: 177 98 134;
    --color-purple_light: 211 134 155;
    --color-aqua: 104 157 106;
    --color-aqua_light: 142 192 124;
    --color-orange: 214 93 14;
    --color-orange_light: 254 128 25;
  }
}
`;

const indexCssPath = './src/index.css';
let indexCss = fs.readFileSync(indexCssPath, 'utf8');
if (!indexCss.includes('@layer base')) {
  indexCss = indexCss + '\n' + cssVars;
  fs.writeFileSync(indexCssPath, indexCss);
  console.log('Injected variables into index.css');
}

const twConfigPath = './tailwind.config.js';
const newConfig = `/** @type {import('tailwindcss').Config} */
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
`;
fs.writeFileSync(twConfigPath, newConfig);
console.log('Updated tailwind.config.js');
