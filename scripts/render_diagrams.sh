#!/usr/bin/env bash
# Thin POSIX wrapper — delegates to the Node renderer for cross-platform parity.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/render_diagrams.mjs"
