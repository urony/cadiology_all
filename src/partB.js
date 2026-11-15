'use strict';
/* ===== חלק ב׳ – אבחון מא.ק.ג ומבדיקות דם =====
   המטופלים נוצרים אקראית (labgen.js). שלוש רמות: קלאסי, בלי אנמנזה (התלונה מוסתרת והערכים בגבולות), ובחירת הבדיקה הבאה. */
const PANEL_ITEMS = { chem: ['TROP', 'GLU', 'K', 'NA', 'CREA', 'Hb'], basic: ['GLU', 'K', 'NA', 'CREA', 'Hb'], lipid: ['TCHOL', 'LDL', 'HDL', 'TG'], trop: ['TROP'] };
const PANEL_TITLE = { chem: 'כימיה בדם: טרופונין, סוכר, אלקטרוליטים', basic: 'בדיקות דם בסיסיות', lipid: 'פרופיל שומנים בדם', trop: 'טרופונין', ecg: 'א.ק.ג', stress: 'מבחן מאמץ (א.ק.ג בשיא המאמץ)', scan: 'מיפוי לב' };
const PANEL_TUBE = { chem: 'tube_gold', basic: 'tube_gold', lipid: 'tube_gold', trop: 'tube_gold', ecg: 'ecg', stress: 'ecg', scan: 'ecg' };
const TUBE_NAME = { tube_gold: 'צינורית צהובה', ecg: 'מכשיר א.ק.ג' };
const TUBE_EMOJI = { tube_gold: '🟡', ecg: '📈' };
const INFO = {
  sinus_tachy: { key: ['TROP', 'K'], pts: ['בא.ק.ג יש גל P לפני כל QRS והמרווחים סדירים: זה קצב סינוס, ולא הפרעת קצב.', 'הקצב מהיר (מעל 100 בדקה), ולכן טכיקרדיה. גורמים נפוצים: חום, כאב, חרדה, התייבשות או מאמץ.', 'הטרופונין תקין: אין נזק לשריר הלב.'] },
  sinus_brady: { key: ['TROP', 'K'], pts: ['בא.ק.ג יש גל P לפני כל QRS והמרווחים סדירים: קצב סינוס.', 'הקצב איטי (מתחת ל-60 בדקה): ברדיקרדיה. גורמים: תרופות כמו חוסמי בטא, פעילות מוגברת של המערכת הפאראסימפתטית, או בעיה בקוצב.', 'הטרופונין תקין ולכן אין אוטם.'] },
  af: { key: ['TROP', 'K', 'Hb'], pts: ['בא.ק.ג אין גלי P ברורים והמרווחים בין הפעימות לא סדירים: פרפור פרוזדורים.', 'הפעילות החשמלית בעליות מהירה ובלתי יעילה, ולכן קיימת נטייה ליצירת קרישים בעליות.', 'הסיבות העיקריות: יתר לחץ דם, מחלות לב ופעילות יתר של בלוטת התריס.'] },
  vf: { key: ['TROP', 'K'], pts: ['הרצועה כאוטית ואין קומפלקסי QRS מסודרים: פרפור חדרים.', 'החדרים לא שואבים דם, והמטופל מאבד הכרה ואין לו דופק (דום לב).', 'הטיפול המיידי: החייאה והלם חשמלי (דפיברילטור). הסיבה השכיחה: איסכמיה של שריר הלב.'] },
  stemi: { key: ['TROP', 'GLU', 'K'], pts: ['הרמה במקטע ST בא.ק.ג: אוטם עם הרמת ST (אוטם קשה).', 'טרופונין גבוה מעיד שתאי שריר הלב מתים: זה אוטם ולא רק תעוקה.', 'העורק הכלילי חסום לגמרי, וצריך לפתוח אותו בהקדם (צנתור).'] },
  nstemi: { key: ['TROP', 'GLU'], pts: ['ירידה במקטע ST (ולא הרמה) בא.ק.ג מעידה על איסכמיה של שריר הלב.', 'הטרופונין גבוה: יש נמק של תאי שריר, ולכן זה אוטם ולא תעוקה.', 'אוטם פחות קשה מ-STEMI, אבל עדיין מחייב טיפול דחוף.'] },
  ua: { key: ['TROP', 'LDL'], pts: ['ירידה במקטע ST בזמן הכאב: איסכמיה.', 'הטרופונין תקין: אין נמק, ולכן זו תעוקה בלתי יציבה ולא אוטם.', 'אבל זה מצב מסוכן: הרובד עלול להיקרע ולגרום לאוטם. נדרש אשפוז וטיפול.'] },
  sa: { key: ['TROP', 'LDL'], pts: ['א.ק.ג במנוחה תקין וטרופונין תקין: אין נזק קבוע לשריר.', 'במבחן מאמץ מופיעה ירידה במקטע ST: שריר הלב לא מקבל מספיק חמצן כשהוא עובד יותר.', 'הכאב במאמץ שחולף במנוחה הוא האופיין של תעוקה יציבה.'] },
  hyperlip: { key: ['TCHOL', 'LDL', 'HDL', 'TG'], pts: ['LDL גבוה (רצוי מתחת ל-100) ו-HDL נמוך: גורמי סיכון לטרשת עורקים.', 'הא.ק.ג והטרופונין תקינים, ובמבחן מאמץ אין שינוי: אין כרגע מחלת לב, אלא גורם סיכון.', 'הטיפול והמניעה: תזונה, פעילות גופנית, ולעיתים סטטינים.'] },
};
/* בדיקה אחת בלבד לכל מקרה: זו שמקדמת הכי הרבה את האבחנה כרגע. בדיקות אחרות הן שגויות כאן, ומוסבר למה */
const NEXT_OK = { stemi: ['ecg'], nstemi: ['ecg'], ua: ['ecg'], sa: ['stress'], af: ['ecg'], vf: ['ecg'], sinus_tachy: ['ecg'], sinus_brady: ['ecg'], hyperlip: ['lipid'] };
const NEXT_NOT = (k, type) => ({
  ecg: type === 'sa' ? 'בתעוקה יציבה הא.ק.ג במנוחה בדרך כלל תקין, כי הבעיה מופיעה רק במאמץ, ולכן הוא לא מקדם את האבחנה.' : 'לא מקדם את האבחנה כאן יותר מהבדיקה הנכונה.',
  trop: 'טרופונין בודק נזק לשריר הלב, אבל הוא לא מראה קצב או הרמה וירידה במקטע ST, והתשובה מגיעה אחרי זמן. כאן הוא לא הצעד הראשון.',
  lipid: 'מראה גורמי סיכון לטווח ארוך, ולא עוזר לברר את התלונה הנוכחית.',
  stress: 'מבחן מאמץ מתאים לחשד לתעוקה יציבה, ולא כשיש כאב עכשיו או הפרעת קצב פעילה.',
  holter: 'מתאים להפרעות קצב שמופיעות ונפסקות. כאן אפשר לזהות את הבעיה בא.ק.ג רגיל.',
  scan: 'מיפוי לב הוא בדיקה שנייה, אחרי מבחן מאמץ שלא נתן תשובה חד-משמעית.',
  echo: 'אקו מראה מבנה ותפקוד, ואינו הצעד הראשון בכאב בחזה או בהפרעת קצב. הוא יעזור אחרי שהאבחנה ידועה.',
}[k]);
const NEXT_OPTS = { ecg: 'א.ק.ג', trop: 'בדיקת טרופונין', lipid: 'פרופיל שומנים בדם', stress: 'מבחן מאמץ', holter: 'הולטר (א.ק.ג ממושך)', echo: 'אקו לב', scan: 'מיפוי לב' };
const NEXT_WHY = {
  ecg: 'הבדיקה הראשונה בכאב בחזה, בדפיקות לב ובסחרחורת: מראה במהירות קצב, הרמה או ירידה בא.ק.ג.',
  trop: 'מבדילה בין תעוקה (טרופונין תקין) לאוטם (טרופונין גבוה), בחשד לאיסכמיה.',
  lipid: 'מתאימה כשאין תלונות אבל יש חשד לגורמי סיכון: מראה LDL, HDL וטריגליצרידים.',
  stress: 'מתאימה כשהא.ק.ג במנוחה תקין והכאב מופיע במאמץ: מגלה איסכמיה שמופיעה רק כשהלב עובד קשה.',
  holter: 'מתאימה להפרעות קצב שמופיעות ונפסקות: מקליט א.ק.ג לאורך שעות או ימים.',
  scan: 'בודק את זרימת הדם אל שריר הלב ומגלה אזורים שמקבלים פחות דם. מתאים כשצריך לברר איסכמיה, למשל אחרי מבחן מאמץ לא חד-משמעי.',
  echo: 'מראה את מבנה הלב ואת איכות ההתכווצות (שימושי באי-ספיקה ואחרי אוטם), אך אינה הצעד הראשון כאן.',
};
const DXOPT_B = k => `${CT[k].ic} ${CT[k].n}`;
const ECG_KIND_TXT = { sinus: 'קצב סינוס (גל P לפני כל QRS)', af: 'פרפור פרוזדורים (לא סדיר, בלי גלי P)', vf: 'פרפור חדרים (כאוטי)', ste: 'הרמה במקטע ST', std: 'ירידה במקטע ST' };

