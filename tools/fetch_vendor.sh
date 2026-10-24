#!/usr/bin/env sh
# Descarga three.js r147 (MIT) desde npm a vendor/ para las pruebas sin conexión al CDN.
set -e
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
(cd "$tmp" && npm pack three@0.147.0 --silent >/dev/null && tar -xzf three-0.147.0.tgz)
mkdir -p vendor
cp "$tmp/package/build/three.min.js" vendor/
cp "$tmp/package/examples/js/controls/OrbitControls.js" vendor/
cp "$tmp/package/examples/js/environments/RoomEnvironment.js" vendor/
rm -rf "$tmp"
echo "three.js r147 copiado en vendor/"
