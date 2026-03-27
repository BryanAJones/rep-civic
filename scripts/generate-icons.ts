/**
 * Generates PWA icons (192x192 and 512x512) from the Rep. brand system.
 * Uses Playwright to render an HTML page and screenshot at exact sizes.
 * Run: npx playwright test scripts/generate-icons.ts
 */
import { chromium } from '@playwright/test';

const ICON_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: SIZE_TOKENpx;
    height: SIZE_TOKENpx;
    background: #0D1F3C;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .mark {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    color: white;
    font-size: FONT_TOKENpx;
    line-height: 1;
    letter-spacing: -0.02em;
    /* Nudge left slightly to optically center the R+period combo */
    margin-right: NUDGE_TOKENpx;
  }
  .period {
    color: #B8922A;
  }
</style>
</head>
<body>
  <div class="mark">R<span class="period">.</span></div>
</body>
</html>`;

async function generateIcon(size: number, filename: string) {
  const fontSize = Math.round(size * 0.55);
  const nudge = Math.round(size * 0.03);
  const html = ICON_HTML
    .replace(/SIZE_TOKEN/g, String(size))
    .replace(/FONT_TOKEN/g, String(fontSize))
    .replace(/NUDGE_TOKEN/g, String(nudge));

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });

  await page.setContent(html, { waitUntil: 'networkidle' });
  // Wait for font to load
  await page.waitForFunction(() => document.fonts.ready);
  await page.waitForTimeout(500);

  await page.screenshot({
    path: filename,
    type: 'png',
    clip: { x: 0, y: 0, width: size, height: size },
  });

  await browser.close();
  console.log(`Generated ${filename} (${size}x${size})`);
}

async function main() {
  await generateIcon(192, 'public/icon-192.png');
  await generateIcon(512, 'public/icon-512.png');
  console.log('Done.');
}

main().catch(console.error);
