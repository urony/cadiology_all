// ממיר את האיורים החדשים מתיקיית "איורים ללב" ל-WebP בתיקיית art (דורש ffmpeg)
// שימוש: node tools/convert_art.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(root, '..', 'איורים ללב');
// [קובץ מקור (תחילית), שם ב-art, רוחב מרבי]
const MAP = [
  // כל שורה: ['תחילית שם הקובץ במקור או חלק ממנו', 'שם בתיקיית art (בלי סיומת)', רוחב מרבי]
  // מתמלא אחרי שמזהים כל תמונה. למשל: ['9c3f1a', 'anat_heart', 1100],
];
const files = fs.readdirSync(src);
for (const [pre, name, w] of MAP) {
  const f = files.find(x => x.startsWith(pre));
  if (!f) { console.log('חסר:', pre); continue; }
  const out = path.join(root, 'art', name + '.webp');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(src, f), '-vf', `scale='min(${w},iw)':-2`, '-quality', '82', out]);
  console.log(name, Math.round(fs.statSync(out).size / 1024) + ' KB');
}