function makePatientB(type, edge) { const p = genCard(type, Math.random, { edge }); p.sid = 1000 + Math.floor(Math.random() * 9000); return p; }
function patientLineB(p) { return `${p.sex === 'F' ? 'אישה' : 'גבר'} ${p.sex === 'F' ? 'בת' : 'בן'} ${p.age} · תלונה: ${p.complaint}`; }
function resetLabNote() { _labNoteShown = false; }
function panelCard(p, kind, bodyHTML, title) {
  const tb = PANEL_TUBE[kind], img = ART[tb] ? `<img src="${ART[tb]}" alt="">` : `<span style="font-size:1.6rem">${TUBE_EMOJI[tb]}</span>`;
  p.sid = p.sid || (1000 + Math.floor(Math.random() * 9000));
  return `<div class="card flat labform"><div class="lf-head">${img}<div><h3 style="margin:0">${title || PANEL_TITLE[kind]}</h3><div class="small muted">🏥 ${tb === 'ecg' ? 'מכון הלב' : 'מעבדה מרכזית'} · ${TUBE_NAME[tb]} · בדיקה ${p.sid}</div></div></div>${bodyHTML}</div>`;
}
const chemCard = (p, kind, hl = []) => panelCard(p, kind, labRows(PANEL_ITEMS[kind], p.vals, p.sex, hl));
function ecgRateTxt(p) {
  const e = p.ecg;
  if (e.type === 'vf') return 'אין קצב מזוהה: רצועה כאוטית.';
  if (e.type === 'af') return `קצב חדרים בממוצע כ-${e.hr} בדקה, לא סדיר, ללא גלי P ברורים.`;
  return `קצב: <b>${e.hr}</b> פעימות בדקה.`;
}
function ecgCard(p) { return panelCard(p, 'ecg', `<div style="padding:4px 0">${ecgTrace({ type: p.ecg.type, hr: p.ecg.hr || 75, seed: p.ecg.seed }, { sec: 4.2, label: 'רצועת א.ק.ג' })}</div><p class="small" style="margin:6px 0 0">${ecgRateTxt(p)}</p>`, 'א.ק.ג במנוחה'); }
function stressCard(p) {
  if (!p.stress) return panelCard(p, 'stress', '<p>מבחן מאמץ לא בוצע, ואינו מתאים לשלב זה (למשל בכאב חריף או בהפרעת קצב).</p>');
  return panelCard(p, 'stress', `<div style="padding:4px 0">${ecgTrace({ type: p.stress === 'std' ? 'stress_std' : 'sinus', hr: 135, seed: p.ecg.seed + 5 }, { sec: 4.2, label: 'א.ק.ג במאמץ' })}</div><p class="small" style="margin:6px 0 0"><b>${p.stress === 'std' ? 'ירידה במקטע ST בשיא המאמץ.' : 'ללא שינויים במקטע ST בשיא המאמץ.'}</b></p>`);
}
function holterCard(p) { const t = p.type === 'af' ? 'נמצאו התקפים חוזרים של קצב לא סדיר ללא גלי P (פרפור פרוזדורים).' : p.type === 'sinus_brady' ? 'קצב סינוס איטי לאורך היממה, ללא הפרעות קצב אחרות.' : 'לא נמצאו הפרעות קצב משמעותיות.'; return panelCard(p, 'ecg', `<p><b>${t}</b></p>`, 'הולטר: הקלטה ממושכת'); }
/* תמונת תוצאה של בדיקת דימות, בולטת בכרטיס הבדיקה */
function imgResult(key, cap) { return key && ART[key] ? `<figure class="imgres"><img class="zoomable" src="${ART[key]}" alt="${cap}"><figcaption>${cap} (לחצו להגדלה)</figcaption></figure>` : ''; }
function echoCard(p) { const m = { stemi: 'אזור בדופן החדר השמאלי שאינו מתכווץ כראוי.', nstemi: 'ירידה קלה בהתכווצות באזור מוגבל בחדר השמאלי.', af: 'עלייה שמאלית מורחבת. החדרים מתכווצים היטב.', sa: 'מבנה הלב וההתכווצות תקינים במנוחה.' }; const img = p.type === 'af' ? 'echo_la_dilated' : (p.type === 'stemi' || p.type === 'nstemi') ? null : 'echo_normal';   /* באוטם הממצא הוא תנועת דופן, ותמונה סטטית לא יכולה להראות אותו */
  return panelCard(p, 'ecg', `${imgResult(img, 'אקו לב: מבט ארבעה חללים')}<p><b>${m[p.type] || 'מבנה הלב והתכווצותו תקינים.'}</b></p>`, 'אקו לב'); }
