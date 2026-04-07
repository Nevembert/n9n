import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve('scripts/rebrand-legacy-to-n9n.mjs');

test('dry-run reports candidate replacements and does not modify files', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rebrand-test-'));
  const sourceFile = path.join(tmpDir, 'README.md');
  const reportFile = path.join(tmpDir, 'report.json');

  await fs.writeFile(sourceFile, 'n8n is here\n@n8n/pkg stays\n', 'utf8');

  await execFileAsync(process.execPath, [scriptPath, `--scope=${sourceFile}`, `--report=${reportFile}`], {
    cwd: tmpDir,
  });

  const after = await fs.readFile(sourceFile, 'utf8');
  const report = JSON.parse(await fs.readFile(reportFile, 'utf8'));

  assert.equal(after, 'n8n is here\n@n8n/pkg stays\n');
  assert.equal(report.mode, 'dry-run');
  assert.equal(report.filesChanged, 1);
});

test('apply mode replaces plain n8n while protecting @n8n scope', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rebrand-test-'));
  const sourceFile = path.join(tmpDir, 'notes.md');
  const reportFile = path.join(tmpDir, 'report.json');

  await fs.writeFile(sourceFile, 'n8n docs\nN8N docs\n@n8n/core\n', 'utf8');

  await execFileAsync(process.execPath, [scriptPath, '--write', `--scope=${sourceFile}`, `--report=${reportFile}`], {
    cwd: tmpDir,
  });

  const after = await fs.readFile(sourceFile, 'utf8');
  assert.match(after, /n9n docs/);
  assert.match(after, /N9N docs/);
  assert.match(after, /@n8n\/core/);
});
