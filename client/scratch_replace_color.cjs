const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (filepath.endsWith('.tsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace gruvbox-blue with gruvbox-orange
  content = content.replace(/gruvbox-blue_light/g, 'gruvbox-orange_light');
  content = content.replace(/gruvbox-blue/g, 'gruvbox-orange');
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
