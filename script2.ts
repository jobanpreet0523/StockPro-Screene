import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.css'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;
  content = content.replace(/24,900/g, '24,900');
  content = content.replace(/24,700/g, '24,700');
  content = content.replace(/24,800/g, '24,800');
  content = content.replace(/25,000/g, '25,000');
  content = content.replace(/25,100/g, '25,100');
  content = content.replace(/24900/g, '24900');
  content = content.replace(/24700/g, '24700');
  content = content.replace(/24800/g, '24800');
  content = content.replace(/25000/g, '25000');
  content = content.replace(/25100/g, '25100');
  content = content.replace(/22,402\.40/g, '24,892.50');
  content = content.replace(/22402\.40/g, '24892.50');
  content = content.replace(/47,820\.10/g, '52,341.20');
  content = content.replace(/47820\.10/g, '52341.20');
  content = content.replace(/47,820/g, '52,341'); // just in case
  content = content.replace(/24,850/g, '24,850');
  content = content.replace(/24,950/g, '24,950');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
