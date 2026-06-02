# PowerShell wrapper — delegates to the Node renderer for cross-platform parity.
# Run from any directory.
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $scriptDir "render_diagrams.mjs")
