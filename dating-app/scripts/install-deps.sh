#!/usr/bin/env bash
set -e

# install-deps.sh
# Limpia variables de proxy comunes y asegura que npm use el registro público antes de instalar

echo "[install-deps] Limpiando variables de proxy de entorno..."
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY npm_config_http_proxy npm_config_https_proxy

# Eliminar configuración de proxy en npm si existe
npm config delete proxy || true
npm config delete https-proxy || true

# Apuntar al registro público de npm
npm config set registry https://registry.npmjs.org/

# Informar al usuario
echo "[install-deps] Instalando dependencias con 'npm install'..."

# Recomiendo usar 'npm ci' si tienes package-lock.json, pero usamos npm install para compatibilidad
npm install

echo "[install-deps] Instalación finalizada."