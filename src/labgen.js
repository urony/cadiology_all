'use strict';
/* ===== מחולל מטופלים: א.ק.ג ובדיקות דם (חלק ב׳, ובסיס לבדיקות בחלק ג׳) =====
   כל אבחנה מוגדרת בטווחי יעד: "קלאסי" (ערכים ברורים) ו"גבולי" (קרובים לגבול, אבל עדיין חד-משמעיים).
   המסווג בסוף הקובץ הוא "האמת": tools/validate_labs.mjs מריץ אלפי מטופלים לכל אבחנה ובודק שהאבחנה
   היחידה שעולה מהממצאים היא הנכונה. אם משנים טווח, מריצים שוב את הבדיקה.
   הערכים להמחשה בלבד (למעט הכיוון: למשל טרופונין עולה באוטם). הם משתנים בין מעבדות. */
const CTYPES = ['sinus_tachy', 'sinus_brady', 'af', 'vf', 'stemi', 'nstemi', 'ua', 'sa', 'hyperlip'];
const CT = {
  sinus_tachy: { n: 'טכיקרדיה סינוסית (קצב סינוס מהיר)', s: 'טכיקרדיה סינוסית', ic: '🐇', tag: 'ecg_rhythm' },
  sinus_brady: { n: 'ברדיקרדיה סינוסית (קצב סינוס איטי)', s: 'ברדיקרדיה סינוסית', ic: '🐢', tag: 'ecg_rhythm' },
  af: { n: 'פרפור פרוזדורים', s: 'פרפור פרוזדורים', ic: '🌀', tag: 'arrhythmia' },
  vf: { n: 'פרפור חדרים (דום לב)', s: 'פרפור חדרים', ic: '⚡', tag: 'arrhythmia' },
  stemi: { n: 'אוטם שריר הלב עם הרמת ST (STEMI)', s: 'אוטם עם הרמת ST', ic: '💔', tag: 'mi' },
  nstemi: { n: 'אוטם שריר הלב ללא הרמת ST (NSTEMI)', s: 'אוטם בלי הרמת ST', ic: '🩹', tag: 'mi' },
  ua: { n: 'תעוקת חזה בלתי יציבה', s: 'תעוקה בלתי יציבה', ic: '⚠️', tag: 'ihd' },
  sa: { n: 'תעוקת חזה יציבה', s: 'תעוקה יציבה', ic: '🪜', tag: 'ihd' },
  hyperlip: { n: 'יתר שומנים בדם (היפרליפידמיה) ללא מחלת לב', s: 'יתר שומנים בדם', ic: '🧈', tag: 'lipids' },
};

