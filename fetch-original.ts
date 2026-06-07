import fs from 'fs';
import path from 'path';

const filesToFetch = [
  'index.html',
  'dashboard.html',
  'fo.html',
  'index.js',
  'live-data.js',
  'styles.css',
  'logo.png',
  'favicon.ico'
];

async function fetchFromRepo() {
  const repoBaseUrl = 'https://raw.githubusercontent.com/jobanpreet0523/stockpro-screener/main';
  console.log('Fetching files from:', repoBaseUrl);

  for (const file of filesToFetch) {
    try {
      const url = `${repoBaseUrl}/${file}`;
      const response = await fetch(url);
      if (response.ok) {
        let content: string | Buffer;
        if (file.endsWith('.png') || file.endsWith('.ico')) {
          const arrayBuffer = await response.arrayBuffer();
          content = Buffer.from(arrayBuffer);
          console.log(`Fetched binary: ${file} (${content.length} bytes)`);
          fs.writeFileSync(path.join(process.cwd(), file), content);
        } else {
          content = await response.text();
          console.log(`Fetched text: ${file} (${content.length} characters)`);
          fs.writeFileSync(path.join(process.cwd(), file), content);
        }
      } else {
        console.warn(`File not found or failed to fetch: ${file} (Status: ${response.status})`);
      }
    } catch (error) {
      console.error(`Error fetching ${file}:`, error);
    }
  }
}

fetchFromRepo();
