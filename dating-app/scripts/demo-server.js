#!/usr/bin/env node
const http = require('http');
const path = require('path');
const fs = require('fs');

const demoRoot = path.join(__dirname, '..', 'public', 'demo');
const indexPath = path.join(demoRoot, 'index.html');
const cssPath = path.join(demoRoot, 'style.css');

const checkMode = process.argv.includes('--check');
if (checkMode) {
  if (!fs.existsSync(indexPath) || !fs.existsSync(cssPath)) {
    console.error('Demo assets missing; ensure public/demo exists.');
    process.exit(1);
  }
  console.log('Demo assets ready. Run "npm run demo" to start the offline preview.');
  process.exit(0);
}

const port = process.env.PORT || 3000;

const serveFile = (res, filePath, contentType) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

const server = http.createServer((req, res) => {
  const cleanPath = req.url.split('?')[0];
  if (cleanPath === '/style.css') {
    return serveFile(res, cssPath, 'text/css');
  }
  return serveFile(res, indexPath, 'text/html');
});

server.listen(port, () => {
  console.log(`Modo demo activo en http://localhost:${port}`);
  console.log('Usa Ctrl+C para detenerlo.');
});