function scanCard(p) { const m = { sa: 'ירידה בזרימת הדם לאזור בשריר הלב בזמן מאמץ, שחוזרת לתקינות במנוחה.', ua: 'אזור בשריר הלב עם ירידה בזרימת הדם.', stemi: 'אזור בשריר הלב עם זרימת דם חסרה.', nstemi: 'אזור בשריר הלב עם זרימת דם חסרה.' }; return panelCard(p, 'scan', `<p><b>${m[p.type] || 'זרימת הדם אל שריר הלב תקינה.'}</b></p>`, 'מיפוי לב'); }
function allPanels(p, hl = []) { resetLabNote(); return ecgCard(p) + chemCard(p, 'chem', hl) + chemCard(p, 'lipid', hl) + (p.stress ? stressCard(p) : ''); }

function feedbackDxB(p, chosen) {
  const right = chosen === p.type, info = INFO[p.type];
  let h = `<div class="explain ${right ? 'good' : 'bad'}">${right ? '✅ נכון! ' : `🤔 לא בדיוק. זו ${CT[p.type].n}. `}`;
  if (!right) h += `<br><b>${CT[chosen].s}</b> מאופיינת ב: ${KEYF[chosen].t}.`;
  h += `<br><b>מה מצביע על כך כאן:</b></div><div class="card flat" style="padding:10px;margin-top:8px">${(resetLabNote(), labRows(info.key, p.vals, p.sex, info.key))}<ul style="padding-inline-start:20px;margin:10px 0 0">${info.pts.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
  return h;
}
/* למה זה הממצא המכריע */
const KEYWHY = {
  sinus_tachy: 'גל P לפני כל QRS מראה שהקוצב הראשי מפעיל את העליות: קצב סינוס. הדופק מעל 100 הופך אותו לטכיקרדיה. הטרופונין תקין, ולכן אין נזק לשריר הלב.',
  sinus_brady: 'גל P לפני כל QRS מראה קצב סינוס, ודופק מתחת ל-60 הופך אותו לברדיקרדיה. כאן אין אוטם (טרופונין תקין).',
  af: 'האיבוד של גלי P והמרווחים הלא סדירים בין הפעימות הם הסימן לפרפור: הקוצב הראשי אינו שולט, והעליות מפעילות את החדרים באופן לא סדיר.',
  vf: 'הרצועה הכאוטית בלי קומפלקסים מסודרים משמעותה שהחדרים לא שואבים דם: דום לב שדורש הלם חשמלי.',
  stemi: 'הרמה במקטע ST מעידה על פגיעה חמורה בשריר הלב, והטרופונין הגבוה מאשר נמק של תאי שריר: אוטם עם הרמת ST.',
  nstemi: 'ירידת ST מעידה על איסכמיה, וטרופונין גבוה מראה שכבר נוצר נמק: אוטם, אך בלי הרמת ST.',
  ua: 'ירידת ST מעידה על איסכמיה, אבל הטרופונין תקין, ולכן אין נמק: תעוקה בלתי יציבה (הטרופונין הוא ההבדל מ-NSTEMI).',
  sa: 'במנוחה הכול תקין, והשינוי מופיע רק במאמץ: העורק הצר מספיק למנוחה אך לא למאמץ. זה האופיין לתעוקה יציבה.',
  hyperlip: 'הערכים החריגים הם בדם (LDL גבוה), בלי שום עדות לאיסכמיה בא.ק.ג, בטרופונין ובמאמץ. זה גורם סיכון, ועדיין לא מחלה.',
};
function keyFindQ(p) {
  const others = shuffle(CTYPES.filter(k => k !== p.type && !KEYF[k].ok(p))).slice(0, 3);
  return { q: 'איזה ממצא הכריע לטובת האבחנה?', tag: 'diag_key', options: [{ t: KEYF[p.type].t, ok: true, why: KEYWHY[p.type] }].concat(others.map(k => ({ t: KEYF[k].t, ok: false, why: `זה הממצא האופייני ל${CT[k].s}, ולא מה שרואים כאן.` }))) };
}

/* מריץ סבב מטופלים: mode 1|2|3 */
function runLabRounds(root, ctx, mode, types) {
  const BKEY = 'cardiolab_b_' + (ctx.game ? ctx.game.id : 'x');
  let sv = null; try { sv = JSON.parse(localStorage.getItem(BKEY) || 'null'); } catch (e) { }
  const okSv = !IS_TEACHER && sv && sv.mode === mode && Array.isArray(sv.types) && sv.types.length === types.length && sv.types.every(t => CT[t]);
  if (okSv) types = sv.types;
  const edge = mode === 2; let i = 0; const scores = types.map((_, k) => okSv && sv.scores[k] != null ? sv.scores[k] : null), pats = okSv ? (sv.pats || []).slice() : [];
  if (okSv) { const f = scores.findIndex(x => x == null); i = f < 0 ? 0 : f; }
  const hadSaved = okSv && scores.some(x => x != null);
  const saveB = () => { try { localStorage.setItem(BKEY, JSON.stringify({ mode, types, scores, pats: types.map((_, k) => pats[k] || null) })); } catch (e) { } };
  const sumScore = () => scores.reduce((a, b) => a + (b || 0), 0);
  const host = el('<div></div>'); root.appendChild(host);
  if (hadSaved) root.insertAdjacentHTML('afterbegin', '<div class="explain small">✓ מסומנים המטופלים שכבר אבחנתם (נשמר במכשיר). אפשר להמשיך מהמטופל הבא, או ללחוץ "התחל מחדש".</div>');
  function patientRound() {
    if (i >= types.length) {
      try { localStorage.removeItem(BKEY); } catch (e) { }
      const per = scores.filter(x => x != null && x >= .999).length, rk = diagRank(per, types.length); ctx.rank = rk;
      const extra = `<div class="card"><table class="lab"><thead><tr><th>מטופל</th><th>אבחנה</th><th>ניקוד</th></tr></thead><tbody>${types.map((t, k) => `<tr><td>${k + 1}</td><td>${CT[t].ic} ${CT[t].s}</td><td class="v">${Math.round(100 * (scores[k] || 0))}%</td></tr>`).join('')}</tbody></table><button class="btn block" id="sharebtn" style="margin-top:12px">📤 שליחת התוצאות למורה</button></div>`;
      ctx.finish(Math.round(100 * sumScore() / types.length), rankCard(rk, per, types.length) + extra);
      const sb = $('#sharebtn', root); if (sb) sb.onclick = shareResultsModal; return;
    }
    const type = types[i], p = pats[i] || (pats[i] = makePatientB(type, edge)); host.innerHTML = '';
    const answeredN = scores.filter(x => x != null).length;
    const head = el(`<div><div class="row sp small muted"><span>מטופל ${i + 1} מתוך ${types.length}</span><span>⭐ ${Math.round(sumScore() * 10) / 10}</span></div><div class="bar" style="margin:8px 0"><i style="width:${100 * answeredN / types.length}%"></i></div></div>`);
    head.appendChild(jumpBar(types.length, i, scores.map(x => x != null), j => { i = j; patientRound(); window.scrollTo(0, 0); }));
    const hide2 = mode === 2 && !IS_TEACHER && !p.hinted;
    const who = el(`<div class="card"><div class="patient-head"><div class="avatar">${p.sex === 'F' ? '👩' : '👨'}</div><div><h3 style="margin:0">תוצאות בדיקות</h3><div class="muted">${p.sex === 'F' ? 'בת' : 'בן'} ${p.age}</div></div></div>
      <div id="ccbox">${hide2 ? '<button class="btn teal block" id="hintbtn" style="margin-top:10px">🗣️ בקשו אנמנזה (רמז: מוריד 10% מניקוד המטופל, ו-20 שניות בתחרות)</button>' : `<div class="cc"><span class="cct">תלונה מרכזית</span>${p.complaint}</div>`}</div></div>`);
    host.append(head, who);
    if (IS_TEACHER) who.insertAdjacentHTML('beforeend', `<div class="tnote"><b>מפתח:</b> ${CT[type].n}. ${INFO[type].pts[0]}</div>`);
    const hb = $('#hintbtn', who); if (hb) hb.onclick = () => { p.hinted = true; if (ctx.penalty) ctx.penalty(20); $('#ccbox', who).innerHTML = `<div class="cc"><span class="cct">תלונה מרכזית (נלקחה אנמנזה)</span>${p.complaint}</div>`; };
    const labs = el('<div></div>'); host.appendChild(labs);
    const q = el('<div class="card"></div>'); host.appendChild(q);
    const fb = el('<div></div>'); host.appendChild(fb);
    const finish = pts => {
      if (p.hinted) pts = Math.max(0, pts - .1);
      if (scores[i] == null) { scores[i] = pts; saveB(); }
      const left = types.map((_, k) => k).filter(k => scores[k] == null), nxt = left.find(k => k > i), last = left.length === 0;
      const sm = el(`<div class="card" style="margin-top:12px"><div class="row sp"><b>${pts >= .999 ? 'מטופל מושלם! 🌟' : 'סיימתם את המטופל'}</b><span>${Math.round(pts * 100)}%</span></div>${pts >= .999 ? expertCard('great') : ''}<button class="btn primary block" id="nx" style="margin-top:10px">${last ? 'לסיכום 🏁' : 'המטופל הבא ←'}</button></div>`);
      fb.appendChild(sm); sm.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      $('#nx', sm).onclick = () => { i = last ? types.length : (nxt != null ? nxt : left[0]); patientRound(); window.scrollTo(0, 0); };
    };
    function dxStep(box, label, w, wk, base) {
      const opts = CTYPES.map(k => ({ t: DXOPT_B(k), ok: k === p.type, tag: CT[k].tag, _k: k }));
      mcq(box, { q: label, tag: CT[p.type].tag, options: opts, onDone: (ok, o) => {
        fb.innerHTML = feedbackDxB(p, o._k);
        if (ok) {
          const q2 = el('<div class="card" style="margin-top:10px"></div>'); fb.appendChild(q2);
          mcq(q2, { ...keyFindQ(p), onDone: ok2 => finish(base + w + wk * (ok2 ? 1 : 0)) });
        } else finish(base);
      } });
    }
    if (mode === 1) {
      labs.innerHTML = allPanels(p);
      const ek = ['sinus', 'af', 'vf', 'ste', 'std'];
      mcq(q, { q: 'שלב 1: מה מראה הא.ק.ג?', tag: 'ecg_read', options: ek.map(k => ({ t: ECG_KIND_TXT[k], ok: k === p.ecg.type, why: k === p.ecg.type ? ECG_WHY[k] : '' })),
        onDone: () => { const box = el('<div style="margin-top:14px"></div>'); q.appendChild(box); dxStep(box, 'שלב 2: מהי האבחנה?', .7, .3, 0); } });
    } else if (mode === 2) {
      labs.innerHTML = allPanels(p);
      q.insertAdjacentHTML('afterbegin', '<div class="explain" style="margin-bottom:12px">⚠️ רמת קושי מתקדמת: המטופל לא מספר מה מציק לו (בלי אנמנזה), והערכים קרובים לגבולות. מאבחנים מהבדיקות בלבד. מי שמבקש אנמנזה מאבד 10% מניקוד המטופל (ו-20 שניות בתחרות). קראו את כל הדפוס ואל תסתמכו על מדד אחד.</div>');
      dxStep(q, 'מהי האבחנה?', .7, .3, 0);
    } else {
      resetLabNote(); labs.innerHTML = chemCard(p, 'basic');
      const ok = NEXT_OK[type];
      mcq(q, { q: 'מה הבדיקה הבאה שתבקשו? בחרו בדיקה אחת: זו שתקדם הכי הרבה את האבחנה עכשיו.', tag: 'next_test', options: Object.keys(NEXT_OPTS).map(k => ({ t: NEXT_OPTS[k], ok: ok.includes(k), why: ok.includes(k) ? NEXT_WHY[k] : `${NEXT_NOT(k, type)} הבדיקה שמקדמת הכי הרבה כאן: ${NEXT_OPTS[ok[0]]}.`, _k: k })), onDone: (okN, o) => {
        const best = ok[0];
        const show = k => k === 'ecg' ? ecgCard(p) : k === 'trop' ? (resetLabNote(), chemCard(p, 'trop')) : k === 'lipid' ? (resetLabNote(), chemCard(p, 'lipid')) : k === 'stress' ? stressCard(p) : k === 'holter' ? holterCard(p) : k === 'scan' ? scanCard(p) : echoCard(p);
        let rev = okN ? '' : `<div class="explain bad">הבדיקה שתועיל הכי הרבה כאן: <b>${NEXT_OPTS[best]}</b></div>`;
        rev += show(o._k); if (!okN) rev += show(best);
        if (!ok.includes('ecg') || (o._k !== 'ecg' && best !== 'ecg')) { /* בדיקות נוספות לא נחשפות, כדי לא לתת את הכול */ }
        labs.insertAdjacentHTML('beforeend', rev);
        const q2 = el('<div class="card" style="margin-top:10px"></div>'); host.insertBefore(q2, fb);
        const hasEcg = (o._k === 'ecg') || (!okN && best === 'ecg');
        if (!hasEcg && p.type !== 'hyperlip') labs.insertAdjacentHTML('beforeend', ecgCard(p));
        dxStep(q2, 'ועכשיו: מהי האבחנה?', .6, .2, okN ? .2 : 0);
      } });
    }
  }
  patientRound();
}
function labTypes(n = 8) { return shuffle(shuffle(CTYPES).slice(0, n)); }
registerGame({ id: 'b_l1', part: 'B', learned: [
    'א.ק.ג קורא קודם לפי הקצב (סדיר או לא, עם גל P או בלעדיו) ואז לפי המקטעים (ST).',
    'הרמת ST עם טרופונין גבוה: אוטם חמור (STEMI). ירידת ST עם טרופונין גבוה: אוטם ללא הרמה. ירידת ST עם טרופונין תקין: תעוקה בלתי יציבה.',
    'פרפור פרוזדורים: בלי גלי P ולא סדיר. פרפור חדרים: רצועה כאוטית (דום לב). דופק מעל 100 הוא טכיקרדיה, ומתחת ל-60 ברדיקרדיה.',
  ], icon: '🧪', title: 'רמה 1: הא.ק.ג והבדיקות מול העיניים', desc: 'א.ק.ג, טרופונין ושומני דם, ממצאים קלאסיים. 8 מטופלים.',
  teacherNote: 'כל מטופל נוצר אקראית מ-9 אבחנות (טכיקרדיה, ברדיקרדיה, פרפור פרוזדורים, פרפור חדרים, STEMI, NSTEMI, תעוקה בלתי יציבה, תעוקה יציבה, יתר שומנים). שלב 1: קריאת הא.ק.ג. שלב 2: האבחנה. שלב 3: הממצא המכריע. הרצועות והערכים להמחשה, והם משתנים בין מעבדות.',
  mount(root, ctx) { root.insertAdjacentHTML('afterbegin', say('קיבלנו א.ק.ג ובדיקות דם… ועכשיו אתם הרופאים. התחילו מהא.ק.ג: מה הוא אומר?', 'think')); runLabRounds(root, ctx, 1, labTypes(8)); } });
registerGame({ id: 'b_l2', part: 'B', learned: [
    'ערכים בגבול דורשים קריאת דפוס שלם ולא מדד בודד: דופק סביב 100 או 60, וטרופונין מעט מעל הנורמה.',
    'טרופונין הוא ההבדל בין תעוקה בלתי יציבה (תקין) לבין אוטם (גבוה), כשהא.ק.ג דומה.',
    'תעוקה יציבה מזוהה ממבחן מאמץ חיובי עם א.ק.ג תקין במנוחה, ויתר שומנים בדם מזוהה כשאין עדות לאיסכמיה.',
  ], icon: '⚖️', title: 'רמה 2: בלי אנמנזה', desc: 'המטופל לא מספר מה מציק לו: מאבחנים רק מהבדיקות, בערכים קרובים לגבול. 8 מטופלים.',
  teacherNote: 'שם הרמה: "בלי אנמנזה" (בלי תלונה). התלונה המרכזית מוסתרת ברמה הזו, והערכים קרובים לגבול: התלמיד מאבחן מהבדיקות, ואפשר לבקש אנמנזה כרמז בעלות של 10% מניקוד המטופל (ו-20 שניות במצב תחרות). ערכי קצה: דופק 101 עד 112 או 53 עד 59, טרופונין 40 עד 180, LDL 132 עד 165. תמיד יש ממצא אחד שמכריע (א.ק.ג, טרופונין או מבחן מאמץ).',
  mount(root, ctx) { root.insertAdjacentHTML('afterbegin', say('עכשיו זה לא כל כך ברור… הערכים בגבול. קראו את כל הדפוס ואל תסתמכו על מדד אחד.', 'wink')); runLabRounds(root, ctx, 2, labTypes(8)); } });
registerGame({ id: 'b_l3', part: 'B', learned: [
    'בכאב בחזה, בדפיקות לב ובסחרחורת, הבדיקה הראשונה היא א.ק.ג.',
    'טרופונין מבדיל בין תעוקה לאוטם. מבחן מאמץ מתאים כשהא.ק.ג במנוחה תקין והכאב במאמץ. הולטר מתאים להפרעות קצב שמופיעות ונפסקות.',
    'אין תלונות אבל יש גורמי סיכון: פרופיל שומנים בדם הוא הבדיקה המתאימה.',
  ], icon: '🧭', title: 'רמה 3: מה הבדיקה הבאה?', desc: 'מקבלים תלונה ובדיקות בסיס: בחרו את הבדיקה הבאה ואז אבחנו. 7 מטופלים.',
  teacherNote: 'לכל אבחנה בדיקה אחת נכונה, זו שמקדמת הכי הרבה כרגע: בכאב בחזה ובהפרעות קצב — א.ק.ג קודם; בתעוקה יציבה — מבחן מאמץ; בלי תלונות — שומני דם. כל בדיקה אחרת נחשבת שגויה, ומוסבר למה היא לא הצעד הראשון (למשל טרופונין אחרי א.ק.ג, או הולטר כשהא.ק.ג הרגיל כבר מזהה). אחרי הבחירה נחשפים ההסבר והתוצאה, ואז האבחנה. האקו והמיפוי הן בדיקות שניות.',
  mount(root, ctx) { root.insertAdjacentHTML('afterbegin', say('רופא טוב לא מזמין הכול: הוא מזמין חכם. התחילו מהתלונה ומבדיקות הבסיס, ובחרו את הצעד הבא.', 'happy')); runLabRounds(root, ctx, 3, labTypes(7)); } });

/* ===== צד מורה: חלק ב׳ ===== */
function teacherLabView(g, body) {
  const mode = { b_l1: 1, b_l2: 2, b_l3: 3 }[g.id] || 1, edge = mode === 2, n = mode === 3 ? 7 : 8;
  const types = labTypes(n), pats = []; let cur = 0;
  const host = el('<div></div>'); body.appendChild(host);
  function render() {
    host.innerHTML = '';
    host.appendChild(jumpBar(types.length, cur, [], j => { cur = j; render(); window.scrollTo(0, 0); }));
    const type = types[cur], p = pats[cur] || (pats[cur] = makePatientB(type, edge)), info = INFO[type], nx = NEXT_OK[type];
    resetLabNote();
    let h = `<div class="card"><div class="patient-head"><div class="avatar">${p.sex === 'F' ? '👩' : '👨'}</div><div><h3 style="margin:0">מטופל ${cur + 1} מתוך ${types.length}: ${CT[type].s}</h3><div class="muted">${patientLineB(p)}</div></div></div></div>`;
    h += mode === 3 ? chemCard(p, 'basic') + `<div class="card flat" style="padding:12px;margin-top:8px"><div class="q">הבדיקה הבאה הנכונה</div>${nx.map(k => `<div class="explain good" style="margin:6px 0">✅ <b>${NEXT_OPTS[k]}</b><div class="small">${NEXT_WHY[k]}</div></div>`).join('')}</div>` : '';
    if (mode !== 3) h += allPanels(p, info.key);
    if (mode === 1) h += `<div class="card flat" style="padding:12px;margin-top:8px"><div class="q">שלב 1: מה מראה הא.ק.ג?</div><div class="explain good" style="margin:6px 0">✅ <b>${ECG_KIND_TXT[p.ecg.type]}</b></div></div>`;
    h += `<div class="card flat" style="padding:12px;margin-top:8px"><div class="q">האבחנה</div><div class="explain good" style="margin:6px 0">✅ <b>${DXOPT_B(type)}</b></div><b class="small">הממצא המכריע:</b> ${KEYF[type].t}<ul class="small" style="padding-inline-start:20px;margin:8px 0 0">${info.pts.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
    h += `<button class="btn block" id="newp" style="margin-top:10px">🔄 מטופל חדש במקום זה</button>`;
    host.insertAdjacentHTML('beforeend', h);
    $('#newp', host).onclick = () => { pats[cur] = null; render(); };
  }
  render();
}
function keyPartB() {
  const r = mulberry32(2026);
  let h = `<h2>🧪 חלק ב׳: אבחון מא.ק.ג ומבדיקות דם</h2><p class="small muted">המטופלים נוצרים אקראית בכל פעם, ולכן אין רשימת תשובות קבועה. להלן כל אחת מ-9 האבחנות, הדפוס שלה ומטופל לדוגמה. בבדיקת תקינות על 2,000 מטופלים לכל אבחנה (קלאסי וגבולי) האבחנה היחידה העולה מהממצאים הייתה תמיד הנכונה. הערכים להמחשה והם משתנים בין מעבדות.</p>`;
  CTYPES.forEach(t => {
    const p = genCard(t, r, {}); p.sid = 4242; resetLabNote();
    h += `<div class="card"><h3>${CT[t].ic} ${CT[t].n}</h3><p class="small"><b>הממצא המכריע:</b> ${KEYF[t].t}</p><ul class="small">${INFO[t].pts.map(x => `<li>${x}</li>`).join('')}</ul><p class="small muted">בדיקות מקדמות (רמה 3): ${NEXT_OK[t].map(k => NEXT_OPTS[k]).join(' או ')}</p><details><summary class="small"><b>מטופל לדוגמה</b></summary>${labRows(INFO[t].key, p.vals, p.sex, INFO[t].key)}<p class="small">${p.sex === 'F' ? 'אישה' : 'גבר'} בן/בת ${p.age} · ${p.complaint} · א.ק.ג: ${ECG_KIND_TXT[p.ecg.type]}${p.ecg.hr ? ' · קצב ' + p.ecg.hr : ''}</p></details></div>`;
  });
  return h;
}
