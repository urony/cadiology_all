'use strict';
/* ===== חלק א׳: חזרה על מה שטעיתי + בחינה מסכמת (נבנים מהשאלות של שאר משחקי חלק א׳) ===== */
let _quizPool = null;
const isMeta = id => id === 'a_review' || id === 'a_exam' || id.startsWith('a_mix');
function quizPool(sec) {
  if (!sec && _quizPool) return _quizPool;
  const list = GAMES.filter(g => g.part === 'A' && !isMeta(g.id) && (!sec || g.sec === sec));
  const out = [], seen = new Set();
  collectKey(list).forEach(d => d.q.forEach(it => {
    if (!it || !it.options || it.options.length < 2 || it.options.filter(o => o.ok).length !== 1 || !it.q) return;
    if (seen.has(it.q)) return; seen.add(it.q); out.push(it);
  }));
  if (!sec) _quizPool = out; return out;
}

registerGame({
  id: 'a_review', part: 'A', sec: 'review', icon: '🔁', title: 'חזרה על מה שטעיתי', desc: 'חידון קצר שנבנה מהנושאים שבהם טעיתם',
  teacherNote: 'המשחק בוחר שאלות מהנושאים שהתלמיד טעה בהם הכי הרבה (לפי רישום הטעויות במכשיר שלו). אם עוד אין טעויות, מוצגות שאלות מעורבות.',
  learned: ['חזרה ממוקדת על הנקודות החלשות חוסכת זמן לימוד.', 'כל טעות היא מידע: היא מראה בדיוק איפה צריך לחזק.'],
  mount(root, ctx) {
    const pool = quizPool(), ptags = new Set(pool.map(q => q.tag)), mis = Object.entries(Store.d.mistakes).sort((a, b) => b[1] - a[1]).map(x => x[0]).filter(k => ptags.has(k)), top = mis.slice(0, 4);
    let items = shuffle(pool.filter(q => top.includes(q.tag))).slice(0, 8);
    if (items.length < 5) items = items.concat(shuffle(pool.filter(q => !items.includes(q))).slice(0, 6 - items.length));
    const msg = top.length ? `לפי הטעויות שלכם, נחזור על: <b>${top.map(k => TAGS[k] || k).join(', ')}</b>.` : 'עוד אין לכם טעויות רשומות (או שאתם פשוט מצוינים). הנה שאלות מעורבות לחזרה.';
    root.insertAdjacentHTML('afterbegin', say(msg, 'think'));
    runQuiz(root, ctx, items);
  },
});

registerGame({
  id: 'a_exam', part: 'A', sec: 'review', icon: '📝', title: 'מיני בחינה מסכמת', desc: 'עשר שאלות מעורבות מכל משחקי החלק. ציון, דירוג ותעודה',
  teacherNote: 'בחינה קצרה של 10 שאלות שנבחרות אקראית מכל שאלות חלק א׳. בסיום, תלמיד שציונו 70 ומעלה יכול להוריד תעודה.',
  learned: ['שאלות מכל נושאי החלק מראות מה כבר יושב ומה עדיין דורש חיזוק.', 'מי שציונו נמוך כדאי שישחק שוב את המשחק של הנושא וישוב לבחינה.'],
  mount(root, ctx) {
    root.insertAdjacentHTML('afterbegin', say('בחינה מסכמת! עשר שאלות מכל הנושאים. בהצלחה!', 'wink'));
    runQuiz(root, ctx, shuffle(quizPool()).slice(0, 10));
  },
});

/* מריץ את כל השאלות ברצף של סבבים: בסוף כל סבב כפתור "עוד שאלות" עד שנגמרו */
function mixRun(root, ctx, pool, n) {
  const all = shuffle(pool); let pos = 0;
  const ctx2 = Object.assign({}, ctx, { finish: (pct, extra) => { ctx.finish(pct, extra); const mb = $('#moreq', root); if (mb) mb.onclick = () => { root.innerHTML = ''; round(); window.scrollTo(0, 0); }; } });
  function round() {
    const chunk = all.slice(pos, pos + n); pos += n; const left = all.length - pos;
    const after = left > 0 ? `<div class="card center"><b>עברתם על ${pos} מתוך ${all.length} שאלות.</b><button class="btn primary block" id="moreq" style="margin-top:10px">➡ עוד ${Math.min(n, left)} שאלות (נשארו ${left})</button></div>` : `<div class="card center">🎉 עברתם על כל ${all.length} השאלות של הנושא!</div>`;
    runQuiz(root, ctx2, chunk, { after });
  }
  round();
}
/* תרגול רב-ברירה מעורב: לפי נושא, או מכל חלק א׳. אפשר לשלוח לתלמידים קישור ישיר, למשל #/g/a_mix_all */
const MIXES = [
  { id: 'a_mix_basics', sec: 'basics', icon: '🎯', title: 'תרגול מעורב: מבנה הלב וכלי הדם', desc: 'כל שאלות הרב-ברירה על מדורי הלב, המסתמים, כלי הדם ודופנותיהם, בסדר אקראי', n: 20 },
  { id: 'a_mix_hemo', sec: 'hemo', icon: '🎯', title: 'תרגול מעורב: חשמל וזרימה', desc: 'כל שאלות הרב-ברירה על מערכת ההולכה, א.ק.ג, קצב הלב והפיקוח העצבי, תפוקת לב ולחץ דם, בסדר אקראי', n: 20 },
  { id: 'a_mix_disease', sec: 'disease', icon: '🎯', title: 'תרגול מעורב: מחלות הלב וכלי הדם', desc: 'כל שאלות הרב-ברירה על טרשת עורקים, תעוקה, אוטם, הפרעות קצב, אי-ספיקה, לחץ דם, אירוע מוחי, א.ק.ג ותרופות, בסדר אקראי', n: 20 },
  { id: 'a_mix_all', sec: 'review', icon: '🎲', title: 'תרגול מעורב: הכול ביחד', desc: 'כל שאלות הרב-ברירה של חלק א׳ בסדר אקראי, בלי לדעת מראש מאיזה נושא', n: 20 },
];
MIXES.forEach(m => registerGame({
  id: m.id, part: 'A', sec: m.sec, icon: m.icon, title: m.title, desc: m.desc,
  teacherNote: 'חידון רב-ברירה שכולל את כל השאלות של הנושא, בסדר אקראי ובתשובות מעורבבות, ב-20 שאלות בכל פעם. בסוף כל סבב יש כפתור "עוד שאלות" עד שהתלמיד עובר על הכול. קישור ישיר (בדף המורה, "שאלות רב-ברירה בלבד") שולח לתלמיד רק את השאלות, בלי המשחקים והאיורים.',
  learned: ['תרגול מעורב מחזק זיכרון לטווח ארוך יותר מתרגול נושא אחרי נושא.', 'שאלות בסדר לא צפוי מראות מה באמת יושב.'],
  mount(root, ctx) {
    const pool = m.id === 'a_mix_all' ? quizPool() : quizPool(m.sec);
    root.insertAdjacentHTML('afterbegin', say(`כאן כל ${pool.length} שאלות הרב-ברירה של הנושא, בסדר אקראי. הסדר והתשובות מתערבבים בכל פעם. נעבור עליהן ב-${m.n} בכל סבב.`, 'wink'));
    mixRun(root, ctx, pool, m.n);
  },
}));
