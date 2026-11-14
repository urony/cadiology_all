// מחליף ניסוחים בקוד המקור (מיועד לאיזון אורך התשובות הנכונות). כל זוג: [מחרוזת ישנה, מחרוזת חדשה].
// שימוש: node tools/apply_pairs.mjs <קובץ.json> ; הקובץ הוא מערך של {file, pairs:[[old,new],...]}.
// אם מחרוזת ישנה לא נמצאה, או נמצאה יותר מפעם אחת, הכלי מדווח ולא משנה אותה.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let bad = 0, done = 0;
for (const { file, pairs } of plan) {
  const fp = path.join(root, 'src', file); let s = fs.readFileSync(fp, 'utf8');
  for (const [a, b] of pairs) {
    const n = s.split(a).length - 1;
    if (n !== 1) { console.log(`✗ ${file}: ${n} מופעים: ${a.slice(0, 60)}`); bad++; continue; }
    s = s.replace(a, () => b); done++;
  }
  fs.writeFileSync(fp, s);
}
console.log(`הוחלפו ${done}, בעיות ${bad}`);
process.exit(bad ? 1 : 0);
