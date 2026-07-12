import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(rootDirectory, 'dist');
const outputFileName = 'index.html';
const outputPath = path.join(distDirectory, outputFileName);
const entries = [...await readdir(distDirectory)].sort();

if (entries.length !== 1 || entries[0] !== outputFileName) {
  throw new Error(`Expected dist/ to contain only ${outputFileName}; found: ${entries.join(', ')}`);
}

const html = await readFile(outputPath, 'utf8');

if (!/<style\b/i.test(html)) {
  throw new Error('Expected dist/index.html to contain inline CSS.');
}

if (!/<script\b/i.test(html)) {
  throw new Error('Expected dist/index.html to contain inline JavaScript.');
}

if (/<script\b[^>]*\bsrc=/i.test(html)) {
  throw new Error('Expected dist/index.html not to reference external JavaScript files.');
}

if (/<link\b[^>]*rel=["']stylesheet["']/i.test(html)) {
  throw new Error('Expected dist/index.html not to reference external CSS files.');
}

for (const forbiddenReference of ['support.js', '_ds_bundle.js', 'example/']) {
  if (html.includes(forbiddenReference)) {
    throw new Error(`Expected dist/index.html not to reference ${forbiddenReference}.`);
  }
}
