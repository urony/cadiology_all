'use strict';
/* ===== "גרור את התווית": גוררים שם אל נקודה על איור אנטומי (או לחיצה על התווית ואז על הנקודה) =====
   קואורדינטות הנקודות באחוזים מגודל התמונה (x מהשמאל, y מלמעלה), לכן מתאימות לכל מסך.
   l = שם בעברית, e = שם באנגלית, ha / ea = שמות נוספים שמתקבלים בהקלדה (עברית / אנגלית). */
const LABEL_SETS = {};   // המערכים מוגדרים ב-vizheart.js

/* מצבי משחק */
const LABEL_MODES = [
  { k: 'he', t: 'בעברית', d: 'גוררים שמות בעברית אל האיור', ic: 'א' },
  { k: 'en', t: 'באנגלית', d: 'גוררים שמות באנגלית אל האיור', ic: 'A' },
  { k: 'mix', t: 'אקראי', d: 'חלק מהשמות בעברית וחלק באנגלית, בכל פעם אחרת', ic: '🎲' },
  { k: 'type-he', t: 'הפוך: כתבו בעברית', d: 'הנקודות ממוספרות, ואתם כותבים את שם המבנה בעברית', ic: '✍️' },
  { k: 'type-en', t: 'הפוך: כתבו באנגלית', d: 'הנקודות ממוספרות, ואתם כותבים את שם המבנה באנגלית', ic: '⌨️' },
];

/* נרמול טקסט להשוואה בהקלדה */
function labelNorm(s, he) {
  s = String(s).toLowerCase().replace(/[֑-ׇ]/g, '').replace(/[׳'`"״’.,\-–_()\/]/g, ' ').replace(/\s+/g, ' ').trim();
  if (he) s = s.replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ').replace(/(^| )ה(?=\S)/g, '$1');
  return s.replace(/ /g, '');
}
function labelAccepts(p, lang) {
  if (lang === 'en') {
    const base = [p.e, ...(p.ea || [])];
    base.slice().forEach(x => { const m = x.replace(/\s*\(.*?\)\s*/g, ' ').trim(); if (m) base.push(m); const ins = x.match(/\(([^)]*)\)/); if (ins) base.push(ins[1]); });
    return base.map(x => labelNorm(x, false));
  }
  const base = [p.l, ...(p.ha || [])];
  base.slice().forEach(x => { const m = x.replace(/\s*\(.*?\)\s*/g, ' ').trim(); if (m) base.push(m); const ins = x.match(/\(([^)]*)\)/); if (ins) base.push(ins[1]); });
  return base.map(x => labelNorm(x, true));
}

