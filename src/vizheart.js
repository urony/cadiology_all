'use strict';
/* ===== איורים וסימולציות של הלב (SVG בקוד, כגיבוי עד שיהיו איורים אמיתיים) =====
   heartSVG: תרשים סכמטי של הלב מלפנים, בסגנון אטלס. הנקודות במשחק "גרור את התווית" מוגדרות באחוזים מגודל הציור (440×460).
   ecgTrace: מחולל א.ק.ג בקוד (סינוס, טכיקרדיה, ברדיקרדיה, פרפור פרוזדורים, פרפור חדרים, הרמת ST, ירידת ST).
   כל הערכים להמחשה. */
const ECG_NAMES = { sinus: 'קצב סינוס תקין', af: 'פרפור פרוזדורים', vf: 'פרפור חדרים', ste: 'הרמה במקטע ST', std: 'ירידה במקטע ST' };
const ECG_WHY = {
  sinus: 'לפני כל QRS יש גל P, והמרווחים בין הפעימות שווים: זה קצב סינוס.',
  af: 'המרווחים בין הפעימות לא סדירים ואין גלי P ברורים: הפעילות בעליות מהירה וכאוטית.',
  vf: 'אין קומפלקסים מסודרים: רק תנודות כאוטיות. החדרים לא שואבים דם, וזה מצב של דום לב.',
  ste: 'מקטע ST מורם מעל קו הבסיס: ממצא אופייני לאוטם עם הרמת ST (STEMI).',
  std: 'מקטע ST יורד מתחת לקו הבסיס: איסכמיה של שריר הלב, למשל בתעוקה או באוטם ללא הרמת ST.',
};
const RED = '#d83a4a', RED_L = '#f3a3ab', BLUE = '#3f74c9', BLUE_L = '#a9c3ee';

