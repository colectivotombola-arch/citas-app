#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const base = path.join(__dirname, '..', 'demo');

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = new URL(req.url, 'http://localhost').pathname;
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(base, decodeURIComponent(reqPath));

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      res.statusCode = 500;
      res.end('Server error');
    });
    stream.pipe(res);
  });
});

server.listen(port, () => console.log(`Demo server running at http://localhost:${port}`));
