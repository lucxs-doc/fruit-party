const fs = require('fs');
const path = require('path');

const backendUrl = process.env.BACKEND_URL || '';
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Substitui o placeholder pelo valor real
html = html.replace(
  /const BACKEND_URL = '';/,
  `const BACKEND_URL = "${backendUrl}";`
);

fs.writeFileSync(indexPath, html);
console.log('✅ BACKEND_URL injetada:', backendUrl);