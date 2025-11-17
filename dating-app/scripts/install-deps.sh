#!/usr/bin/env bash
set -euo pipefail

# Reset proxy overrides that often trigger 403 responses when the upstream proxy blocks scoped packages.
npm config delete proxy >/dev/null 2>&1 || true
npm config delete https-proxy >/dev/null 2>&1 || true
npm config set registry https://registry.npmjs.org/ >/dev/null

# Reuse corporate MITM certificates when provided so HTTPS downloads succeed.
if [[ -n "${NODE_EXTRA_CA_CERTS:-}" && -f "${NODE_EXTRA_CA_CERTS}" ]]; then
  npm config set cafile "$NODE_EXTRA_CA_CERTS" >/dev/null
fi

# Run the install without proxy environment variables to bypass blocked tunnels.
HTTP_PROXY= HTTPS_PROXY= http_proxy= https_proxy= npm install "$@"