const BASEC = {
  TROP: [2, 10], LDL: [70, 98], HDL: { M: [42, 60], F: [48, 70] }, TG: [70, 140], GLU: [78, 96], K: [3.9, 4.8], NA: [137, 143],
  CREA: { M: [0.8, 1.1], F: [0.6, 0.9] }, Hb: { M: [13.8, 16.2], F: [12.3, 14.6] }, WBC: [5, 9], CRP: [0.5, 3.5], INR: [0.9, 1.1],
};
/* מבנה כל שדה: [טווח קלאסי, טווח גבולי]. ecg: סוג והדופק. stress: null (לא בוצע) | 'std' (ירידת ST במאמץ) | 'normal' */
const CSPEC = {
  sinus_tachy: { sex: r => r() < .5 ? 'F' : 'M', age: [19, 70], ecg: 'sinus', hr: [[108, 160], [102, 112]], f: {}, stress: null,
    cm: s => ['תחושת דפיקות לב מהירות אחרי יום מלחיץ ושתייה מועטה, עם חום קל', 'לב דופק מהר מאז אתמול, עם חום וצמרמורות'] },
  sinus_brady: { sex: r => r() < .5 ? 'F' : 'M', age: [55, 84], ecg: 'sinus', hr: [[36, 50], [53, 59]], f: {}, stress: null,
    cm: s => ['סחרחורת ועייפות אחרי שהתחיל לקחת תרופה חדשה (חוסם בטא) לפני שבועיים', 'חולשה וסחרחורת כשקמים מהר, ודופק איטי שהרגישו בבדיקה אצל הרופא'] },
  af: { sex: r => r() < .5 ? 'F' : 'M', age: [58, 88], ecg: 'af', hr: [[90, 130], [90, 130]], f: {}, stress: null,
    cm: s => ['הלמות לב לא סדירה כבר כמה שעות, עם תחושת חולשה וקוצר נשימה קל', 'דפיקות לב "לא מסודרות" שמתחילות ונפסקות, ויתר לחץ דם ידוע שנים רבות'] },
  vf: { sex: r => r() < .8 ? 'M' : 'F', age: [45, 80], ecg: 'vf', hr: [[0, 0], [0, 0]], f: { TROP: [[10, 400], [10, 150]] }, stress: null,
    cm: s => ['נמצא קרוס על הרצפה, לא מגיב וללא דופק מורגש; המוניטור הראשוני שהוצמד מציג את הרצועה'] },
  stemi: { sex: r => r() < .7 ? 'M' : 'F', age: [42, 82], ecg: 'ste', hr: [[65, 105], [60, 100]], f: { TROP: [[220, 9000], [70, 180]], LDL: [[110, 180], [102, 150]], GLU: [[100, 220], [96, 160]] }, stress: null,
    cm: s => ['כאב לוחץ ומועך בחזה שהחל לפני כשעה, מקרין ללסת ולזרוע שמאל, עם הזעה קרה ובחילה', 'לחץ כבד במרכז החזה שלא חולף במנוחה, עם קוצר נשימה ופחד'] },
  nstemi: { sex: r => r() < .6 ? 'M' : 'F', age: [48, 84], ecg: 'std', hr: [[65, 105], [62, 100]], f: { TROP: [[90, 3500], [40, 90]], LDL: [[110, 180], [102, 150]], GLU: [[100, 220], [96, 160]] }, stress: null,
    cm: s => ['לחץ בחזה במנוחה במשך חצי שעה, בחילה וחולשה, אצל מטופל עם סוכרת', 'כאב לוחץ בחזה שהחל אתמול בערב ולא עבר לגמרי, עם חולשה כללית'] },
  ua: { sex: r => r() < .6 ? 'M' : 'F', age: [48, 80], ecg: 'std', hr: [[62, 100], [60, 96]], f: { TROP: [[2, 12], [2, 12]], LDL: [[105, 170], [102, 150]] }, stress: null,
    cm: s => ['תקופה של כמה ימים עם התקפי כאב לוחץ בחזה שהולכים ונעשים תכופים יותר, והיום גם במנוחה', 'כאב בחזה אחרי מאמץ קל, שמופיע לאחרונה בתדירות עולה, וקם בלילה מכאב'] },
  sa: { sex: r => r() < .65 ? 'M' : 'F', age: [45, 76], ecg: 'sinus', hr: [[58, 88], [60, 90]], f: { TROP: [[2, 12], [2, 12]], LDL: [[110, 175], [102, 150]] }, stress: 'std',
    cm: s => ['כאב לוחץ בחזה בעליית מדרגות לקומה שנייה, שחולף תוך כמה דקות במנוחה', 'צריבה לוחצת במרכז החזה בהליכה מהירה, שחולפת כשעוצרים'] },
  hyperlip: { sex: r => r() < .5 ? 'F' : 'M', age: [30, 62], ecg: 'sinus', hr: [[60, 88], [60, 90]], f: { LDL: [[165, 250], [132, 165]], TG: [[190, 420], [130, 220]], HDL: { M: [[30, 40], [36, 41]], F: [[34, 46], [40, 48]] } }, stress: 'normal',
    cm: s => ['ערך כולסטרול גבוה בבדיקת דם שגרתית, ללא כל תלונה', 'אין תלונות. אחד ההורים נפטר מאוטם בגיל צעיר, והמטופל בא לבדיקה מונעת'] },
};
const cri = (r, a, b) => Math.floor(a + r() * (b - a + 1));
const cpick = (spec, sex, edge) => { const s = Array.isArray(spec) ? spec : spec[sex]; return edge ? s[1] : s[0]; };
function genCard(type, r = Math.random, o = {}) {
  const S = CSPEC[type], edge = !!o.edge, sex = S.sex(r), age = Math.round(between(S.age[0], S.age[1], r));
  const v = {};
  const sample = k => { const b = BASEC[k], s = S.f[k] ? cpick(S.f[k], sex, edge) : (Array.isArray(b) ? b : b[sex]); return between(s[0], s[1], r); };
  ['TROP', 'LDL', 'HDL', 'TG', 'GLU', 'K', 'NA', 'CREA', 'Hb', 'WBC', 'CRP', 'INR'].forEach(k => v[k] = sample(k));
  v.HDL = Math.min(v.HDL, 80);
  Object.keys(v).forEach(k => { if (LAB[k]) v[k] = round(v[k], LAB[k].d); });
  v.TCHOL = Math.round(v.LDL + v.HDL + v.TG / 5);
  const hrR = S.hr[edge ? 1 : 0], hr = Math.round(between(hrR[0], hrR[1], r));
  return { type, edge, sex, age, vals: v, ecg: { type: S.ecg, hr, seed: cri(r, 1, 9999) }, stress: S.stress, complaint: pick(S.cm(sex), r) };
}

