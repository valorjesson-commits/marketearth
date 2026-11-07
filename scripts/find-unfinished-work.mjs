import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const failOnMatch = process.argv.includes("--fail-on-match");

const includedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mo",
  ".md",
  ".json",
  ".yml",
  ".yaml",
]);

const excludedDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  ".old",
]);

const excludedFiles = new Set([
  "pnpm-lock.yaml",
  "mops.lock",
  "skills-lock.json",
]);

const markerTokens = ["TO" + "DO", "FIX" + "ME", "T" + "BD", "X" + "XX"];
const markerRegex = new RegExp(`\\b(${markerTokens.join("|")})\\b`, "g");

async function* walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (excludedDirectories.has(entry.name)) {
        continue;
      }
      yield* walk(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (excludedFiles.has(entry.name)) {
      continue;
    }

    if (!includedExtensions.has(path.extname(entry.name))) {
      continue;
    }

    yield fullPath;
  }
}

const matches = [];

for await (const filePath of walk(root)) {
  const text = await readFile(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    markerRegex.lastIndex = 0;
    if (markerRegex.test(line)) {
      matches.push({
        file: path.relative(root, filePath),
        line: i + 1,
        content: line.trim(),
      });
    }
  }
}

if (matches.length === 0) {
  console.log("No unfinished markers found.");
  process.exit(0);
}

for (const match of matches) {
  console.log(`${match.file}:${match.line}: ${match.content}`);
}

console.log(`\nFound ${matches.length} unfinished marker(s).`);
if (failOnMatch) {
  process.exit(1);
}
