import fs from 'fs';

const files = ['index.html', 'fo.html', 'dashboard.html', 'live-data.js'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/24,900/g, '24,900');
  content = content.replace(/24,700/g, '24,700');
  content = content.replace(/24,800/g, '24,800');
  content = content.replace(/25,000/g, '25,000');
  content = content.replace(/25,100/g, '25,100');
  content = content.replace(/22,402\.40/g, '24,892.50');
  content = content.replace(/47,820\.10/g, '52,341.20');
  content = content.replace(/24,850/g, '24,850');
  content = content.replace(/24,950/g, '24,950');
  fs.writeFileSync(file, content);
});

console.log('Done replacing in root html files');
