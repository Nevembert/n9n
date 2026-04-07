#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const write = args.has('--write');
const scopeArg = process.argv.slice(2).find((arg) => arg.startsWith('--scope='));
const reportArg = process.argv.slice(2).find((arg) => arg.startsWith('--report='));
const reportPath = path.resolve(root, reportArg ? reportArg.split('=')[1] : 'rebrand-report.json');

const scopes = (scopeArg ? scopeArg.split('=')[1].split(',') : ['README.md', 'REBRANDING.md', 'openclaw', 'scripts'])
  .map((part) => part.trim())
  .filter(Boolean);

const includeExtensions = new Set(['.md', '.json', '.yml', '.yaml', '.txt', '.mjs', '.cjs', '.js', '.ts']);
const protectedPatterns = [/@n8n\//g, /n8n-io/g, /n8n\.io/g, /\/n8n\//g, /filter=n8n-playwright/g];

function replaceUnprotected(content) {
  const protectedTokens = [];
  let masked = content;

  for (const pattern of protectedPatterns) {
    masked = masked.replace(pattern, (match) => {
      const token = `__PROTECTED_${protectedTokens.length}__`;
      protectedTokens.push(match);
      return token;
    });
  }

  const replaced = masked.replace(/\bn8n\b/g, 'n9n').replace(/\bN8N\b/g, 'N9N');

  return protectedTokens.reduce(
    (result, value, index) => result.replace(`__PROTECTED_${index}__`, value),
    replaced
  );
}

async function collectFiles(targetPath, list) {
  const stat = await fs.stat(targetPath);
  if (stat.isFile()) {
    if (includeExtensions.has(path.extname(targetPath))) {
      list.push(targetPath);
    }
    return;
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    await collectFiles(path.join(targetPath, entry.name), list);
  }
}

const files = [];
for (const scope of scopes) {
  const targetPath = path.resolve(root, scope);
  try {
    await collectFiles(targetPath, files);
  } catch {
    // Ignore missing scopes
  }
}

const uniqueFiles = [...new Set(files)];
const changes = [];

for (const filePath of uniqueFiles) {
  const before = await fs.readFile(filePath, 'utf8');
  const after = replaceUnprotected(before);
  if (before === after) continue;

  const relativePath = path.relative(root, filePath);
  changes.push({ file: relativePath, replacements: (before.match(/\bn8n\b/g) ?? []).length - (after.match(/\bn8n\b/g) ?? []).length });
  if (write) await fs.writeFile(filePath, after, 'utf8');
}

await fs.writeFile(reportPath, `${JSON.stringify({ mode: write ? 'write' : 'dry-run', scopes, filesScanned: uniqueFiles.length, filesChanged: changes.length, changes }, null, 2)}\n`, 'utf8');
console.log(`${write ? 'Applied' : 'Detected'} ${changes.length} file(s). Report: ${reportPath}`);