function labelGame(root, set, mode, onDone) {
  const P = set.parts, n = P.length, typed = mode.startsWith('type');
  const lang = P.map(() => mode === 'en' ? 'en' : mode === 'he' ? 'he' : mode === 'type-en' ? 'en' : mode === 'type-he' ? 'he' : (Math.random() < 0.5 ? 'en' : 'he'));
  const nm = i => lang[i] === 'en' ? P[i].e : P[i].l;
  let sel = null, wrong = 0, openDot = null; const placed = new Set(), tries = {};
  const host = el('<div class="card lgame"></div>'); root.appendChild(host);
  const imgHtml = set.svg ? set.svg : ART[set.img] ? `<img src="${ART[set.img]}" alt="${set.title}" draggable="false">` : `<div class="lg-fallback" style="aspect-ratio:${set.ratio}">האיור לא נטען. אפשר לשחק גם בלי: הנקודות מסמנות מקומות בתרשים.</div>`;
  const instr = typed ? `לחצו על נקודה ממוספרת, וכתבו את שם המבנה ${mode === 'type-en' ? 'באנגלית' : 'בעברית'}.` : 'גררו כל שם אל הנקודה המתאימה על האיור, או לחצו על שם ואז על הנקודה.';
  host.innerHTML = `<p class="instr">${instr}</p>
    <div class="lg-wrap" style="max-width:${set.maxW}px">${imgHtml}${P.map((p, i) => `<button class="lg-dot ${typed ? 'num' : ''}" data-d="${i}" style="left:${p.x}%;top:${p.y}%" aria-label="נקודה ${i + 1}">${typed ? i + 1 : ''}</button>`).join('')}</div>
    <div id="lg-type" class="lg-type" hidden></div>
    <div id="lg-fb" class="lg-fb" aria-live="polite"></div>
    <div class="lg-pool" id="lg-pool" ${typed ? 'hidden' : ''}>${shuffle(P.map((p, i) => i)).map(i => `<button class="lg-chip ${lang[i] === 'en' ? 'en' : ''}" data-c="${i}" ${lang[i] === 'en' ? 'dir="ltr"' : ''}>${nm(i)}</button>`).join('')}</div>
    <div class="lg-legend" id="lg-legend"></div><div id="lg-end"></div>`;
  const fb = $('#lg-fb', host), pool = $('#lg-pool', host), legend = $('#lg-legend', host), tbox = $('#lg-type', host);
  const dotEl = i => $(`.lg-dot[data-d="${i}"]`, host), chipEl = i => $(`.lg-chip[data-c="${i}"]`, host);
  const say2 = (cls, html) => { fb.className = 'lg-fb explain ' + cls; fb.innerHTML = html; };
  function both(i) { return `<b>${P[i].l}</b> <span dir="ltr" class="lg-en">(${P[i].e})</span>`; }
  function finishDot(c, ok) {
    placed.add(c);
    const dot = dotEl(c); dot.classList.remove('hot', 'pick'); dot.classList.add(ok ? 'ok' : 'revealed'); if (!typed) dot.textContent = placed.size; dot.disabled = true;
    legend.insertAdjacentHTML('beforeend', `<div class="lg-row"><b class="lg-num">${typed ? c + 1 : placed.size}</b><div>${both(c)}<div class="small muted">${P[c].d}</div></div></div>`);
    if (placed.size === n) {
      tbox.hidden = true;
      const pct = Math.max(0, Math.round(100 * (n - wrong) / n));
      $('#lg-end', host).innerHTML = `<div class="explain ${wrong ? 'bad' : 'good'}" style="margin-top:10px">${wrong ? `סיימתם. ${wrong} טעויות, ועכשיו אפשר לעבור על ההסברים למעלה.` : '🎉 מושלם, בלי טעויות!'}</div><button class="btn primary block" id="lg-next" style="margin-top:10px">המשך ←</button>`;
      $('#lg-next', host).onclick = () => onDone(pct);
      $('#lg-next', host).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
  function attempt(c, d) {
    if (placed.has(c) || placed.has(d)) return;
    if (c === d) {
      Snd.play('ok'); chipEl(c) && chipEl(c).remove(); sel = null; finishDot(c, true);
      say2('good', `✅ נכון! ${both(c)}: ${P[c].d}`);
    } else {
      wrong++; Store.mistake(set.tag); Snd.play('no');
      const dot = dotEl(d); dot.classList.remove('shake'); void dot.offsetWidth; dot.classList.add('shake');
      say2('bad', `🤔 לא מתאים. ${both(c)}: ${P[c].d} נסו נקודה אחרת.`);
    }
  }
  function select(c) { sel = (sel === c) ? null : c; $$('.lg-chip', host).forEach(b => b.classList.toggle('pick', +b.dataset.c === sel)); }
  /* מצב הקלדה */
  function openType(d) {
    openDot = d; $$('.lg-dot', host).forEach(x => x.classList.toggle('pick', +x.dataset.d === d));
    const he = mode === 'type-he';
    tbox.hidden = false;
    tbox.innerHTML = `<div class="lg-q"><b>נקודה ${d + 1}:</b> איך קוראים למבנה הזה ${he ? 'בעברית' : 'באנגלית'}?</div><div class="row"><input type="text" id="lg-in" ${he ? '' : 'dir="ltr"'} autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${he ? 'כתבו כאן שם בעברית' : 'type the name in English'}"><button class="btn primary" id="lg-ok">בדיקה</button></div>`;
    const inp = $('#lg-in', host); setTimeout(() => inp.focus({ preventScroll: true }), 30);
    const go = () => checkType(d, inp.value);
    $('#lg-ok', host).onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  function checkType(d, val) {
    const he = mode === 'type-he', v = labelNorm(val, he);
    if (!v) { say2('', 'כתבו שם ואז לחצו "בדיקה".'); return; }
    const acc = labelAccepts(P[d], he ? 'he' : 'en');
    if (acc.includes(v)) { Snd.play('ok'); tbox.hidden = true; openDot = null; finishDot(d, true); say2('good', `✅ נכון! ${both(d)}: ${P[d].d}`); return; }
    tries[d] = (tries[d] || 0) + 1; wrong++; Store.mistake(set.tag); Snd.play('no');
    if (tries[d] < 2) { const w = nm(d); say2('bad', `🤔 לא בדיוק. רמז: השם מתחיל ב-<b dir="${he ? 'rtl' : 'ltr'}">${w.trim()[0]}</b> ויש בו ${w.split(/\s+/).length} מילים. נסו שוב.`); }
    else { tbox.hidden = true; openDot = null; finishDot(d, false); say2('bad', `זה היה: ${both(d)}. ${P[d].d} (נספרה טעות.)`); }
  }
  host.addEventListener('click', e => {
    if (host._skipClick) { host._skipClick = false; return; }
    const ch = e.target.closest('.lg-chip'), dt = e.target.closest('.lg-dot');
    if (ch) { select(+ch.dataset.c); return; }
    if (typed) { if (dt && !dt.disabled) openType(+dt.dataset.d); return; }
    if (dt && sel != null) attempt(sel, +dt.dataset.d);
    else if (dt && !dt.disabled) say2('', 'בחרו קודם שם מהרשימה, או גררו אותו אל הנקודה.');
  });
  /* גרירה במגע/עכבר */
  pool.addEventListener('pointerdown', e => {
    const ch = e.target.closest('.lg-chip'); if (!ch) return;
    const c = +ch.dataset.c, sx = e.clientX, sy = e.clientY; let ghost = null, moved = false;
    try { ch.setPointerCapture(e.pointerId); } catch (_) { }
    const mv = ev => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 7) return;
      if (!moved) { moved = true; ghost = el(`<div class="lg-ghost">${nm(c)}</div>`); document.body.appendChild(ghost); ch.classList.add('drag'); }
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = (ev.clientY - 28) + 'px';
      const t = near(ev.clientX, ev.clientY); $$('.lg-dot', host).forEach(d => d.classList.toggle('hot', d === t));
    };
    const up = ev => {
      ch.removeEventListener('pointermove', mv); ch.removeEventListener('pointerup', up); ch.removeEventListener('pointercancel', up);
      if (!moved) return;
      host._skipClick = true; setTimeout(() => host._skipClick = false, 50);
      ghost.remove(); ch.classList.remove('drag'); $$('.lg-dot', host).forEach(d => d.classList.remove('hot'));
      const t = ev.type === 'pointerup' ? near(ev.clientX, ev.clientY) : null;
      if (t) attempt(c, +t.dataset.d); else if (ev.type === 'pointerup') say2('', 'שחררו את השם ממש על אחת הנקודות.');
    };
    ch.addEventListener('pointermove', mv); ch.addEventListener('pointerup', up); ch.addEventListener('pointercancel', up);
  });
  function near(x, y) {
    let best = null, bd = 34;
    $$('.lg-dot:not(:disabled)', host).forEach(d => { const r = d.getBoundingClientRect(), dd = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)); if (dd < bd) { bd = dd; best = d; } });
    return best;
  }
}

/* המשחק עצמו (a_label) נרשם ב-gamesA1.js */
