// בדיקת תקינות למחולל המטופלים (א.ק.ג ובדיקות דם): לכל אבחנה, N מטופלים בשני מצבים (קלאסי וגבולי).
// בודקים: (1) המסווג מחזיר את האבחנה הנכונה, (2) הכולסטרול הכללי עקבי ל-LDL+HDL+TG/5, (3) הממצא המכריע
// נכון רק לאבחנה שלו (כדי שבשאלת "מה הממצא שהכריע" לא יהיו שתי תשובות נכונות).
// שימו לב: הטווחים והמסווג נכתבו יחד, ולכן הבדיקה מוכיחה עקביות פנימית ולא נכונות רפואית.
// הרצה:  node tools/validate_labs.mjs [N]     (ברירת מחדל 2000)
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const N = +process.argv[2] || 2000;
const ctx = { URLSearchParams, Math, JSON, Object, Array, Date, Number, String, Set, Map, Promise, Error, location: { search: '', hash: '' }, document: { addEventListener() { }, head: { appendChild() { } }, body: { appendChild() { }, classList: { toggle() { } } }, documentElement: { dataset: {} }, createElement() { return { content: {}, style: {} }; } }, window: {}, localStorage: { getItem() { return null; }, setItem() { } }, navigator: {}, console };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['core.js', 'data.js', 'labgen.js']) {
  const src = fs.readFileSync(path.join(root, 'src', f), 'utf8');
  vm.runInContext(src + '\n;' + (f === 'labgen.js' ? 'this.__x={CTYPES,CT,genCard,classifyCard,KEYF,mulberry32};' : ''), ctx, { filename: f });
}
const { CTYPES, genCard, classifyCard, KEYF, mulberry32 } = ctx.__x;
let bad = 0; const rows = [];
for (const mode of [false, true]) {
  const r = mulberry32(mode ? 777 : 123);
  for (const t of CTYPES) {
    let ok = 0, tcBad = 0, keyBad = 0, uniq = 0; const miss = {};
    for (let i = 0; i < N; i++) {
      const p = genCard(t, r, { edge: mode });
      const c = classifyCard(p); if (c === t) ok++; else miss[c] = (miss[c] || 0) + 1;
      const v = p.vals; if (Math.abs(v.TCHOL - (v.LDL + v.HDL + v.TG / 5)) > 1.01) tcBad++;
      if (!KEYF[t].ok(p)) keyBad++;
      const others = CTYPES.filter(o => o !== t && KEYF[o].ok(p)).length; if (others === 0) uniq++;
    }
    rows.push({ מצב: mode ? 'גבולי' : 'קלאסי', אבחנה: t, מטופלים: N, 'סיווג נכון': (100 * ok / N).toFixed(2) + '%', 'כולסטרול לא עקבי': tcBad, 'ממצא מכריע שגוי': keyBad, 'ממצא ייחודי': (100 * uniq / N).toFixed(2) + '%', טעויות: JSON.stringify(miss) });
    if (ok !== N || tcBad || keyBad || uniq !== N) bad++;
  }
}
console.table(rows);
console.log(bad ? `נמצאו ${bad} שורות עם בעיה` : `הכול תקין: ${N} מטופלים × ${CTYPES.length} אבחנות × 2 מצבים`);
process.exit(bad ? 1 : 0);
