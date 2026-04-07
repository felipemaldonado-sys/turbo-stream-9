#!/usr/bin/env bash
# Arranque local fiable: borra .next y levanta Next en un puerto fijo.
# Uso: npm run dev:go   (desde la raíz del repo)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-3333}"
NEXT_BIN="$ROOT/node_modules/.bin/next"

echo ""
echo "  [turbo-stream] Carpeta: $ROOT"
echo "  [turbo-stream] Borrando .next/ … (si es grande, puede tardar un minuto; es normal)"
rm -rf .next
echo "  [turbo-stream] .next/ eliminado."
echo "  [turbo-stream] Borrando node_modules/.cache/ …"
rm -rf node_modules/.cache
echo "  [turbo-stream] Caché de tooling lista."

if [ ! -f "$NEXT_BIN" ]; then
  echo "  [turbo-stream] ERROR: no está $NEXT_BIN — ejecuta primero: npm install"
  exit 1
fi

echo "  [turbo-stream] Iniciando servidor → http://localhost:${PORT}/viewer"
echo ""
exec "$NEXT_BIN" dev -p "$PORT"
