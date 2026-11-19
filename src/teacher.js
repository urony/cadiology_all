'use strict';
/* ===== מצב מורה: קישורים, איסוף תוצאות, ספריית מקרים ===== */
const TStore = {
  d: { rows: [] },
  load() { try { const s = localStorage.getItem(CFG.TEACHER_STORE); if (s) this.d = JSON.parse(s); } catch (e) { } },
  save() { try { localStorage.setItem(CFG.TEACHER_STORE, JSON.stringify(this.d)); } catch (e) { } },
  add(o) { const key = o.n + '|' + o.c; const i = this.d.rows.findIndex(r => (r.n + '|' + r.c) === key); if (i >= 0) { if ((this.d.rows[i].t || 0) <= o.t) this.d.rows[i] = o; else return 'old'; } else this.d.rows.push(o); this.save(); return i >= 0 ? 'upd' : 'new'; },
  clear() { this.d.rows = []; this.save(); },
};
TStore.load();
const GAME_TITLE = id => { const g = gameById(id); return g ? g.title : id; };

/* ===== דף המורה: מסך הפתיחה של קובץ המורה ===== */
const PART_ICON = { A: '📘', B: '🧪', C: '🚑' };
function teacherPage(root) {
    const rows = TStore.d.rows;
  const allG = GAMES.filter(g => !g.embed).map(g => g.id);
  const avgOf = r => { const v = Object.values(r.g).map(x => x[0]); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; };
  const mis = {}; rows.forEach(r => Object.keys(r.m || {}).forEach(k => mis[k] = (mis[k] || 0) + r.m[k]));
  const topMis = Object.entries(mis).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const perGame = allG.map(id => { const v = rows.map(r => r.g[id] ? r.g[id][0] : null).filter(x => x != null); return { id, n: v.length, avg: v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null }; });
  const gameRow = g => `<div class="row sp" style="gap:8px;padding:8px 0;border-top:1px solid var(--line)"><div class="row" style="gap:10px;flex:1;min-width:0"><span style="font-size:1.6rem">${g.icon}</span><div style="min-width:0"><b>${g.title}</b>${g.teacherOnly ? ' <span class="pill">לשליחה למורה בלבד</span>' : ''}<div class="muted small">${g.desc}</div></div></div><button class="btn sm primary" data-g="${g.id}">👁️ תשובות</button></div>`;
  const partCard = p => { const gs = GAMES.filter(g => g.part === p && !g.embed); return `<details class="card tpart"><summary><span>${PART_ICON[p]} חלק ${PARTS[p].l}: ${PARTS[p].t}</span><span class="pill">${gs.length} משחקים</span></summary><div style="margin-top:8px">${gs.map(gameRow).join('')}</div></details>`; };
  root.innerHTML = `<h1>🎓 דף מורה</h1>
    ${say('כל חלק (א׳, ב׳, ג׳) סגור בהתחלה כדי שלא תצטרכו לגלול. לוחצים על חלק כדי לראות את המשחקים שלו, ועל "תשובות" כדי לראות את הפתרון המלא. הקישורים לתלמידים נמצאים מתחת.', 'happy')}
    <div class="card" style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn primary grow" href="#/key">📋 מפתח תשובות מלא (להדפסה)</a><a class="btn grow" href="#results">📥 תוצאות תלמידים</a><a class="btn grow" href="#/certs">🎓 מחולל תעודות</a></div>
    ${activeParts().map(partCard).join('')}    ${studentLinksCard()}

    <div class="card" id="results"><h2>📥 איסוף תוצאות תלמידים</h2>
      <p class="small muted">כל תלמיד לוחץ על "שליחת תוצאות" ומעביר לכם קוד שמתחיל ב-CL1. הדביקו כאן קוד אחד או כמה (מופרדים בשורות).</p>
      <textarea id="paste" placeholder="הדביקו כאן קודים…" style="direction:ltr"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn primary grow" id="imp">ייבוא</button><button class="btn" id="csv" ${rows.length ? '' : 'disabled'}>⬇️ CSV</button><button class="btn ghost" id="clr" ${rows.length ? '' : 'disabled'}>🗑️ ניקוי</button></div>
      <p class="small muted" style="margin-top:8px">הנתונים נשמרים בדפדפן שלכם בלבד, במכשיר הזה.</p></div>
    ${rows.length ? `<div class="card"><h2>👩‍🎓 תלמידים (${rows.length})</h2><div style="overflow-x:auto"><table class="lab"><thead><tr><th>שם</th><th>כיתה</th><th>משחקים</th><th>ממוצע</th><th></th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${esc(r.n)}</td><td>${esc(r.c)}</td><td class="v">${Object.keys(r.g).length}/${allG.length}</td><td class="v">${avgOf(r)}%</td><td><button class="btn sm" data-st="${i}">פרטים</button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><h2>📈 ממוצע כיתתי לפי משחק</h2>${perGame.map(g => `<div class="meter"><div class="nm small">${GAME_TITLE(g.id)} <span class="muted">(${g.n})</span></div><div class="bar"><i style="width:${g.avg || 0}%"></i></div><b class="small" style="width:44px;text-align:end">${g.avg == null ? '–' : g.avg + '%'}</b></div>`).join('')}</div>
      <div class="card"><h2>⚠️ הטעויות הנפוצות בכיתה</h2>${topMis.length ? topMis.map(([k, n]) => `<div class="row sp" style="margin:6px 0"><span>${TAGS[k] || k}</span><span class="pill r">${n}</span></div>`).join('') : '<p class="muted">עדיין אין נתונים.</p>'}</div>` : ''}`;
  on(root, 'click', '[data-cp]', async (e, b) => { try { await navigator.clipboard.writeText(b.dataset.cp); toast('הועתק ✅'); } catch (er) { toast('סמנו והעתיקו ידנית'); } });
  const rs = $('a[href="#results"]', root); if (rs) rs.onclick = e => { e.preventDefault(); $('#results', root).scrollIntoView({ behavior: 'smooth' }); };
  const imp = $('#imp', root); if (imp) imp.onclick = () => {
    const lines = $('#paste', root).value.split(/\n+/); let n = 0, bad = 0;
    lines.forEach(l => { if (!l.trim()) return; const o = ResultCode.parse(l); if (o) { TStore.add(o); n++; } else bad++; });
    toast(n ? `יובאו ${n} תוצאות${bad ? ` (${bad} לא תקינות)` : ''}` : 'לא נמצאו קודים תקינים'); if (n) teacherPage(root);
  };
  const clr = $('#clr', root); if (clr) clr.onclick = () => { if (confirm('למחוק את כל התוצאות שנאספו? אי אפשר לשחזר.')) { TStore.clear(); teacherPage(root); } };
  const csv = $('#csv', root); if (csv) csv.onclick = () => {
    const head = ['שם', 'כיתה', 'ממוצע', ...allG.map(GAME_TITLE)];
    const lines = [head].concat(rows.map(r => [r.n, r.c, avgOf(r), ...allG.map(id => r.g[id] ? r.g[id][0] : '')]));
    const txt = '﻿' + lines.map(l => l.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = 'results.csv'; a.click();
  };
  on(root, 'click', '[data-st]', (e, b) => {
    const r = rows[+b.dataset.st];
    modal(`<h2>${esc(r.n)} ${r.c ? '· ' + esc(r.c) : ''}</h2><p class="small muted">נשלח: ${new Date(r.t).toLocaleString('he-IL')}</p>${Object.keys(r.g).map(id => `<div class="meter"><div class="nm small">${GAME_TITLE(id)}</div><div class="bar"><i style="width:${r.g[id][0]}%"></i></div><b class="small" style="width:44px;text-align:end">${r.g[id][0]}%</b></div>`).join('') || '<p class="muted">אין משחקים.</p>'}
      <h3 style="margin-top:14px">טעויות נפוצות</h3>${Object.entries(r.m || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `<div class="row sp small" style="margin:4px 0"><span>${TAGS[k] || k}</span><span class="pill r">${n}</span></div>`).join('') || '<p class="muted small">אין.</p>'}`);
  });
}

/* ===== מבט מורה על משחק: כל התשובות פתוחות מראש ===== */
const optsKey = (q, opts) => `<div class="q" style="margin-top:12px">${q}</div>` + opts.map(o => o.ok ? `<div class="explain good" style="margin:6px 0">✅ <b>${o.t}</b>${o.why ? `<div class="small">${o.why}</div>` : ''}</div>` : `<div class="small" style="margin:6px 12px;color:var(--muted)">✗ ${o.t}${o.why ? ` <span class="muted">– ${o.why}</span>` : ''}</div>`).join('');

/* מבט מורה על משחק: משחק יכול להגדיר g.teacherView() שמחזיר HTML מיוחד (למשל טבלת השוואה פתורה) */
function teacherGameView(g, body, mkCtx) {
  if (g.part === 'B' && typeof teacherLabView === 'function') return teacherLabView(g, body);
  if (g.part === 'C' && typeof teacherShiftView === 'function') return teacherShiftView(g, body);
  let special = '';
  if (g.teacherView) special = g.teacherView();
  const dyn = g.id === 'a_review' || g.id === 'a_exam' || g.id.startsWith('a_mix');
  if (dyn) special = '<div class="card soft small">משחק שנבנה מהשאלות של שאר המשחקים בחלק א׳ (בתרגול המעורב: כל השאלות של הנושא). אפשר להפעיל אותו ולנסות. התשובות הנכונות של כל השאלות מופיעות במפתח של המשחקים האחרים.</div>';
  const d = dyn ? null : collectKey([g])[0];
  const learned = g.learned && g.learned.length ? `<div class="card learned"><h3>📚 מה למדנו (מה שהתלמיד רואה בסיום)</h3><ul>${g.learned.map(x => `<li>${x}</li>`).join('')}</ul></div>` : '';
  const key = d ? gameKeyBlock(d, null, true) : '';
  const hasKey = d && (d.q.length || d.o.length || d.b.length || d.m.length || (d.p && d.p.length));
  body.insertAdjacentHTML('beforeend', special + (hasKey ? `<h3 style="margin:14px 0 6px">✅ כל התשובות הנכונות</h3>` + key : (special ? '' : '<div class="card soft small">משחק סימולציה: אין שאלות עם תשובה אחת נכונה. הסבר המשחק מופיע ב"הערה למורה" למעלה, ואפשר להפעיל אותו ולנסות בעצמכם.</div>')) + learned);
  const play = el('<div class="card"><button class="btn primary block" id="tplay">▶ הפעלת המשחק (עם סימון התשובות)</button><div id="tgame" style="margin-top:12px"></div></div>');
  body.appendChild(play);
  $('#tplay', play).onclick = () => { $('#tplay', play).remove(); const host = $('#tgame', play); g.mount(host, mkCtx(g, host)); };
}

/* ===== מפתח תשובות: נאסף אוטומטית מהמשחקים (חלק א׳) + סיכום לחלקים ב׳ וג׳ ===== */
/* חילוץ שאלות שמוסתרות מאחורי שלבי משחק: קוראים את מערכי השאלות מקוד הפונקציה עצמה */
function litEnd(src, start) {
  let d = 0, q = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; }
    else if (c === "'" || c === '"' || c === '`') q = c;
    else if (c === '[' || c === '{' || c === '(') d++;
    else if (c === ']' || c === '}' || c === ')') { d--; if (d === 0) return i + 1; }
  }
  return -1;
}
function litItems(src) {
  const out = [], re = /runQuiz\(\s*\w+\s*,\s*\w+\s*,\s*\[/g; let m;
  while ((m = re.exec(src))) {
    const st = m.index + m[0].length - 1, en = litEnd(src, st);
    if (en < 0) continue;
    try { const arr = new Function('fig', 'return ' + src.slice(st, en))(fig); arr.forEach(x => out.push(x)); } catch (e) { }
  }
  return out;
}
function collectKey(list) {
  const names = ['runStages', 'runQuiz', 'mcq', 'orderGame', 'binGame', 'matchGame', 'sortGame', 'predictTable'];
  const saved = {}; names.forEach(n => saved[n] = window[n]);
  const res = []; let cur = null;
  const dummy = () => document.createElement('div');
  const go = fn => { try { fn(); } catch (e) { } };
  window.runStages = (root, ctx, stages) => { stages.forEach(st => go(() => st.run(dummy(), () => { }))); };
  window.runQuiz = (root, ctx, items) => { items.forEach(it => cur.q.push(it)); };
  window.mcq = (p, spec) => { cur.q.push(spec); return dummy(); };
  window.orderGame = (r, o) => { cur.o.push(o.steps); go(() => o.onDone && o.onDone(100)); };
  window.binGame = (r, o) => { cur.b.push(o); go(() => o.onDone && o.onDone(100)); };
  window.sortGame = (r, o) => { cur.b.push(o); go(() => o.onDone && o.onDone(100)); };
  window.matchGame = (r, o) => { cur.m.push(o.pairs); go(() => o.onDone && o.onDone(100)); };
  window.predictTable = (r, o) => { (cur.p = cur.p || []).push(o); go(() => o.onDone && o.onDone(100)); };
  (list || GAMES.filter(g => g.part === 'A' && g.id !== 'a_review' && g.id !== 'a_exam' && !g.id.startsWith('a_mix'))).forEach(g => {
    cur = { g, q: [], o: [], b: [], m: [] };
    const root = dummy();
    go(() => g.mount(root, { game: g, root, teacher: true, finish() { } }));
    go(() => litItems(g.mount.toString()).forEach(it => { if (!cur.q.some(x => x.q === it.q)) cur.q.push(it); }));
    res.push(cur);
  });
  names.forEach(n => window[n] = saved[n]);
  return res;
}
function keyHTML() {
  const data = collectKey();
  const qli = it => { const r = it.options.filter(o => o.ok); return `<li><div>${it.q}</div><div class="kans">✔ ${r.map(o => o.t).join(' ; ')}</div>${r[0] && r[0].why ? `<div class="small muted">${r[0].why}</div>` : ''}</li>`; };
  let h = '<h1>📋 מפתח תשובות</h1><p class="small muted">חלק א׳ נאסף אוטומטית מהמשחקים (כך שהוא תמיד מעודכן). בחלק ב׳ המטופלים נוצרים אקראית בכל פעם, ולכן מופיעים כאן הכללים והדפוסים; בחלק ג׳ מופיעים כל המקרים.</p>';
  h += '<h2>📘 חלק א׳</h2>';
  data.forEach(d => { h += gameKeyBlock(d, qli); });
  h += KEY_REST(); return h;
}
function gameKeyBlock(d, qli, noNote) {
  qli = qli || (it => { const r = it.options.filter(o => o.ok); return `<li><div>${it.q}</div><div class="kans">✔ ${r.map(o => o.t).join(' ; ')}</div>${r[0] && r[0].why ? `<div class="small muted">${r[0].why}</div>` : ''}</li>`; });
  let h = '';
  {
    h += `<div class="card"><h3>${d.g.icon} ${d.g.title}</h3>${d.g.teacherNote && !noNote ? `<p class="small"><b>הערה למורה:</b> ${d.g.teacherNote}</p>` : ''}`;
    d.b.forEach(b => { h += `<p class="small"><b>מיון:</b></p><ul class="small">${b.buckets.map((bk, k) => `<li><b>${bk}:</b> ${b.items.filter(i => i.b === k).map(i => i.t).join(' · ')}</li>`).join('')}</ul>`; });
    d.o.forEach(st => { h += `<p class="small"><b>סדר נכון:</b></p><ol class="small">${st.map(x => `<li>${x}</li>`).join('')}</ol>`; });
    (d.p || []).forEach(pt => { h += `<p class="small"><b>טבלת ניבוי (נכון):</b></p><div style="overflow-x:auto"><table class="cmp small"><thead><tr><th></th>${pt.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${pt.rows.map(r => `<tr><th>${r.label}</th>${r.cells.map(c => `<td><b>${c.opts[c.ok]}</b></td>`).join('')}</tr>`).join('')}</tbody></table></div>`; });
    d.m.forEach(pr => { h += `<p class="small"><b>התאמות:</b></p><ul class="small">${pr.map(p => `<li>${p[0]} ← ${p[1]}</li>`).join('')}</ul>`; });
    if (d.q.length) h += `<p class="small"><b>שאלות (${d.q.length}):</b></p><ol class="kq small">${d.q.map(qli).join('')}</ol>`;
    h += '</div>';
  }
  return h;
}
function KEY_REST() {
  let h = '';
  if (typeof keyPartB === 'function') h += keyPartB();
  if (typeof keyPartC === 'function') h += keyPartC();
  return h;
}
function keyPage(root) {
  root.innerHTML = `<div class="row noprint" style="margin-bottom:10px"><a class="btn sm" href="#/home">→ חזרה</a><button class="btn sm primary grow" id="kp">🖨️ הדפסה / PDF</button><button class="btn sm grow" id="kd">⬇️ שמירה כקובץ</button></div><div id="kbody">${keyHTML()}</div>`;
  $('#kp', root).onclick = () => window.print();
  $('#kd', root).onclick = () => {
    const doc = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>מפתח תשובות</title><body style="font-family:Arial,sans-serif;max-width:800px;margin:auto;padding:16px;line-height:1.5">${$('#kbody', root).innerHTML}</body></html>`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([doc], { type: 'text/html;charset=utf-8' })); a.download = 'answer-key.html'; a.click();
  };
}

/* ===== מחולל תעודות למורה: שמות, סוג תעודה, נושא; הדפסה או PDF לכולם בבת אחת ===== */
function certsPage(root) {
  const D = { kind: 'part', what: '', free: '', pct: '', sig: '', dr: null, sel: 0 };
  try { const s = JSON.parse(localStorage.getItem('cardiolab_certgen') || '{}'); Object.assign(D, s, { sel: 0 }); } catch (e) { }
  const names = () => ($('#cnames', root).value || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
  root.innerHTML = `<button class="back" data-back>→ חזרה לדף המורה</button><h1>🎓 מחולל תעודות</h1>
    <div class="card"><p class="small muted" style="margin-top:0">כותבים שם בכל שורה, בוחרים סוג תעודה ונושא, ומדפיסים. כל תלמיד מקבל עמוד משלו; בחלון ההדפסה אפשר לבחור "שמירה כ-PDF".</p>
      <label class="small"><b>שמות התלמידים</b> (שם בכל שורה)</label><textarea id="cnames" placeholder="נועה כהן&#10;דני לוי" style="min-height:110px">${esc(D.names || '')}</textarea>
      <label class="small"><b>סוג תעודה</b></label><select id="ckind"><option value="part">תעודת השתתפות</option><option value="done">תעודת סיום</option><option value="excel">תעודת הצטיינות</option></select>
      <label class="small"><b>על מה?</b></label><select id="cwhat"><option value="">הכלי כולו (מעבדת הלב)</option>${GAMES.filter(g => !g.embed).map(g => `<option value="${g.id}">${esc(g.title)}</option>`).join('')}</select>
      <input type="text" id="cfree" placeholder="או נושא חופשי, למשל: שיעור קרדיולוגיה, פרק אק"ג (לא חובה)" maxlength="60" style="margin-top:6px">
      <div class="row" style="margin-top:6px;gap:8px"><input type="number" id="cpct" placeholder="ציון (לא חובה)" min="0" max="100" style="flex:1"><input type="text" id="csig" placeholder="שם החותם/ת, למשל: המורה דנה" maxlength="30" style="flex:2"></div>
      <label class="row small" style="margin-top:8px;gap:8px"><input type="checkbox" id="cdr" style="width:auto"> להוסיף "ד״ר" לפני השם</label></div>
    <div class="card"><div class="row sp"><b>תצוגה מקדימה</b><span class="small muted" id="cnt"></span></div><div id="cchips" class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0"></div><div id="cprev"></div>
      <div class="row" style="margin-top:12px"><button class="btn primary grow" id="cprintall">🖨️ הדפסה / PDF לכולם</button><button class="btn grow" id="cpng1">⬇️ תמונה לתלמיד המוצג</button></div></div>`;
  $('#ckind', root).value = D.kind; $('#cwhat', root).value = D.what; $('#cfree', root).value = D.free; $('#cpct', root).value = D.pct; $('#csig', root).value = D.sig;
  $('#cdr', root).checked = D.dr == null ? D.kind === 'excel' : !!D.dr;
  const build = nm => {
    const g = $('#cwhat', root).value ? gameById($('#cwhat', root).value) : null, free = $('#cfree', root).value.trim(), pct = $('#cpct', root).value;
    return { name: nm, kind: $('#ckind', root).value, dr: $('#cdr', root).checked, what: free || (g ? 'משחק ' + g.title : 'מעבדת הלב'), pct: pct === '' ? null : Math.max(0, Math.min(100, +pct)), sig: 'חתימת ' + ($('#csig', root).value.trim() || 'המורה'), date: new Date().toLocaleDateString('he-IL'), sub: free ? 'מעבדת הלב' : undefined };
  };
  const refresh = () => {
    const n = names(); D.sel = Math.min(D.sel, Math.max(0, n.length - 1));
    $('#cnt', root).textContent = n.length ? `${n.length} תעודות` : 'עוד אין שמות';
    $('#cchips', root).innerHTML = n.map((x, i) => `<button type="button" class="btn small${i === D.sel ? ' primary' : ''}" data-i="${i}">${esc(x)}</button>`).join('');
    $('#cprev', root).innerHTML = certHTML(build(n[D.sel] || ''));
    ['cprintall', 'cpng1'].forEach(id => $('#' + id, root).disabled = !n.length);
    try { localStorage.setItem('cardiolab_certgen', JSON.stringify({ names: $('#cnames', root).value, kind: $('#ckind', root).value, what: $('#cwhat', root).value, free: $('#cfree', root).value, pct: $('#cpct', root).value, sig: $('#csig', root).value, dr: $('#cdr', root).checked })); } catch (e) { }
  };
  ['cnames', 'ckind', 'cwhat', 'cfree', 'cpct', 'csig', 'cdr'].forEach(id => { $('#' + id, root).addEventListener('input', refresh); $('#' + id, root).addEventListener('change', refresh); });
  $('#ckind', root).addEventListener('change', () => { $('#cdr', root).checked = $('#ckind', root).value === 'excel'; refresh(); });
  $('[data-back]', root).onclick = () => location.hash = '#/home';
  $('#cchips', root).onclick = e => { const b = e.target.closest('[data-i]'); if (b) { D.sel = +b.dataset.i; refresh(); } };
  $('#cprintall', root).onclick = () => printCerts(names().map(build));
  $('#cpng1', root).onclick = () => { const n = names(); certPng(build(n[D.sel])); };
  refresh();
}

/* ===== קישורים לתלמידים: מהדף הזה המורה מעתיק קישור לכל הכלי, לחלק או למשחק בודד ===== */
function studentUrl(rel) { try { return new URL(STUDENT_BASE + rel, location.href).href; } catch (e) { return STUDENT_BASE + rel; } }
function studentLinksCard() {
  const row = (label, rel) => `<div class="row" style="gap:6px;margin:6px 0;align-items:center"><span class="small" style="flex:0 0 38%">${label}</span><input type="text" readonly value="${esc(studentUrl(rel))}" style="direction:ltr;flex:1;min-width:0"><button class="btn sm" data-cp="${esc(studentUrl(rel))}">העתקה</button><a class="btn sm" href="${esc(studentUrl(rel))}" target="_blank" rel="noopener">פתיחה</a></div>`;
  return `<div class="card" id="slinks"><h2>🔗 קישורים לתלמידים</h2><p class="small muted" style="margin-top:0">קישורים לגרסת התלמיד (בלי תשובות ובלי כניסת מורה). מעתיקים ושולחים.</p>
    ${row('❤️ הכלי כולו', 'index.html')}${activeParts().map(p => row(PART_ICON[p] + ' חלק ' + PARTS[p].l + ' כולו', 'parts/part-' + p + '.html')).join('')}
    <details style="margin-top:8px"><summary><b>❓ שאלות רב-ברירה בלבד (לחזרה)</b></summary><p class="small muted">קישור שמציג לתלמיד רק את שאלות הרב-ברירה של הנושא, מעורבבות, בלי משחקים ואיורים. כל השאלות של הנושא, ב-20 בכל פעם.</p>${GAMES.filter(g => g.id.startsWith('a_mix')).map(g => row(g.icon + ' ' + g.title.replace('תרגול מעורב: ', ''), 'parts/game-' + g.id + '.html')).join('')}</details>
    <details style="margin-top:8px"><summary><b>משחק בודד</b></summary>${GAMES.filter(g => !g.embed).map(g => row(g.icon + ' ' + g.title.split(':')[0], 'parts/game-' + g.id + '.html')).join('')}</details></div>`;
}
