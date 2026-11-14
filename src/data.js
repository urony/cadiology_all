'use strict';
/* ===== מדדי מעבדה, תגיות נושא ועזרים (קרדיולוגיה) =====
   הטווחים הם טווחי מעבדה מקובלים להמחשה. הם משתנים בין מעבדות.
   BOOK_RANGE: ערכי "בבחינה", כפי שמופיעים בספר המגמה הרשמי והתוכנית (LDL מתחת ל-100, HDL מעל 40, טריגליצרידים מתחת ל-150). */
const LAB = {
  TROP: { n: 'טרופונין לבבי (Troponin)', u: 'ng/L', d: 0, r: [0, 14] },
  TCHOL: { n: 'כולסטרול כללי', u: 'mg/dL', d: 0, r: [0, 200] },
  LDL: { n: 'LDL ("הכולסטרול הרע")', u: 'mg/dL', d: 0, r: [0, 100] },
  HDL: { n: 'HDL ("הכולסטרול הטוב")', u: 'mg/dL', d: 0, r: [40, 100] },
  TG: { n: 'טריגליצרידים (Triglycerides)', u: 'mg/dL', d: 0, r: [0, 150] },
  GLU: { n: 'גלוקוז בדם (בצום)', u: 'mg/dL', d: 0, r: [70, 100] },
  K: { n: 'אשלגן (K⁺)', u: 'mmol/L', d: 1, r: [3.5, 5.1] },
  NA: { n: 'נתרן (Na⁺)', u: 'mmol/L', d: 0, r: [135, 145] },
  CREA: { n: 'קריאטינין (Creatinine)', u: 'mg/dL', d: 1, r: { M: [0.7, 1.3], F: [0.6, 1.1] } },
  Hb: { n: 'המוגלובין (Hb)', u: 'g/dL', d: 1, r: { M: [13.5, 17.5], F: [12, 16] } },
  WBC: { n: 'תאי דם לבנים (WBC)', u: 'K/µL', d: 1, r: [4, 11] },
  CRP: { n: 'CRP', u: 'mg/L', d: 0, r: [0, 5] },
  INR: { n: 'INR (קרישה)', u: '', d: 1, r: [0.8, 1.2] },
};
/* ערכי "בבחינה": LDL מתחת ל-100 (ומתחת ל-55 כשיש גורמי סיכון), HDL מעל 40, טריגליצרידים מתחת ל-150 */
const BOOK_RANGE = { LDL: { M: [0, 100], F: [0, 100] }, HDL: { M: [40, 100], F: [40, 100] }, TG: { M: [0, 150], F: [0, 150] } };
const BOOK_NOTE = { LDL: 'בבחינה: מתחת ל-100 (מתחת ל-55 עם גורמי סיכון)', HDL: 'בבחינה: מעל 40', TG: 'בבחינה: מתחת ל-150' };
const LAB_HELP = {
  TROP: 'חלבון שנמצא בתאי שריר הלב. כשתאים מתים (באוטם), הוא דולף לדם, ולכן רמה גבוהה מעידה על נזק לשריר הלב. עולה כמה שעות אחרי תחילת האוטם, ולכן לפעמים חוזרים על הבדיקה. בתעוקה (בלי נמק) הטרופונין תקין.',
  TCHOL: 'סך הכולסטרול בדם: LDL + HDL + חלק מהטריגליצרידים. בספר: רצוי מתחת ל-200.',
  LDL: 'מוביל כולסטרול מהכבד אל הרקמות, ובעודף משקע אותו בדפנות העורקים (פלאק). רצוי מתחת ל-100 mg/dL, ומתחת ל-55 כשיש גורמי סיכון. סטטינים מורידים אותו.',
  HDL: 'מוביל כולסטרול בכיוון ההפוך, בחזרה אל הכבד. כאן "יותר זה טוב": רצוי מעל 40 mg/dL. פעילות גופנית מעלה אותו.',
  TG: 'צורת האחסון העיקרית של שומן בגוף. עולה בעודף פחמימות והשמנה. רצוי מתחת ל-150 mg/dL.',
  GLU: 'סוכרת מאיצה טרשת עורקים ופוגעת בכלי דם גדולים וקטנים.',
  K: 'האשלגן משפיע על הפעילות החשמלית של הלב: שינוי בו עלול לשנות את הא.ק.ג ולגרום להפרעות קצב.',
  NA: 'נתרן קובע את אוסמולריות הפלזמה. עודף נתרן בתזונה מעלה נפח דם ולחץ דם.',
  CREA: 'מעיד על תפקוד הכליות. הכליות והלב קשורים: אי-ספיקת לב עלולה לפגוע בכליות, ויתר לחץ דם פוגע בהן.',
  Hb: 'המוגלובין נמוך (אנמיה) מגביר את העומס על הלב, ועלול לגרום לתעוקה.',
  WBC: 'עולה בזיהום ובמצבי לחץ, וגם אחרי אוטם.',
  CRP: 'סמן דלקת כללי.',
  INR: 'מדד לקרישה. מטופלים בקומדין (וורפרין) נשמרים בדרך כלל ב-INR של 2 עד 3, כדי למנוע קרישים (למשל בפרפור פרוזדורים).',
};
let _labNoteShown = false;
const labNote = () => { if (_labNoteShown) return ''; _labNoteShown = true; return '<div class="small muted" style="margin:0 0 6px">הטווחים מייצגים ערכים מקובלים להמחשה, והם יכולים להשתנות ממעבדה למעבדה. בבחינה משתמשים בערכי הספר (LDL מתחת ל-100, HDL מעל 40, טריגליצרידים מתחת ל-150). הטווח מוצג בסוגריים. לחצו על ? להסבר על הבדיקה.</div>'; };
const labQ = (k, cols) => `<button class="qm" type="button" aria-label="הסבר על הבדיקה" aria-expanded="false">?</button>`;
const labHelpRow = (k, cols) => `<tr class="hrow" hidden><td colspan="${cols}">${LAB_HELP[k] || ''}</td></tr>`;
function labRange(k, sex) { const r = LAB[k].r; return Array.isArray(r) ? r : r[sex]; }
function labFlag(k, v, sex) { const [lo, hi] = labRange(k, sex); return v < lo ? 'L' : v > hi ? 'H' : ''; }
function labGauge(k, v, sex) {
  const [lo, hi] = labRange(k, sex), sp = hi - lo, mn = lo === 0 ? 0 : lo - sp * 0.9, mx = hi + sp * 0.9 + (lo === 0 ? sp * 0.5 : 0), W = mx - mn;
  const pc = x => Math.max(2, Math.min(98, 100 * (x - mn) / W)), f = labFlag(k, v, sex);
  return '<div class="lg" style="direction:ltr;position:relative;height:8px;border-radius:4px;background:#f3cfcf;margin-top:4px;min-width:70px" aria-hidden="true"><i style="position:absolute;top:0;bottom:0;left:' + (100 * (lo - mn) / W) + '%;width:' + (100 * sp / W) + '%;background:#bfe5c9"></i><b style="position:absolute;top:-3px;width:12px;height:14px;margin-left:-6px;border-radius:6px;border:2px solid #fff;box-sizing:border-box;left:' + pc(v) + '%;background:' + (f ? '#d9534f' : '#2f8f55') + '"></b></div>';
}
function labFmt(k, v) { return Number(v).toFixed(LAB[k].d); }
function labRows(keys, vals, sex, hl = []) {
  const bk = k => BOOK_NOTE[k] ? `<br><span class="small" style="color:var(--teal)">${BOOK_NOTE[k]}</span>` : '';
  return labNote() + `<table class="lab"><thead><tr><th>בדיקה</th><th>תוצאה</th><th>טווח</th></tr></thead><tbody>${keys.map(k => {
    if (vals[k] == null) return ''; const f = labFlag(k, vals[k], sex), [lo, hi] = labRange(k, sex);
    return `<tr class="${hl.includes(k) ? 'hl' : ''} ${f ? 'abn' + f : ''}"><td>${LAB[k].n} ${labQ(k)}</td><td class="v ${f}">${labFmt(k, vals[k])} <span class="muted small">${LAB[k].u}</span></td><td class="r">(${lo}–${hi})${bk(k)}${labGauge(k, vals[k], sex)}</td></tr>${labHelpRow(k, 3)}`;
  }).join('')}</tbody></table>`;
}

