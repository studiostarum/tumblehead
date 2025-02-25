#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('Verifying build output...');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory does not exist. Run npm run build first.');
  process.exit(1);
}

// Check for bundle.min.js
const bundleJsPath = path.join(distDir, 'bundle.min.js');
if (!fs.existsSync(bundleJsPath)) {
  console.error('❌ bundle.min.js not found in dist directory.');
  process.exit(1);
}

// Check for bundle.min.css
const bundleCssPath = path.join(distDir, 'bundle.min.css');
if (!fs.existsSync(bundleCssPath)) {
  console.error('❌ bundle.min.css not found in dist directory.');
  process.exit(1);
}

console.log('✅ Build verification successful!');
console.log(`Found bundle.min.js (${(fs.statSync(bundleJsPath).size / 1024).toFixed(2)} KB)`);
console.log(`Found bundle.min.css (${(fs.statSync(bundleCssPath).size / 1024).toFixed(2)} KB)`);
console.log('\nYou can now deploy the dist/ folder to Cloudflare.');
console.log('Your files will be accessible at:');
console.log('- {domain}/dist/bundle.min.js');
console.log('- {domain}/dist/bundle.min.css'); 