function heartSVG(opts = {}) {
  const arrows = opts.arrows;
  return `<svg class="heartsvg" viewBox="0 0 440 460" role="img" aria-label="תרשים סכמטי של הלב מלפנים" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="ha" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#222"/></marker></defs>
  <g stroke="rgba(0,0,0,.25)" stroke-width="1.5" stroke-linejoin="round">
    <path d="M190,138 Q130,96 40,102" stroke="${BLUE}" stroke-width="26" fill="none" stroke-linecap="round"/>
    <path d="M205,128 Q300,86 392,112" stroke="${BLUE}" stroke-width="26" fill="none" stroke-linecap="round"/>
    <path d="M26,190 H120" stroke="${RED}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M414,192 H330" stroke="${RED}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M236,262 V112 Q236,34 292,34 Q340,34 340,100 V150" stroke="${RED}" stroke-width="36" fill="none" stroke-linecap="butt"/>
    <path d="M114,22 V150" stroke="${BLUE}" stroke-width="30" fill="none"/>
    <path d="M70,452 V240" stroke="${BLUE}" stroke-width="28" fill="none"/>
    <path d="M262,140 Q258,236 262,246 H352 Q366,196 346,150 Q320,128 262,140 Z" fill="${RED_L}"/>
    <path d="M216,252 H348 Q380,340 306,414 Q262,448 216,436 Z" fill="${RED}"/>
    <path d="M216,252 H348 Q380,340 306,414 Q262,448 216,436 Z" fill="none" stroke="#8a1f2b" stroke-width="9" opacity=".35"/>
    <path d="M92,126 Q82,190 96,252 H204 V138 Q150,108 92,126 Z" fill="${BLUE_L}"/>
    <path d="M96,258 Q78,340 176,438 H216 V258 Z" fill="${BLUE}"/>
    <path d="M188,262 V120" stroke="${BLUE}" stroke-width="26" fill="none"/>
    <rect x="210" y="256" width="12" height="178" rx="4" fill="#f3d9c8"/>
  </g>
  <g fill="#fff" stroke="#b8862b" stroke-width="2.5"><path d="M130 254 q18 12 36 0 q-18 -12 -36 0z"/><path d="M268 252 q18 12 36 0 q-18 -12 -36 0z"/><circle cx="231" cy="240" r="8"/><circle cx="190" cy="246" r="8"/></g>
  ${arrows ? `<g stroke="#222" stroke-width="2.4" fill="none" marker-end="url(#ha)"><path d="M114,60 V112"/><path d="M70,420 V330"/><path d="M130,200 Q150,235 150,250"/><path d="M150,300 Q170,330 190,300 V210"/><path d="M60,190 H90"/><path d="M380,192 H350"/><path d="M300,200 Q290,226 290,248"/><path d="M286,296 Q250,360 236,300 V120"/></g>` : ''}
  </svg>`;
}
/* נקודות (אחוזים מ-440×460) */
const HP = (x, y) => [Math.round(1000 * x / 440) / 10, Math.round(1000 * y / 460) / 10];
const HEART_PTS = {
  RA: HP(140, 200), LA: HP(308, 196), RV: HP(150, 360), LV: HP(292, 346), SEP: HP(216, 340),
  TRI: HP(148, 257), MIT: HP(286, 252), AOV: HP(231, 240), PUV: HP(190, 246),
  SVC: HP(114, 62), IVC: HP(70, 380), AORTA: HP(292, 38), PT: HP(188, 160), RPA: HP(70, 104), LPA: HP(380, 108), RPV: HP(40, 190), LPV: HP(400, 192),
};
function hset(spec) { return spec.map(([k, l, e, d, ha, ea]) => ({ l, e, ha: ha || [], ea: ea || [], x: HEART_PTS[k][0], y: HEART_PTS[k][1], d })); }
Object.assign(LABEL_SETS, {
  chambers: { svg: heartSVG(), ratio: 440 / 460, maxW: 380, title: 'חדרים ועליות', tag: 'heart_anat', parts: hset([
    ['RA', 'עלייה ימנית', 'Right atrium', 'מקבלת דם דל בחמצן מהגוף דרך שני הוורידים החלולים (עליון ותחתון).', ['פרוזדור ימני']],
    ['RV', 'חדר ימני', 'Right ventricle', 'דוחף דם דל בחמצן אל הריאות דרך עורק הריאה. דופן דקה יחסית, כי הלחץ במחזור הקטן נמוך.', []],
    ['LA', 'עלייה שמאלית', 'Left atrium', 'מקבלת דם עשיר בחמצן מהריאות דרך ורידי הריאה.', ['פרוזדור שמאלי']],
    ['LV', 'חדר שמאלי', 'Left ventricle', 'דוחף דם עשיר בחמצן אל כל הגוף דרך אבי העורקים. בעל הדופן העבה ביותר, כי הוא עובד נגד לחץ גבוה.', []],
    ['SEP', 'מחיצה', 'Septum', 'הקיר ששומר על הפרדה בין הצד הימני (דם דל בחמצן) לצד השמאלי (דם עשיר בחמצן).', ['מחיצת הלב']],
  ]) },
  valves: { svg: heartSVG(), ratio: 440 / 460, maxW: 380, title: 'מסתמים', tag: 'valves', parts: hset([
    ['TRI', 'מסתם תלת-צניפי', 'Tricuspid valve', 'בין העלייה הימנית לחדר הימני. שלושה צניפים. מונע חזרת דם לעלייה.', ['תלת צניפי', 'מסתם טריקוספידלי', 'טריקוספידלי'], ['tricuspid']],
    ['MIT', 'מסתם דו-צניפי (מיטרלי)', 'Mitral valve', 'בין העלייה השמאלית לחדר השמאלי. שני צניפים.', ['מסתם מיטרלי', 'מיטרלי', 'דו צניפי', 'מסתם דו-צניפי'], ['bicuspid valve', 'bicuspid', 'mitral']],
    ['AOV', 'מסתם אבי העורקים', 'Aortic valve', 'מסתם כיסים (סהרוני) בין החדר השמאלי לאבי העורקים.', ['מסתם אאורטלי', 'מסתם אבי עורקים', 'מסתם אבי-העורקים'], ['aortic']],
    ['PUV', 'מסתם עורק הריאה', 'Pulmonary valve', 'מסתם כיסים (סהרוני) בין החדר הימני לעורק הריאה.', ['מסתם ריאתי', 'מסתם עורק-הריאה'], ['pulmonic valve', 'pulmonary']],
  ]) },
  vessels: { svg: heartSVG(), ratio: 440 / 460, maxW: 380, title: 'כלי דם גדולים', tag: 'heart_vessels', parts: hset([
    ['AORTA', 'אבי העורקים', 'Aorta', 'העורק הגדול ביותר בגוף. מוביל דם עשיר בחמצן מהחדר השמאלי לכל הגוף.', ['אבי עורקים', 'אאורטה'], ['aortic arch']],
    ['PT', 'עורק הריאה', 'Pulmonary artery', 'יוצא מהחדר הימני ומתפצל לשניים. העורק היחיד (בגוף) שמוביל דם דל בחמצן.', ['עורקי הריאה', 'עורק ריאתי', 'עורק הריאה'], ['pulmonary trunk', 'pulmonary arteries']],
    ['SVC', 'וריד חלול עליון', 'Superior vena cava', 'מחזיר דם דל בחמצן מהחלק העליון של הגוף אל העלייה הימנית.', ['וריד נבוב עליון', 'וריד חלול עליון', 'וריד נבוב'], ['svc']],
    ['IVC', 'וריד חלול תחתון', 'Inferior vena cava', 'מחזיר דם דל בחמצן מהחלק התחתון של הגוף אל העלייה הימנית.', ['וריד נבוב תחתון', 'וריד חלול תחתון', 'וריד נבוב'], ['ivc']],
    ['RPV', 'ורידי הריאה', 'Pulmonary veins', 'מובילים דם עשיר בחמצן מהריאות אל העלייה השמאלית. הוורידים היחידים שמובילים דם עשיר בחמצן.', ['וריד ריאה', 'ורידי הריאה', 'ורידים ריאתיים'], ['pulmonary vein']],
  ]) },
});

