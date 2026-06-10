const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !['node_modules', 'dist', '.git'].includes(f)) {
      walkDir(dirPath, callback);
    } else if (!isDirectory) {
      if (dirPath.endsWith('.html') || dirPath.endsWith('.js') || dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
        callback(dirPath);
      }
    }
  });
}

walkDir('.', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const replaceMap = {
    '22,400 Call OI Buildup': '24,900 Call OI Buildup',
    '22,402.40': '24,892.50',
    '22402.40': '24892.50',
    '22,400': '24,900',
    '22400': '24900',
    '22,200': '24,700',
    '22200': '24700',
    '22,300': '24,800',
    '22300': '24800',
    '22,500': '25,000',
    '22500': '25000',
    '22,600': '25,100',
    '22600': '25100',
    '22,450': '24,850',
    '22450': '24850',
    '22,550': '24,950',
    '22550': '24950',
    '47,820.10': '52,341.20',
    '47820.10': '52341.20'
  };

  for (const [key, val] of Object.entries(replaceMap)) {
    if (content.includes(key)) {
      content = content.split(key).join(val);
      changed = true;
    }
  }

  // Also catch '22200-22600' etc
  if (content.includes('22200-22600')) {
     content = content.replace(/22200-22600/g, '24700-25100');
     changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
});
