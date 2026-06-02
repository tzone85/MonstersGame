#!/usr/bin/env node
/**
 * Cross-platform diagram renderer. Runs `plantuml` against every .puml in
 * docs/architecture/. Works on Linux, macOS, and Windows (PowerShell / cmd /
 * Git Bash) provided `plantuml` is on PATH.
 *
 *   Windows install:   choco install plantuml      OR scoop install plantuml
 *   macOS  install:    brew install plantuml
 *   Linux install:     apt-get install plantuml
 *
 * Usage:
 *   node scripts/render_diagrams.mjs
 */
import { spawnSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(here, "..", "docs", "architecture");

if (!existsSync(docsDir)) {
  console.error(`No docs/architecture directory at ${docsDir}`);
  process.exit(1);
}

const pumls = readdirSync(docsDir).filter((f) => f.endsWith(".puml"));
if (pumls.length === 0) {
  console.log("No .puml files to render.");
  process.exit(0);
}

const which = spawnSync(process.platform === "win32" ? "where" : "which", ["plantuml"], { stdio: "ignore" });
if (which.status !== 0) {
  console.error("`plantuml` is not on PATH. Install it first:");
  console.error("  Windows: choco install plantuml   or   scoop install plantuml");
  console.error("  macOS:   brew install plantuml");
  console.error("  Linux:   apt-get install plantuml");
  process.exit(2);
}

const result = spawnSync(
  "plantuml",
  ["-tsvg", "-nometadata", ...pumls.map((f) => resolve(docsDir, f))],
  { stdio: "inherit", cwd: docsDir },
);
if (result.status !== 0) process.exit(result.status ?? 1);

const svgs = readdirSync(docsDir).filter((f) => f.endsWith(".svg"));
console.log(`rendered: ${svgs.length} svg file(s)`);