/* ---------- עורקים כליליים: תרשים נפרד ---------- */
function coronarySVG() {
  return `<svg class="heartsvg" viewBox="0 0 440 460" role="img" aria-label="עורקים כליליים" xmlns="http://www.w3.org/2000/svg">
  <path d="M60,160 Q50,300 190,430 Q260,440 340,360 Q390,270 350,150 Q320,90 250,110 Q215,60 160,100 Q90,100 60,160 Z" fill="#f3c9c4" stroke="#b86a63" stroke-width="3"/>
  <path d="M215,40 Q220,100 236,112" stroke="${RED}" stroke-width="34" fill="none"/><path d="M180,60 Q160,100 176,120" stroke="${BLUE}" stroke-width="30" fill="none"/>
  <g fill="none" stroke-linecap="round"><path d="M232,118 Q252,150 262,200 Q270,300 250,400" stroke="#8f1230" stroke-width="7"/><path d="M236,120 Q300,120 345,180 Q362,250 340,300" stroke="#c4284a" stroke-width="6"/><path d="M222,116 Q150,110 98,170 Q78,260 130,350 Q150,390 175,418" stroke="#6b1030" stroke-width="7"/></g>
  <circle cx="249" cy="132" r="7" fill="#fff" stroke="#8f1230" stroke-width="2"/>
  </svg>`;
}
const CP = (x, y) => HP(x, y);
Object.assign(LABEL_SETS, {
  coronary: { svg: coronarySVG(), ratio: 440 / 460, maxW: 380, title: 'העורקים הכליליים', tag: 'coronary', parts: [
    { l: 'אבי העורקים', e: 'Aorta', ha: ['אבי עורקים', 'אאורטה'], x: CP(218, 56)[0], y: CP(218, 56)[1], d: 'מכאן יוצאים העורקים הכליליים, מיד אחרי המסתם.' },
    { l: 'עורק כלילי שמאלי', e: 'Left coronary artery', ha: ['עורק כלילי שמאל', 'עורק כלילי'], ea: ['LCA', 'left main'], x: CP(249, 132)[0], y: CP(249, 132)[1], d: 'יוצא מאבי העורקים ומתפצל לעורק היורד הקדמי ולעורק העוטף. מזין את רוב החדר השמאלי.' },
    { l: 'עורק כלילי ימני', e: 'Right coronary artery', ha: ['עורק כלילי ימין', 'עורק כלילי'], ea: ['RCA'], x: CP(120, 260)[0], y: CP(120, 260)[1], d: 'מזין את העלייה והחדר הימניים ואת החלק התחתון של הלב.' },
    { l: 'העורק היורד הקדמי', e: 'Left anterior descending (LAD)', ha: ['יורד קדמי', 'עורק יורד קדמי'], ea: ['LAD', 'left anterior descending artery'], x: CP(268, 270)[0], y: CP(268, 270)[1], d: 'יורד לאורך המחיצה אל קצה הלב. חסימה בו פוגעת באזור הקדמי של החדר השמאלי, והיא מסוכנת במיוחד.' },
  ] },
});

