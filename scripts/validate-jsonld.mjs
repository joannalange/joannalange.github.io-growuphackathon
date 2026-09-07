import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = 'dist/client';
const JSONLD_PATTERN = /<script type="application\/ld\+json">(.*?)<\/script>/gs;

function findHtmlFiles(dir) {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? findHtmlFiles(path) : path.endsWith('.html') ? [path] : [];
  });
}

let errorCount = 0;

for (const file of findHtmlFiles(DIST_DIR)) {
  const html = readFileSync(file, 'utf-8');
  for (const match of html.matchAll(JSONLD_PATTERN)) {
    try {
      JSON.parse(match[1]);
    } catch (err) {
      errorCount += 1;
      console.error(`Invalid JSON-LD in ${file}: ${err.message}`);
    }
  }
}

if (errorCount > 0) {
  console.error(`\n${errorCount} invalid JSON-LD block(s) found.`);
  process.exit(1);
}

console.log('All JSON-LD blocks are valid JSON.');
