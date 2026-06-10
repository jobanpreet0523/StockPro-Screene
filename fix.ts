import fs from 'fs';

const file = 'live-data.js';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/24850/g, '24900');
  content = content.replace(/22000/g, '24900');
  fs.writeFileSync(file, content);
}