/* ---------- איורים אמיתיים (art/anat_*) במקום התרשימים בקוד. הנקודות מכוילות באחוזים על כל תמונה. אם התמונה לא נטענת, מוצגת הודעה בתוך המשחק ---------- */
function useImage(key, img, ratio, maxW, pts) {
  const S = LABEL_SETS[key]; delete S.svg; S.img = img; S.ratio = ratio; S.maxW = maxW;
  S.parts.forEach((p, i) => { p.x = pts[i][0]; p.y = pts[i][1]; });
}
useImage('chambers', 'anat_heart_cut', 900 / 818, 420, [[25, 41], [33, 63], [66, 37], [64, 68], [50, 66]]);
useImage('valves', 'anat_valves', 1, 380, [[27, 62], [73, 64], [48, 42], [48, 14]]);
useImage('vessels', 'anat_heart', 900 / 850, 400, [[47, 14], [50, 29], [28, 8], [29, 89], [15, 41]]);
useImage('coronary', 'anat_coronary', 1, 400, [[39, 17], [48, 34], [27, 46], [57, 53]]);

/* ---------- אק"ג: פעימה מסומנת (לגרירת תוויות) ---------- */
function ecgBeatSVG() {
  const W = 440, H = 260, y0 = 150, A = 100;
  const g = (t, c, s, a) => a * Math.exp(-((t - c) * (t - c)) / (2 * s * s));
  const f = t => g(t, .16, .035, .13) + g(t, .295, .010, -.1) + g(t, .31, .014, 1) + g(t, .335, .012, -.22) + g(t, .58, .05, .3);
  let d = ''; for (let i = 0; i <= 400; i++) { const t = i / 400 * .85, x = 20 + 400 * i / 400, y = y0 - A * f(t); d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); }
  return `<svg class="heartsvg ecgsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="פעימת א.ק.ג אחת" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#fff8f7"/>${ecgGrid(W, H, 20, 100)}<path d="${d}" fill="none" stroke="#1d1d1d" stroke-width="2.6" stroke-linejoin="round"/></svg>`;
}
function ecgGrid(W, H, big, _) { let s = ''; for (let x = 0; x <= W; x += big / 5) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#f3c9c4" stroke-width="${x % big === 0 ? 1.1 : .5}"/>`; for (let y = 0; y <= H; y += big / 5) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#f3c9c4" stroke-width="${y % big === 0 ? 1.1 : .5}"/>`; return s; }
const EP = (tt, v) => { const x = 20 + 400 * (tt / .85), y = 150 - 100 * v; return [Math.round(1000 * x / 440) / 10, Math.round(1000 * y / 260) / 10]; };
Object.assign(LABEL_SETS, {
  ecgbeat: { svg: ecgBeatSVG(), ratio: 440 / 260, maxW: 400, title: 'גלים ומקטעים בא.ק.ג', tag: 'ecg_wave', parts: [
    { l: 'גל P', e: 'P wave', ha: ['גל פי', 'P'], ea: ['p'], x: EP(.16, .16)[0], y: EP(.16, .2)[1], d: 'דפולריזציה של העליות: האות החשמלי עובר מקוצב הלב (SA) אל שתי העליות.' },
    { l: 'מקטע PR', e: 'PR segment', ha: ['מקטע PR', 'פי אר'], ea: ['pr interval', 'pr'], x: EP(.235, 0)[0], y: EP(.235, -.1)[1], d: 'השהיה קצרה בצומת AV, לפני שהאות עובר לחדרים.' },
    { l: 'קומפלקס QRS', e: 'QRS complex', ha: ['גל QRS', 'QRS', 'קומפלקס'], ea: ['qrs'], x: EP(.318, .75)[0], y: EP(.318, .75)[1], d: 'דפולריזציה של החדרים: מיד אחריה החדרים מתכווצים (סיסטולה).' },
    { l: 'מקטע ST', e: 'ST segment', ha: ['מקטע ST', 'אס טי'], ea: ['st'], x: EP(.42, 0)[0], y: EP(.42, -.1)[1], d: 'החדרים כולם מופעלים. הרמה או ירידה בו מעידות על פגיעה באספקת הדם לשריר הלב.' },
    { l: 'גל T', e: 'T wave', ha: ['גל טי', 'T'], ea: ['t'], x: EP(.58, .3)[0], y: EP(.58, .38)[1], d: 'רפולריזציה של החדרים: החדרים חוזרים למצב מנוחה ומתרפים (דיאסטולה).' },
  ] },
});

/* ---------- מחולל א.ק.ג ---------- */
/* spec.type: sinus | af | vf | ste | std | stress_std. spec.hr = דופק. מחזיר מחרוזת SVG. */
function ecgTrace(spec = {}, o = {}) {
  const W = o.w || 440, H = o.h || 170, sec = o.sec || 4.2, ppx = (W - 24) / sec, y0 = H * .6, A = H * .36;
  const r = mulberry32(spec.seed || 7), type = spec.type || 'sinus', hr = spec.hr || 75;
  const g = (t, c, s, a) => a * Math.exp(-((t - c) * (t - c)) / (2 * s * s));
  /* זמני R */
  const Rs = []; let t = .35 + r() * .1;
  while (t < sec + .5) { Rs.push(t); const rr = type === 'af' ? .32 + r() * .55 : 60 / hr * (1 + (r() - .5) * .03); t += rr; }
  const beat = (tt, rr) => {
    let v = 0; const pc = -Math.min(.17, rr * .36), tc = Math.min(.22, rr * .5);
    if (type !== 'af') v += g(tt, pc, .028, .14);
    v += g(tt, -.028, .008, -.1) + g(tt, 0, .011, 1) + g(tt, .03, .010, -.2);
    if (type === 'ste') { v += g(tt, .12, .075, .5) + g(tt, tc + .06, .06, .25); }
    else if (type === 'std' || type === 'stress_std') { v += g(tt, .13, .08, -.28) + g(tt, tc + .05, .05, -.1); }
    else v += g(tt, tc, .05, .3);
    return v;
  };
  let d = '', pts = [];
  for (let px = 0; px <= W - 24; px += 1) {
    const tt = px / ppx; let v = 0;
    if (type === 'vf') {
      v = .45 * Math.sin(tt * 31 + 1.1 * Math.sin(tt * 2.1)) * (0.7 + .6 * Math.sin(tt * 3.3 + 1)) + .3 * Math.sin(tt * 47 + 2) * Math.sin(tt * 1.7);
    } else {
      for (let k = 0; k < Rs.length; k++) { const dt = tt - Rs[k]; if (dt > -.4 && dt < .6) v += beat(dt, k + 1 < Rs.length ? Rs[k + 1] - Rs[k] : .8); }
      if (type === 'af') v += .035 * Math.sin(tt * 61) + .03 * Math.sin(tt * 83 + 1.3) + .02 * Math.sin(tt * 37 + .6);
      else v += .008 * Math.sin(tt * 90);
    }
    pts.push([12 + px, y0 - A * v]);
  }
  d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
  return `<svg class="ecgsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'רצועת א.ק.ג')}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#fff8f7" rx="8"/>${ecgGrid(W, H, 25)}<path d="${d}" fill="none" stroke="#1d1d1d" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

/* ---------- שכבות דופן כלי הדם: עורק, וריד, נים ---------- */
function vesselsSVG() {
  const ring = (cx, cy, rO, wall, cols) => `<circle cx="${cx}" cy="${cy}" r="${rO}" fill="${cols[2]}" stroke="#7a5a50" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${rO - wall[0]}" fill="${cols[1]}"/><circle cx="${cx}" cy="${cy}" r="${rO - wall[0] - wall[1]}" fill="${cols[0]}"/><circle cx="${cx}" cy="${cy}" r="${rO - wall[0] - wall[1] - wall[2]}" fill="#fff4f2"/>`;
  return `<svg class="heartsvg" viewBox="0 0 440 190" role="img" aria-label="חתך של עורק, וריד ונים" xmlns="http://www.w3.org/2000/svg">
  ${ring(80, 90, 66, [10, 30, 6], ['#f7d9d4', '#d97b7b', '#e8d2a8'])}${ring(220, 90, 66, [8, 9, 4], ['#f7d9d4', '#d97b7b', '#e8d2a8']).replace('r="58"', 'r="58"')}
  <circle cx="370" cy="90" r="26" fill="#f7d9d4" stroke="#b86a63" stroke-width="3"/><circle cx="370" cy="90" r="18" fill="#fff4f2"/>
  <g font-size="14" font-family="Heebo,Arial" text-anchor="middle" fill="currentColor"><text x="80" y="178">עורק</text><text x="220" y="178">וריד</text><text x="370" y="178">נים</text></g></svg>`;
}

/* ---------- שלבי טרשת עורקים ---------- */
function plaqueSVG(stage) {
  const lumen = [46, 40, 30, 14][stage], plaque = stage >= 1;
  return `<svg viewBox="0 0 120 120" width="100%" role="img" aria-label="שלב ${stage + 1}" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="52" fill="#e8c8a8" stroke="#9a6a50" stroke-width="2"/><circle cx="60" cy="60" r="${[46, 46, 46, 46][stage]}" fill="#d97b7b"/>
  <circle cx="60" cy="60" r="${lumen + (stage === 0 ? 0 : 0)}" fill="#fff4f2"/>
  ${plaque ? `<path d="M${60 - 38},${60 + 18} Q60,${60 + (stage === 1 ? 24 : 6)} ${60 + 38},${60 + 18} Q60,${60 + 50} ${60 - 38},${60 + 18} Z" fill="#f2d377" stroke="#b8902a" stroke-width="2" opacity=".95"/>` : ''}
  ${stage === 3 ? '<ellipse cx="60" cy="56" rx="12" ry="9" fill="#a8142f" opacity=".85"/>' : ''}</svg>`;
}

/* ---------- סימולטור תפוקת לב ולחץ דם ---------- */
function coSim(root, o = {}) {
  const host = el('<div class="card"></div>'); root.appendChild(host);
  let hr = 70, sv = 70, res = 100;
  function draw() {
    const co = hr * sv / 1000, sys = Math.round(60 + co * 12 + res * .25), dia = Math.round(40 + res * .35);
    host.innerHTML = `<p class="instr">הזיזו את הסליידרים ונחשו לפני שמסתכלים: מה קורה לתפוקת הלב ולחץ הדם?</p>
      <div class="sl"><label>דופק (פעימות בדקה): <b>${hr}</b></label><input type="range" id="shr" min="40" max="180" value="${hr}"></div>
      <div class="sl"><label>נפח פעימה (מ״ל): <b>${sv}</b></label><input type="range" id="ssv" min="40" max="110" value="${sv}"></div>
      <div class="sl"><label>התנגדות כלי הדם: <b>${res < 80 ? 'נמוכה (כלי דם מורחבים)' : res > 125 ? 'גבוהה (כלי דם מכווצים)' : 'תקינה'}</b></label><input type="range" id="sres" min="60" max="160" value="${res}"></div>
      <div class="kpi"><div><b>${(co).toFixed(1)}</b><span>תפוקת לב (ל׳/דקה)</span></div><div><b>${sys}/${dia}</b><span>לחץ דם משוער (להמחשה)</span></div></div>
      <div class="small muted">תפוקת הלב = דופק × נפח פעימה. בבריא במנוחה: כ-70 × 70 מ״ל = כ-5 ליטר בדקה. לחץ דם מושפע מתפוקת הלב ומההתנגדות של כלי הדם (ולכן הערכים כאן להמחשה בלבד).</div>`;
    $('#shr', host).oninput = e => { hr = +e.target.value; draw(); $('#shr', host).focus(); }; $('#ssv', host).oninput = e => { sv = +e.target.value; draw(); $('#ssv', host).focus(); }; $('#sres', host).oninput = e => { res = +e.target.value; draw(); $('#sres', host).focus(); };
    if (o.onChange) o.onChange({ hr, sv, res, co });
  }
  draw();
  const go = el('<button class="btn primary block" style="margin-top:12px">המשך ←</button>'); host.parentNode.appendChild(go); go.onclick = () => o.onDone && o.onDone(100);
}
