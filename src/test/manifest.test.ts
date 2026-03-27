// @vitest-environment node
/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const manifestPath = resolve(__dirname, '../../public/manifest.webmanifest');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

describe('PWA manifest', () => {
  it('has the correct start_url', () => {
    expect(manifest.start_url).toBe('/app/feed');
  });

  it('uses standalone display mode', () => {
    expect(manifest.display).toBe('standalone');
  });

  it('has the navy theme_color', () => {
    expect(manifest.theme_color).toBe('#0D1F3C');
  });

  it('has required icon sizes (192 and 512)', () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('has the correct app name', () => {
    expect(manifest.name).toBe('Rep.');
    expect(manifest.short_name).toBe('Rep.');
  });
});
