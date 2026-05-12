const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
};

const darkMode = {
  bg: '#282828',
  bg0_h: '#1d2021',
  bg0_s: '#32302f',
  bg1: '#3c3836',
  bg2: '#504945',
  bg3: '#665c54',
  bg4: '#7c6f64',
  fg: '#ebdbb2',
  fg0: '#fbf1c7',
  fg1: '#ebdbb2',
  fg2: '#d5c4a1',
  fg3: '#bdae93',
  fg4: '#a89984',
  gray: '#928374',
  red: '#cc241d',
  red_light: '#fb4934',
  green: '#98971a',
  green_light: '#b8bb26',
  yellow: '#d79921',
  yellow_light: '#fabd2f',
  blue: '#325d66',
  blue_light: '#427b82',
  purple: '#b16286',
  purple_light: '#d3869b',
  aqua: '#689d6a',
  aqua_light: '#8ec07c',
  orange: '#d65d0e',
  orange_light: '#fe8019',
};

const lightMode = {
  bg: '#fbf1c7',
  bg0_h: '#f9f5d7',
  bg0_s: '#f2e5bc',
  bg1: '#ebdbb2',
  bg2: '#d5c4a1',
  bg3: '#bdae93',
  bg4: '#a89984',
  fg: '#3c3836',
  fg0: '#282828',
  fg1: '#3c3836',
  fg2: '#504945',
  fg3: '#665c54',
  fg4: '#7c6f64',
  gray: '#928374',
  red: '#cc241d',
  red_light: '#9d0006',
  green: '#98971a',
  green_light: '#79740e',
  yellow: '#d79921',
  yellow_light: '#b57614',
  blue: '#458588',
  blue_light: '#076678',
  purple: '#b16286',
  purple_light: '#8f3f71',
  aqua: '#689d6a',
  aqua_light: '#427b58',
  orange: '#d65d0e',
  orange_light: '#af3a03',
};

console.log(':root {');
for (const [k, v] of Object.entries(lightMode)) {
  console.log(`  --color-${k}: ${hexToRgb(v)};`);
}
console.log('}\n\n.dark {');
for (const [k, v] of Object.entries(darkMode)) {
  console.log(`  --color-${k}: ${hexToRgb(v)};`);
}
console.log('}');
