#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const demoServerPath = path.join(__dirname, 'demo-server.js');

const startDemo = () => {
  console.warn('\nNo se detectaron dependencias instaladas. Iniciando modo demo offline...');
  const demo = spawn(process.execPath, [demoServerPath], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.PORT || '3000' },
  });
  demo.on('exit', (code) => process.exit(code ?? 0));
};

const nextPackage = (() => {
  try {
    return require.resolve('next/package.json');
  } catch (err) {
    return null;
  }
})();

if (!nextPackage) {
  startDemo();
  return;
}

const nextBin = path.join(process.cwd(), 'node_modules', '.bin', 'next');
if (!fs.existsSync(nextBin)) {
  startDemo();
  return;
}

const args = process.argv.slice(2);
const nextProcess = spawn(nextBin, ['dev', ...args], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '3000' },
});

nextProcess.on('exit', (code) => process.exit(code ?? 0));
