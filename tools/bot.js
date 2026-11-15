/* בוט בדיקה: משחק כל משחק בדפדפן (קובץ תלמיד) וקורא את התשובות הנכונות מהמפרטים שנרשמים בזמן אמת.
   שימוש: פותחים dist/index.html בדפדפן ומריצים את כל הקובץ בקונסולה (או דרך כלי בדיקה). מחזיר טבלת תוצאות.
   כל משחק צריך להגיע ל-100%. הבוט לא מחליף בדיקה חזותית. */
window.__botRun = async function (only) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const specs = { mcq: [], bin: [], sort: [], pred: [] };
  const O = { mcq: window.mcq, bin: window.binGame, sort: window.sortGame, pred: window.predictTable };
  window.mcq = function (p, s) { specs.mcq.push(s); return O.mcq.apply(this, arguments); };
  window.binGame = function (r, s) { specs.bin.push(s); return O.bin.apply(this, arguments); };
  window.sortGame = function (r, s) { specs.sort.push(s); return O.sort.apply(this, arguments); };
  window.predictTable = function (r, s) { specs.pred.push(s); return O.pred.apply(this, arguments); };
  const txt = e => (e.textContent || '').replace(/\s+/g, ' ').trim();
  const results = []; window.__fast = true;
  const ids = only ? [].concat(only) : GAMES.filter(g => !g.teacherOnly).map(g => g.id);
  for (const id of ids) {
    const g = gameById(id); const host = document.createElement('div'); document.body.appendChild(host);
    let result = null; const ctx = { game: g, root: host, teacher: false, finish(p) { result = p; } };
    const notes = []; Object.keys(specs).forEach(k => specs[k].length = 0);
    try { g.mount(host, ctx); } catch (e) { results.push({ id, error: 'mount: ' + e.message }); host.remove(); continue; }
    let guard = 0, stuck = 0, last = '';
    while (result == null && guard++ < 1500) {
      await sleep(5);
      let acted = false;
      const md = host.querySelector('.lg-mode'); if (md) { md.click(); acted = true; }
      // 0) רכיבים מותאמים שחושפים פעולה נכונה (host._bot)
      if (!acted) { for (const c of host.querySelectorAll('.card')) { if (c._bot && c._bot()) { acted = true; break; } } }
      // 1) תוויות על איור
      const chips = host.querySelectorAll('.lg-chip'); if (!acted && chips.length) {
        const c = chips[0], i = +c.dataset.c, d = host.querySelector(`.lg-dot[data-d="${i}"]`); c.click(); d.click(); acted = true;
      }
      // 2) סידור
      if (!acted && host.querySelector('#slots')) {
        const pool = [...host.querySelectorAll('#pool [data-i]:not([disabled])')].filter(b => !b.disabled);
        if (pool.length) { pool.sort((a, b) => +a.dataset.i - +b.dataset.i)[0].click(); acted = true; }
        else { const chk = host.querySelector('#chk'); const go = host.querySelector('#go'); if (go) { go.click(); acted = true; } else if (chk && !chk.disabled) { chk.click(); acted = true; } }
      }
      // 3) התאמה
      if (!acted && host.querySelector('[data-l]')) {
        const l = host.querySelector('[data-l]:not([disabled])'); if (l) { const i = l.dataset.l; l.click(); host.querySelector(`[data-r="${i}"]:not([disabled])`).click(); acted = true; }
      }
      // 4) מיון לתיבות
      if (!acted && host.querySelector('.bin-row')) {
        const chip = host.querySelector('.chip-pool > .chipx:not(.placed)');
        if (chip) {
          const name = txt(chip).replace(/^\S+\s/, ''); const spec = specs.bin[specs.bin.length - 1];
          const it = spec.items.find(x => txt(chip).includes(x.t)); if (!it) { notes.push('bin item not found: ' + txt(chip)); break; }
          chip.click(); host.querySelector(`[data-b="${it.b}"]`).click(); acted = true;
        } else { const go = host.querySelector('#go'); if (go) { go.click(); acted = true; } }
      }
      // 5) מיון פריט-פריט
      if (!acted && host.querySelector('[data-k]') && host.querySelector('.q.center')) {
        const q = txt(host.querySelector('.q.center')), spec = specs.sort[specs.sort.length - 1]; const it = spec.items.find(x => x.t === q);
        const btns = [...host.querySelectorAll('[data-k]')].filter(b => !b.disabled);
        if (it && btns.length) { host.querySelector(`[data-k="${it.b}"]`).click(); acted = true; } else { const nx = host.querySelector('#nx'); if (nx) { nx.click(); acted = true; } }
      } else if (!acted && host.querySelector('#nx') && host.querySelector('#fb .explain')) { host.querySelector('#nx').click(); acted = true; }
      // 6) טבלת ניבוי
      if (!acted && host.querySelector('.pcell')) {
        const spec = specs.pred[specs.pred.length - 1]; const cells = [...host.querySelectorAll('.pcell:not([disabled])')];
        if (cells.length) {
          let todo = null; for (const b of cells) { const r = +b.dataset.r, c = +b.dataset.c, want = spec.rows[r].cells[c].opts[spec.rows[r].cells[c].ok]; if (!txt(b).startsWith(want)) { todo = b; break; } }
          if (todo) { todo.click(); acted = true; } else { const chk = host.querySelector('#pchk:not([hidden])'); if (chk) { chk.click(); acted = true; } else { const go = host.querySelector('#pgo'); if (go) { go.click(); acted = true; } } }
        } else { const go = host.querySelector('#pgo'); if (go) { go.click(); acted = true; } }
      }
      // 7) שאלה אמריקאית
      if (!acted) {
        const m = [...host.querySelectorAll('.mcq')].find(b => [...b.querySelectorAll('.opt')].some(o => !o.disabled));
        if (m) {
          const q = txt(m.querySelector('.q')); const spec = specs.mcq.slice().reverse().find(s => txt({ textContent: s.q.replace(/<[^>]+>/g, '') }) === q.replace(/<[^>]+>/g, '') || q.includes(s.q.replace(/<[^>]+>/g, '').slice(0, 25)));
          if (!spec) { notes.push('mcq spec not found: ' + q.slice(0, 40)); break; }
          const right = spec.options.find(o => o.ok).t.replace(/<[^>]+>/g, '');
          const opts = [...m.querySelectorAll('.opt')].filter(o => !o.disabled); const opt = opts.find(o => txt(o.querySelector('span')) === right.trim()) || opts.find(o => txt(o).includes(right.trim()));
          if (!opt) { notes.push('mcq option not found: ' + right.slice(0, 30)); break; } opt.click(); acted = true;
        }
      }
      // 8) כפתורי המשך כלליים
      if (!acted) {
        if (host.querySelector('#nightnote')) { host.querySelector('[data-t="talk"]').click(); acted = true; }
        if (!acted && host.querySelector('[data-t="dx"]') && !host.querySelector('.mcq') && !host.querySelector('#startdx') === false) { host.querySelector('[data-t="dx"]').click(); }
        const sel = ['#startdx', '#cnext', '#pgo', '#gonx', '#lg-next', '#go', '#nx', '#gx', '#enext', '#hgo', '#cgo', '#ernx', '#hnx'];
        for (const s of (acted ? [] : sel)) { const b = host.querySelector(s); if (b && !b.disabled) { if (s === '#gonx' && host.querySelector('[data-o]')) continue; b.click(); acted = true; break; } }
        if (!acted && host.querySelector('[data-o]')) { const u = [...host.querySelectorAll('[data-o]')].find(b => !b.textContent.includes('✓')); if (u) { u.click(); acted = true; } else { const gx = host.querySelector('#gonx'); if (gx) { gx.click(); acted = true; } } }
        if (!acted) { const nb = [...host.querySelectorAll('button')].find(b => !b.disabled && /^(הבא ←|לסיכום 🏁|המשך ←|הצעד הבא ←|סיימתי, להמשיך ←|➡)/.test(txt(b))); if (nb) { nb.click(); acted = true; } }
        if (!acted) { const gm = [...host.querySelectorAll('.btn.primary')].find(b => !b.disabled && /המשך/.test(txt(b))); if (gm) { gm.click(); acted = true; } }
      }
      const sig = host.innerHTML.length + '|' + guard; if (!acted) { stuck++; if (stuck > 40) { notes.push('stuck: ' + txt(host).slice(0, 80)); break; } } else stuck = 0;
    }
    results.push({ id, pct: result, notes: notes.join(' | ') });
    host.remove();
  }
  window.__fast = false;
  window.mcq = O.mcq; window.binGame = O.bin; window.sortGame = O.sort; window.predictTable = O.pred;
  return results;
};
