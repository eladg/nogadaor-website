// יוצר את favicon.ico ו-apple-touch-icon.png מתוך public/favicon.svg (בדיקת SEO, 2026-11-08).
// להריץ מחדש אם משנים את favicon.svg:  node drafts/make-favicons.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile('public/favicon.svg');

// אייקון לאייפון: רקע מלא (בלי שקיפות), 180×180
await sharp(svg, { density: 600 }).resize(180, 180).flatten({ background: '#0b1a33' }).png().toFile('public/apple-touch-icon.png');

// favicon.ico: קובץ ICO שמכיל שלוש תמונות PNG (16, 32, 48)
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => sharp(svg, { density: 600 }).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);
const entries = [];
let offset = 6 + 16 * sizes.length;
pngs.forEach((png, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0); // width
  e.writeUInt8(sizes[i], 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  entries.push(e);
});
await writeFile('public/favicon.ico', Buffer.concat([header, ...entries, ...pngs]));
console.log('favicon.ico + apple-touch-icon.png נוצרו');