/* ===== המסווג ("האמת"): אבחנה יחידה שעולה מהממצאים, בלי הסיפור ===== */
function classifyCard(p) {
  const v = p.vals, e = p.ecg.type, hr = p.ecg.hr;
  if (e === 'vf') return 'vf';
  if (e === 'af') return 'af';
  if (e === 'ste') return v.TROP > 14 ? 'stemi' : null;
  if (e === 'std') return v.TROP > 14 ? 'nstemi' : 'ua';
  if (e === 'sinus') {
    if (p.stress === 'std') return 'sa';
    if (v.LDL >= 130) return 'hyperlip';
    if (hr > 100) return 'sinus_tachy';
    if (hr < 60) return 'sinus_brady';
  }
  return null;
}
/* הממצא המכריע לכל אבחנה, והתנאי שבודק אם הוא נכון למטופל. משמש לשאלת "מה הממצא שהכריע?" */
const KEYF = {
  sinus_tachy: { t: 'גל P לפני כל QRS והמרווחים סדירים, עם דופק מעל 100 בדקה וטרופונין תקין', ok: p => p.ecg.type === 'sinus' && p.ecg.hr > 100 && !p.stress && p.vals.LDL < 130 },
  sinus_brady: { t: 'גל P לפני כל QRS והמרווחים סדירים, עם דופק מתחת ל-60 בדקה', ok: p => p.ecg.type === 'sinus' && p.ecg.hr < 60 && !p.stress && p.vals.LDL < 130 },
  af: { t: 'מרווחים לא סדירים בין הפעימות וללא גלי P ברורים', ok: p => p.ecg.type === 'af' },
  vf: { t: 'רצועה כאוטית ללא קומפלקסי QRS מסודרים', ok: p => p.ecg.type === 'vf' },
  stemi: { t: 'הרמה במקטע ST בא.ק.ג, יחד עם טרופונין גבוה', ok: p => p.ecg.type === 'ste' && p.vals.TROP > 14 },
  nstemi: { t: 'ירידה במקטע ST בא.ק.ג, יחד עם טרופונין גבוה', ok: p => p.ecg.type === 'std' && p.vals.TROP > 14 },
  ua: { t: 'ירידה במקטע ST בא.ק.ג, אבל טרופונין תקין (אין נמק)', ok: p => p.ecg.type === 'std' && p.vals.TROP <= 14 },
  sa: { t: 'א.ק.ג במנוחה תקין וטרופונין תקין, אבל במאמץ מופיעה ירידה במקטע ST', ok: p => p.ecg.type === 'sinus' && p.stress === 'std' },
  hyperlip: { t: 'LDL גבוה, כשהא.ק.ג והטרופונין תקינים ובמבחן מאמץ אין שינוי', ok: p => p.ecg.type === 'sinus' && p.stress !== 'std' && p.vals.LDL >= 130 && p.ecg.hr >= 60 && p.ecg.hr <= 100 },
};
