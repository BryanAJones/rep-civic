/// <reference types="node" />
// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function collectTsFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'test' || entry === 'services') continue;
    if (statSync(full).isDirectory()) {
      collectTsFiles(full, files);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.includes('.test.')) {
      files.push(full);
    }
  }
  return files;
}

describe('architecture import guards', () => {
  const srcDir = join(__dirname, '..');
  const componentFiles = collectTsFiles(srcDir);

  it('no component imports civicApi directly', () => {
    const violations: string[] = [];
    for (const file of componentFiles) {
      const content = readFileSync(file, 'utf-8');
      if (/from\s+['"].*services\/civicApi/.test(content)) {
        violations.push(relative(srcDir, file));
      }
    }
    expect(violations).toEqual([]);
  });

  it('no component imports mockData directly', () => {
    const violations: string[] = [];
    for (const file of componentFiles) {
      const content = readFileSync(file, 'utf-8');
      if (/from\s+['"].*services\/mockData/.test(content)) {
        violations.push(relative(srcDir, file));
      }
    }
    expect(violations).toEqual([]);
  });
});