const TAGS = {
  heart_anat: 'חדרים, עליות ומחיצה', valves: 'מסתמי הלב', heart_vessels: 'כלי דם גדולים', coronary: 'עורקים כליליים', heart_wall: 'דופן הלב וכלי הדם', vessel_types: 'עורק, וריד ונים',
  circulation: 'המחזור הקטן והגדול', no_txa: 'NO וטרומבוקסן', conduction: 'מערכת ההולכה החשמלית', ecg_wave: 'גלים ומקטעים בא.ק.ג', ecg_rhythm: 'קצב לב בא.ק.ג', hemodyn: 'תפוקת לב והמודינמיקה',
  bp_basic: 'לחץ דם', nerves: 'פיקוח עצבי על הלב', athero: 'טרשת עורקים', lipids: 'כולסטרול ושומנים', ihd: 'מחלת לב איסכמית', mi: 'אוטם שריר הלב', mi_dx: 'אבחון אוטם', procedures: 'צנתור, סטנט ומעקפים',
  arrhythmia: 'הפרעות קצב', hf: 'אי-ספיקת לב', htn: 'יתר לחץ דם', cva: 'אירוע מוחי', drugs: 'תרופות לב', prevention: 'מניעה ושיקום', smoking: 'נזקי עישון', body: 'טרשת בגוף שלם',
  bpreg: 'ויסות לחץ דם בין מערכות', cause: 'זיהוי הסיבה', treatment: 'בחירת טיפול', urgent: 'זיהוי מצב חירום', next_test: 'בחירת הבדיקה הבאה', diag_key: 'זיהוי הממצא המכריע', er_tests: 'בחירת בדיקות בחדר מיון', ecg_read: 'קריאת א.ק.ג',
};
