const fs = require('fs');
const path = require('path');

const backendUrl = process.env.BACKEND_URL || '';
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Substitui o placeholder pelo valor real
html = html.replace(
  /<script>\s*\/\/ CONFIGURE BACKEND URL HERE FOR PRODUCTION\s*[\s\S]*?<\/script>/,
  `<script>window.BACKEND_URL = "${backendUrl}";</script>`
);

fs.writeFileSync(indexPath, html);
console.log('✅ BACKEND_URL injetada:', backendUrl);