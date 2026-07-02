import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// [src svg, out png, width px]
const jobs = [
  ['brand/icon.svg', 'mobile/assets/icon.png', 1024], // iOS + base
  ['brand/mark.svg', 'mobile/assets/adaptive-icon.png', 1024], // Android foreground (transparent)
  ['brand/mark-mono.svg', 'mobile/assets/monochrome.png', 1024], // Android 13+ themed
  ['brand/mark-mono.svg', 'mobile/assets/notification-icon.png', 96], // white silhouette
  ['brand/mark.svg', 'mobile/assets/splash-icon.png', 512], // splash (transparent)
  ['brand/icon.svg', 'admin/app/icon.png', 512], // Next.js favicon
  ['brand/icon.svg', 'admin/app/apple-icon.png', 180], // Next.js apple touch
];

for (const [src, out, width] of jobs) {
  const svg = readFileSync(src, 'utf8');
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, png);
  console.log(`✓ ${out} (${width}px)`);
}
