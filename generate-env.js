const fs = require('fs');
const path = require('path');

const apiBase = process.env.API_BASE || 'http://localhost:3000/api';

const content = `window.__ENV = { API_BASE: ${JSON.stringify(apiBase)} };`;

const outPath = path.join(__dirname, 'frontend', 'env.js');
fs.writeFileSync(outPath, content);
console.log('Wrote', outPath, 'with API_BASE =', apiBase);
