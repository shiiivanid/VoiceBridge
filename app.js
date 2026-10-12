/* VoiceBridge app: screens, state and interactions. */
(function () {
  const D = window.VB_DATA, E = window.VB_ENGINE, G = window.VB_GUIDE;
  const pct = E.pct;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const quoteHTML = (t) => esc(t).replace(/\[(name|number removed|email removed)\]/g, (m, x) => `<span class="redacted">${x === 'name' ? 'name removed' : x}</span>`);
  const today = new Date();
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtShort = (d) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const fixCase = (s) => s.replace(/\b(african|coloured|indian|white)\b/gi, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());

  // ------------------------------------------------------------ Icons
  const I = {
    lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    eyeoff: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    laptop: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/></svg>',
    users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.2A5 5 0 0 1 21.5 19"/></svg>',
    building: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/></svg>',
    exec: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-6h4v6"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/></svg>',
    chev: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    up: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    route: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    seal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    silence: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>',
    wait: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
  };
  const LOGO = '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="8" fill="var(--accent)"/><path d="M5 19.5c2.6-6.4 15.4-6.4 18 0" fill="none" stroke="var(--accent-ink)" stroke-width="2.4" stroke-linecap="round"/><path d="M9 19.5v-3.6M14 19.5v-5.2M19 19.5v-3.6" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round"/></svg>';

  // ------------------------------------------------------------ State
  const S = {
    screen: 'start',
    files: { responses: null, headcount: null },
    sample: false,
    meta: { org: 'Your organisation', survey: 'Employee survey', period: '' },
    cols: null, ds: null, a: null,
    settings: { minGroup: 5, invited: null },
    open: null, lens: null, drill: null, themeOpen: null,
    store: { release: null, responses: {}, conf: {} },
    composing: null, empDay: 0, deptPick: null,
    error: null,
  };
  const LEADERS = () => (S.sample ? D.leaders : {});
  const storeKey = () => 'vb:' + (S.ds ? fingerprint(S.ds.respondents.length + ':' + S.meta.org + ':' + S.ds.dims.map((d) => d.key).join()) : 'none');
  function load() { try { const v = JSON.parse(localStorage.getItem(storeKey()) || 'null'); if (v) S.store = Object.assign({ release: null, responses: {}, conf: {} }, v); } catch (e) { /* storage unavailable */ } }
  function save() { try { localStorage.setItem(storeKey(), JSON.stringify(S.store)); } catch (e) { /* storage unavailable */ } }

  function fingerprint(str) {
    let h1 = 0x811c9dc5, h2 = 0x1234567;
    for (let i = 0; i < str.length; i++) { h1 ^= str.charCodeAt(i); h1 = Math.imul(h1, 16777619); h2 = Math.imul(h2 ^ str.charCodeAt(i), 2246822507); }
    const hex = ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')).toUpperCase();
    return hex.slice(0, 4) + ' · ' + hex.slice(4, 8) + ' · ' + hex.slice(8, 12);
  }

  // ------------------------------------------------------------ Routing
  const DATA_SCREENS = ['check', 'reading', 'results', 'release', 'follow', 'employees'];
  function go(screen, opts = {}) {
    if (DATA_SCREENS.includes(screen) && !S.cols) screen = 'start';
    if (['results', 'release', 'follow', 'employees'].includes(screen) && !S.a) screen = S.cols ? 'check' : 'start';
    S.screen = screen;
    if (location.hash.slice(1) !== screen) history.replaceState(null, '', '#' + screen);
    render();
    if (!opts.keepScroll) window.scrollTo({ top: 0 });
  }
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h && h !== S.screen) { if (!S.a && ['results', 'release', 'follow', 'employees'].includes(h)) bootSample(); go(h); } });

  // ------------------------------------------------------------ Render root
  function render() {
    const app = $('#app');
    app.innerHTML = bar() + `<main id="main">${SCREENS[S.screen]()}</main>`;
    after[S.screen] && after[S.screen]();
  }

  function bar() {
    const steps = [['results', 'Results', 1], ['release', 'Release', 2], ['follow', 'Follow-through', 3]];
    const released = !!S.store.release;
    return `<header class="bar"><div class="bar-in">
      <button class="brand" data-act="home" aria-label="VoiceBridge home">${LOGO}<span>VoiceBridge</span></button>
      ${S.a ? `<span class="bar-org">${esc(S.meta.org)} · ${esc(S.meta.survey)}${S.meta.period ? ' · ' + esc(S.meta.period) : ''}</span>` : ''}
      ${S.a && ['results', 'release', 'follow', 'employees'].includes(S.screen) ? `<nav class="steps" aria-label="Steps">${steps.map(([k, l, n]) => {
        const done = (k === 'results' && ['release', 'follow'].includes(S.screen)) || (k === 'release' && released);
        return `<button data-go="${k}" ${S.screen === k || (S.screen === 'employees' && k === 'release') ? 'aria-current="page"' : ''}><span class="n ${done ? 'done' : ''}">${done ? I.check : n}</span>${l}</button>`;
      }).join('')}</nav>` : ''}
    </div></header>`;
  }

  // ------------------------------------------------------------ Start
  function screenStart() {
    const r = S.files.responses, h = S.files.headcount;
    return `<div class="wrap"><section class="start">
      <div>
        <p class="eyebrow">For HR and People &amp; Culture teams</p>
        <h1 style="margin-top:14px">Your people already told you. <em>Make sure it’s heard.</em></h1>
        <p class="lede">Drop in your survey export. VoiceBridge finds what matters most, shows how sure you can be, and releases it to everyone at once, so no finding gets stuck in the inbox of the person it’s about.</p>
        <ol class="how" aria-label="How it works">
          <li><b>Drop</b><span>your survey export</span></li>
          <li><b>Read</b><span>what matters, and how sure you can be</span></li>
          <li><b>Release</b><span>to everyone at the same moment</span></li>
          <li><b>Follow through</b><span>leaders answer in public</span></li>
        </ol>
        <div class="promises">
          <div class="promise">${I.shield}<span>Names, emails and phone numbers are removed before anything is analysed.</span></div>
          <div class="promise">${I.eyeoff}<span>No group smaller than 5 people is ever shown, in any report.</span></div>
          <div class="promise">${I.laptop}<span>Your file is read in this browser. Nothing is uploaded.</span></div>
        </div>
      </div>
      <div class="card drop">
        <label class="dropzone" id="dz-resp" for="f-resp">
          <span style="color:var(--accent)">${I.up}</span>
          ${r ? `<span class="file-ok">${I.check} ${esc(r.name)}</span><span class="faint">${r.rows.length} responses</span>` : `<span class="big">Drop your survey export here</span><span class="faint">You can drop the headcount file at the same time</span><span class="faint">CSV from Microsoft Forms, Google Forms, Qualtrics or SurveyMonkey</span>`}
          <input id="f-resp" type="file" accept=".csv,text/csv" class="sr">
        </label>
        <div class="hc-row">
          ${h ? `${I.check}<span>Headcount: <b>${esc(h.name)}</b> (${h.rows.length} people)</span>` : `<span>Add a headcount file so response rates can be checked for every group.</span><label class="btn-quiet" for="f-hc" style="cursor:pointer">Add headcount</label>`}
          <input id="f-hc" type="file" accept=".csv,text/csv" class="sr">
        </div>
        ${S.error ? `<p class="err" role="alert">${esc(S.error)}</p>` : ''}
        ${r ? `<button class="btn btn-primary btn-lg" data-act="to-check">Continue ${I.arrow}</button>` : ''}
        <div class="or">or</div>
        <button class="sample" data-act="sample">
          <span class="logo">K</span>
          <span><b>Try it with Kumo Logistics</b><small>A fictional South African logistics company: 600 staff, September survey. All data is synthetic.</small></span>
          <span style="color:var(--accent)">${I.arrow}</span>
        </button>
        ${S.a ? `<button class="btn btn-ghost" data-go="results">Back to ${esc(S.meta.org)} results</button>` : ''}
      </div>
    </section></div>`;
  }

  function readFile(file, kind) {
    const fr = new FileReader();
    fr.onload = () => {
      const parsed = E.parseCSV(String(fr.result));
      S.error = null;
      if (!parsed.rows.length) { S.error = `${file.name} looks empty. Export it again as CSV with one row per person.`; return render(); }
      // Dropped files are told apart by content: the one with rating answers is the survey.
      if (kind === 'auto') kind = E.detect(parsed.headers, parsed.rows).some((c) => c.role === 'rating') ? 'responses' : 'headcount';
      if (kind === 'responses') {
        const cols = E.detect(parsed.headers, parsed.rows);
        if (!cols.some((c) => c.role === 'rating')) { S.error = `We couldn’t find rating questions in ${file.name}. VoiceBridge needs answers on a 1–5 scale (numbers, or Strongly disagree to Strongly agree).`; return render(); }
        S.files.responses = { name: file.name, ...parsed };
        S.sample = false; S.a = null;
        const guess = file.name.replace(/\.csv$/i, '').split(/[_\s-]+/)[0] || 'Your organisation';
        S.meta = { org: guess.charAt(0).toUpperCase() + guess.slice(1), survey: 'Employee survey', period: '' };
      } else {
        S.files.headcount = { name: file.name, ...parsed };
      }
      render();
    };
    fr.onerror = () => { S.error = `We couldn’t read ${file.name}. Try saving it again as CSV.`; render(); };
    fr.readAsText(file);
  }

  // ------------------------------------------------------------ Check
  function prepare() {
    const r = S.files.responses;
    S.cols = E.detect(r.headers, r.rows);
    S.ds = E.buildDataset(S.cols, r.rows, S.files.headcount ? S.files.headcount.rows : null);
  }

  function screenCheck() {
    const cols = S.cols, ds = S.ds, r = S.files.responses;
    const pii = cols.filter((c) => c.role === 'pii');
    const ignored = cols.filter((c) => c.role === 'ignore');
    const groups = cols.filter((c) => c.role === 'group');
    const comments = cols.filter((c) => c.role === 'comment');
    const items = cols.filter((c) => c.role === 'rating').length;
    const reversed = cols.filter((c) => c.reverse);
    const hasEmail = pii.some((c) => /email/i.test(c.why));
    const N = ds.population ? ds.population.length : S.settings.invited;
    return `<div class="wrap"><section class="check">
      <div>
        <p class="eyebrow">Before anything is analysed</p>
        <h1 style="margin-top:10px">Here’s what’s in ${S.sample ? 'the Kumo file' : 'your file'}</h1>
        <p class="summary">${r.rows.length} responses · ${items} rating questions in ${ds.dims.length} themes · ${comments.length} comment question${comments.length === 1 ? '' : 's'} · ${groups.length} ways to group people</p>
      </div>

      <div class="card check-sec">
        <h2>Report details</h2>
        <div class="meta-fields">
          <label for="m-org">Organisation<input id="m-org" type="text" value="${esc(S.meta.org)}"></label>
          <label for="m-survey">Survey<input id="m-survey" type="text" value="${esc(S.meta.survey)}"></label>
          <label for="m-period">When it ran<input id="m-period" type="text" placeholder="e.g. September 2026" value="${esc(S.meta.period)}"></label>
        </div>
      </div>

      <div class="card check-sec">
        <h2>${I.shield} Removed before analysis</h2>
        <div class="removed">
          ${pii.map((c) => `<div class="removed-row"><span><b>${esc(c.header)}</b></span><span>${esc(c.why)} · ${c.filled} removed, never analysed</span></div>`).join('')}
          ${ignored.length ? `<div class="removed-row"><span>${ignored.map((c) => esc(c.header)).join(', ')}</span><span>Not needed, not used</span></div>` : ''}
          <div class="removed-row"><span>Names, phone numbers and emails typed into comments</span><span>Removed automatically</span></div>
        </div>
        ${hasEmail ? `<p class="tip">${I.info}<span>Your survey collected email addresses. Next time, switch on anonymous mode in your survey tool. People answer more honestly when they know they can’t be identified.</span></p>` : ''}
      </div>

      <div class="card check-sec">
        <h2>Themes <span class="chip">${ds.dims.length}</span></h2>
        <div class="themes-list">${ds.dims.map((d) => `<div class="theme-pill"><b>${esc(d.label)}</b><small>${d.items.length} question${d.items.length === 1 ? '' : 's'}</small></div>`).join('')}</div>
        ${reversed.length ? `<p class="tip">${I.info}<span><b>Reverse-scored:</b> ${reversed.map((c) => esc(c.header)).join(', ')}. Agreeing with ${reversed.length === 1 ? 'this question' : 'these questions'} means a worse experience, and the answers run opposite to the rest of the survey, so they are flipped before anything is scored.</span></p>` : ''}
      </div>

      <div class="card check-sec">
        <h2>Ways to group people <span class="chip">${groups.length}</span></h2>
        <div class="group-chips">${groups.map((g) => `<span class="chip">${esc(g.header)} <small>${g.semantic === 'team' ? `${g.values.length} teams · confidential checks only` : `${g.values.filter((v) => !E.PREFER_NOT.test(v)).length} ${g.band ? 'bands' : 'groups'}`}</small></span>`).join('')}</div>
        ${groups.some((g) => g.band) ? `<p class="tip">${I.info}<span>${groups.filter((g) => g.band).map((g) => `<b>${esc(g.header)}</b> is grouped into bands (${g.values.map(esc).join(', ')})`).join('; ')}.</span></p>` : ''}
        <p class="tip">${I.info}<span>Teams are too small to report on safely, so they are only used to spot patterns that need a confidential look.</span></p>
      </div>

      <div class="card check-sec">
        <h2>Who was invited</h2>
        ${ds.population ? `<p>Matched to <b>${ds.population.length} people</b> in <b>${esc(S.files.headcount.name)}</b>, by ${ds.population.mapped.map(esc).join(', ')}. Overall response rate: <b>${pct(r.rows.length / ds.population.length)}</b>.</p>`
          : `<div class="inline-field"><label for="invited">How many people were invited?</label><input id="invited" type="number" min="${r.rows.length}" placeholder="e.g. ${Math.round(r.rows.length * 1.5)}" value="${S.settings.invited || ''}"><span class="faint">${N ? `Response rate ${pct(r.rows.length / N)}` : 'Needed for the response rate.'}</span></div>
             <p class="tip">${I.info}<span>With a headcount file (from your HR system or EE report) VoiceBridge can check the response rate of every group, not just the total.</span></p>`}
      </div>

      <div class="card check-sec">
        <h2>${I.eyeoff} Anonymity</h2>
        <div class="inline-field">
          <span>Hide any group smaller than</span>
          <span class="stepper"><button data-act="k-" aria-label="Fewer">−</button><output id="k-out">${S.settings.minGroup}</output><button data-act="k+" aria-label="More">+</button></span>
          <span>people</span>
        </div>
        <p class="tip">${I.info}<span>5 is the common standard. When one group is hidden, the next smallest is hidden too, so nobody can work it out by subtraction.</span></p>
      </div>

      <div class="check-go">
        <button class="btn btn-ghost" data-act="home">Use a different file</button>
        <button class="btn btn-primary btn-lg" data-act="analyse">Read the results ${I.arrow}</button>
      </div>
    </section></div>`;
  }

  // ------------------------------------------------------------ Reading
  function screenReading() {
    const a = S.a, ds = S.ds;
    const pii = S.cols.filter((c) => c.role === 'pii').reduce((s, c) => s + c.filled, 0);
    const log = a.comments.log;
    const typed = log.email + log.phone + log.name;
    const lines = [
      `Removed ${pii} personal identifiers${typed ? `, and ${typed} name${typed === 1 ? '' : 's'} or number${typed === 1 ? '' : 's'} typed into comments` : ''}`,
      a.N ? `Matched ${a.responded} responses to ${a.N} people invited` : `Read ${a.responded} responses`,
      `Compared ${a.groupsTested} groups across ${ds.dims.length} themes`,
      `Hid ${a.suppressed.length} groups smaller than ${a.settings.minGroup}`,
      `Read ${a.comments.all.length} comments`,
      'Tested every finding against the people who stayed silent',
    ];
    return `<div class="wrap"><section class="reading"><div class="reading-in">
      <h1>Reading ${S.sample ? 'Kumo’s' : 'your'} results…</h1>
      <ul class="read-lines">${lines.map((l, i) => `<li data-i="${i}"><span class="tick">${I.check}</span><span>${esc(l)}</span></li>`).join('')}</ul>
      <div><button class="btn-quiet" data-act="skip-read">Skip</button></div>
    </div></section></div>`;
  }
  let readTimer = null;
  function afterReading() {
    const lis = $$('.read-lines li');
    let i = 0;
    const step = () => {
      lis.forEach((li, j) => { li.classList.toggle('on', j < i); li.classList.toggle('now', j === i); });
      if (i > lis.length) { go('results'); return; }
      i++;
      readTimer = setTimeout(step, i > lis.length ? 500 : 430);
    };
    step();
  }

  // ------------------------------------------------------------ Results
  function screenResults(mode = 'practitioner') {
    const a = S.a;
    const lead = mode === 'leadership';
    const toc = [
      ['summary', 'Summary'],
      ['focus', 'Focus areas', a.focus.length],
      ['strengths', 'Strengths', a.strengths.length],
      ['radar', 'On the radar', a.watch.length + a.early.length],
      ...(!lead && a.signals.length ? [['confidential', 'Confidential', a.signals.length, true]] : []),
      ['explore', 'Explore'],
      ['comments', 'Comments', a.comments.all.length],
      ['about', 'About the data'],
    ];
    return `<div class="wrap"><div class="results">
      ${lead ? '' : `<nav class="toc" aria-label="Sections">${toc.map(([id, l, n, lock]) => `<a href="#${id}" data-scroll="${id}" class="${lock ? 'lockline' : ''}"><span class="toc-l">${lock ? I.lock : ''}${l}</span>${n != null ? `<span class="count">${n}</span>` : ''}</a>`).join('')}
        <div class="cta"><button class="btn btn-primary btn-sm" data-go="release" style="width:100%">Release results ${I.arrow}</button></div></nav>`}
      <div class="report" ${lead ? 'style="grid-column:1/-1"' : ''}>
        ${secSummary()}
        ${secFocus()}
        ${secStrengths()}
        ${secRadar()}
        ${lead ? '' : secConfidential()}
        ${secExplore(lead)}
        ${secComments()}
        ${secAbout()}
      </div>
    </div></div>`;
  }

  function secSummary() {
    const a = S.a;
    const items = a.focus.map((f) => (f.kind === 'org' ? `${lc(f.label)} ${f.ct.plural}` : `${fixCase(lc(f.label))} ${f.ct.plural}`));
    const list = items.length > 1 ? items.slice(0, -1).join('; ') + '; and ' + items[items.length - 1] : items[0];
    const s = a.strengths[0];
    const word = ['', 'One thing', 'Two things', 'Three things'][a.focus.length] || `${a.focus.length} things`;
    return `<section class="sec hero" id="summary">
      <p class="eyebrow">${esc(S.meta.survey)}${S.meta.period ? ' · ' + esc(S.meta.period) : ''} · ${esc(S.meta.org)}</p>
      <h1>${esc(a.headline)}</h1>
      <p class="sum">${a.focus.length ? `<b>${word} need${a.focus.length === 1 ? 's' : ''} attention:</b> ${esc(list)}.` : '<b>No finding is strong enough to call a focus area.</b>'} ${s ? `<b>And one to protect:</b> ${s.kind === 'item' ? `${pct(s.p)} say “${esc(lc(s.short))}”.` : esc(fixCase(s.title)) + '.'}` : ''}</p>
      <div class="card resp">
        <div class="resp-big">${a.rr != null ? Math.round(a.rr * 100) + '<small>%</small>' : a.responded}</div>
        <p class="resp-text">${a.N ? `<b>${a.responded} of ${a.N} people</b> responded. The organisation-wide results are accurate to within <b>±${Math.round(a.moe * 100)} points</b>. Every finding below is also tested against the ${a.N - a.responded} people who stayed silent.` : `<b>${a.responded} responses.</b> Add a headcount to check response rates.`}</p>
        ${a.rr != null ? `<div class="resp-bar" aria-hidden="true"><i style="width:${a.rr * 100}%"></i></div>` : ''}
      </div>
      <div class="glance" role="list">
        ${a.overview.map((o) => `<button class="glance-row" role="listitem" data-act="glance" data-dim="${o.dim.key}">
          <span class="nm">${esc(o.dim.label)}</span>
          <span class="gbar"><i class="${o.p < 0.45 ? 'low' : o.p >= 0.7 ? 'high' : ''}" style="width:${(o.p || 0) * 100}%"></i><span class="tick50"></span></span>
          <span class="val">${pct(o.p)}</span></button>`).join('')}
        <p class="faint" style="font-size:13px;margin-top:10px">Share of people positive about each theme (an average of Agree or Strongly agree across its questions).</p>
      </div>
      ${a.perception ? perceptionCallout(a.perception) : ''}
    </section>`;
  }

  function perceptionCallout(p) {
    return `<div class="callout">
      <h3>Before you read on: leaders see a different organisation</h3>
      <p>People in ${esc(p.top.v.toLowerCase())} are positive about ${pct(p.top.avg)} of what we asked. People in ${esc(p.bottom.v.toLowerCase())} roles: ${pct(p.bottom.avg)}. If the findings below don’t match your own experience, that is expected. They describe the experience of people further from the top.</p>
      <div class="pgap">${p.dims.map((d) => {
        const lo = Math.min(d.top, d.bottom) * 100, hi = Math.max(d.top, d.bottom) * 100;
        return `<div class="pgap-row"><span>${esc(d.dim.label)}</span><span class="pgap-track"><span class="ln" style="left:${lo}%;width:${hi - lo}%"></span><span class="d bot" style="left:${d.bottom * 100}%" title="${esc(p.bottom.v)}: ${pct(d.bottom)}"></span><span class="d top" style="left:${d.top * 100}%" title="${esc(p.top.v)}: ${pct(d.top)}"></span></span></div>`;
      }).join('')}</div>
      <div class="pgap-row pgap-axis" aria-hidden="true"><span></span><span class="scale"><span style="left:0">0%</span><span style="left:50%">50%</span><span style="left:100%">100% positive</span></span></div>
      <div class="legend"><span><i style="background:var(--accent)"></i>${esc(p.top.v)}</span><span><i style="border:2px solid var(--accent);background:var(--surface)"></i>${esc(p.bottom.v)}</span></div>
    </div>`;
  }

  function secFocus() {
    const a = S.a;
    if (!a.focus.length) return `<section class="sec" id="focus"><div class="sec-head"><h2>Focus areas</h2><p>Nothing in this survey passes all three tests: big enough to matter, unlikely to be chance, and still true when everyone who stayed silent is counted. See "On the radar" for weaker signals.</p></div></section>`;
    if (S.open == null) S.open = a.focus[0].id;
    return `<section class="sec" id="focus">
      <div class="sec-head"><h2>Focus areas</h2><p>Ranked by how large the difference is, how many people it affects, and how sure we can be. Each one passed three tests: big enough to matter, unlikely to be chance, and still true if everyone who stayed silent is perfectly happy.</p></div>
      <div class="focus-list">${a.focus.map(focusCard).join('')}</div>
    </section>`;
  }

  function focusCard(f) {
    const a = S.a, ds = S.ds;
    const open = S.open === f.id;
    const owner = G.ownerFor(f, ds, LEADERS());
    const sub = f.kind === 'org'
      ? `Only <b>${pct(f.g.p)}</b> are positive about ${esc(E.topicOf(f.dim))}, and <b>${pct(f.g.pu)}</b> are negative.`
      : `<b>${pct(f.g.p)}</b> are positive about ${esc(E.topicOf(f.dim))}, compared with <b>${pct(f.o.p)}</b> of everyone else.`;
    const sil = f.silence ? (f.silence.survives ? `<span class="chip strength">${I.silence} Passes the silence test</span>` : `<span class="chip concern">${I.wait} Needs more responses</span>`) : '';
    return `<article class="fa ${open ? 'open' : ''}" id="${f.id}">
      <button class="fa-head" data-act="toggle-fa" data-id="${f.id}" aria-expanded="${open}">
        <span class="fa-num">${f.rank}</span>
        <span><h3>${esc(fixCase(f.headline))}</h3><p class="fa-sub">${sub}</p>
          <span class="fa-chips"><span class="chip ${f.confidence.key === 'clear' ? 'accent' : ''}">${esc(f.confidence.label)}</span>${sil}<span class="chip outline">${I.route} ${esc(owner.owner)}</span></span></span>
        <span class="fa-toggle">${I.chev}</span>
      </button>
      ${open ? focusBody(f, owner) : ''}
    </article>`;
  }

  function focusBody(f, owner) {
    const a = S.a, ds = S.ds;
    const orgP = a.overview.find((o) => o.dim.key === f.dim.key).p;
    const place = f.filter[ds.sem.division] || f.filter[ds.sem.department] || null;
    const steps = G.stepsFor(f, { place });
    const ctx = G.contextFor(f, a, ds);
    const limits = G.limitsFor(f);
    const days = S.store.release ? S.store.release.window : 30;
    return `<div class="fa-body">
      <div class="fa-grid">
        <div class="fa-col">
          <div class="blk"><h4>What the data shows</h4>
            ${f.breakdown ? dotPlot(f.breakdown, orgP, f.kind === 'org') : ''}
            <p class="faint" style="font-size:12.5px">Dot: share positive about ${esc(E.topicOf(f.dim))}. Bar: the likely range (95% confidence). Dashed line: everyone.</p>
            ${itemsTable(f)}
            ${f.also.length ? `<p class="muted" style="font-size:14px">Also lower for this group: ${f.also.map((x) => `<b>${esc(x.dim.label)}</b> (${pct(x.g.p)} vs ${pct(x.o.p)})`).join(', ')}.</p>` : ''}
          </div>
          ${f.silence ? `<div class="blk"><h4>The silence test</h4>${silenceBlock(f)}</div>` : ''}
        </div>
        <div class="fa-col">
          ${f.quotes.length ? `<div class="blk"><h4>In their words</h4><div class="quotes">${f.quotes.map((q) => `<p class="quote">“${quoteHTML(q.text)}”${q.count > 1 ? `<small>${q.count} people wrote something similar</small>` : ''}</p>`).join('')}</div><p class="faint" style="font-size:12.5px">Personal details removed. Quotes appear only for groups of ${a.settings.minGroup} or more.</p></div>` : ''}
          <div class="blk"><h4>Read it in context</h4>
            ${ctx.facts.length ? `<div class="facts">${ctx.facts.map((x) => `<div class="fact">${esc(x.text)}${x.rep ? repBars(x.rep, x.attr) : ''}</div>`).join('')}</div>` : ''}
            <div class="qs">${ctx.questions.map((q) => `<div class="q"><span>${esc(q.q)}</span><span class="chk">${esc(q.check)}</span></div>`).join('')}</div>
          </div>
          <div class="blk"><h4>What this doesn’t tell us</h4><ul class="limits">${limits.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>
        </div>
      </div>
      <div class="blk"><h4>A good next step</h4>
        <div class="next"><ol>${steps.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
          <div class="next-side"><div><div class="lab">Who should lead</div>${esc(steps.lead)}</div><div><div class="lab">Avoid</div><span class="avoid">${esc(steps.avoid)}</span></div></div></div>
      </div>
      <div class="route">${I.route}<span>Goes to <b>${esc(owner.owner)}</b>. ${esc(owner.sees)} A response is due ${days} days after release.</span></div>
    </div>`;
  }

  function dotPlot(rows, avg, plain) {
    const shown = rows.slice(0, 12);
    return `<div class="dots" role="img" aria-label="Share positive by group">
      ${shown.map((r) => `<div class="dot-row ${r.highlight ? 'hl' : ''} ${r.hidden ? 'hid' : ''}">
        <span class="lbl" title="${esc(fixCase(r.label))}">${esc(fixCase(r.label))}</span>
        <span class="track"><span class="axis"></span><span class="avg" style="left:${avg * 100}%"></span>
          ${r.hidden ? `<span class="hidden-note">Fewer than ${S.a.settings.minGroup} people, hidden</span>` : `<span class="ci" style="left:${r.ci[0] * 100}%;width:${(r.ci[1] - r.ci[0]) * 100}%"></span><span class="pt" style="left:${r.p * 100}%"></span>`}
        </span>
        <span class="v">${r.hidden ? '' : pct(r.p)}</span></div>`).join('')}
      <div class="dot-axis"><span></span><span class="scale"><span style="left:0">0%</span><span style="left:50%">50%</span><span style="left:100%">100%</span></span><span></span></div>
    </div>`;
  }

  function itemsTable(f) {
    return `<table class="items-tbl"><thead><tr><th>Question</th><th>${f.kind === 'org' ? 'Agree' : 'This group'}</th>${f.kind === 'org' ? '' : '<th>Everyone else</th>'}</tr></thead><tbody>
      ${f.items.map((it) => `<tr><td>${esc(it.text)}</td><td class="${f.kind !== 'org' && it.pg != null && it.po != null && it.po - it.pg >= 0.1 ? 'c' : ''}">${pct(it.pg)}</td>${f.kind === 'org' ? '' : `<td>${pct(it.po)}</td>`}</tr>`).join('')}
    </tbody></table>`;
  }

  function silenceBlock(f) {
    const s = f.silence;
    const who = f.kind === 'org' ? 'people' : fixCase(lc(f.label));
    const cap = Math.min(s.headcount, 640);
    const scale = s.headcount > cap ? cap / s.headcount : 1;
    const u = Math.round(s.unf * scale), r = Math.round((s.answered - s.unf) * scale), sl = Math.max(0, Math.round(s.nonresp * scale));
    const cells = '<i class="u"></i>'.repeat(u) + '<i class="r"></i>'.repeat(r) + '<i class="s"></i>'.repeat(sl);
    return `<div class="silence ${s.survives ? 'pass' : 'fail'}">
      <div class="people" aria-hidden="true">${cells}</div>
      <div class="key"><span><i style="background:var(--concern)"></i>${s.unf} told us this</span><span><i style="background:var(--ink-3);opacity:.75"></i>${s.answered - s.unf} responded otherwise</span><span><i class="s" style="background:repeating-linear-gradient(135deg,var(--silent) 0 2px,transparent 2px 4px);box-shadow:inset 0 0 0 1px var(--silent)"></i>${s.nonresp} didn’t respond</span></div>
      <p class="verdict">${s.survives
        ? `Even if all ${s.nonresp} people who didn’t respond are completely happy, <b>at least ${s.unf} of the ${s.headcount} ${esc(who)} (${pct(s.floor)})</b> report this. A low response rate is not a reason to set it aside.`
        : `If the ${s.nonresp} people who didn’t respond are happy, only ${pct(s.floor)} of ${esc(who)} report this. Hear from more people before acting.`}</p>
      <p class="stamp">${s.survives ? I.silence + ' Passes the silence test' : I.wait + ' Doesn’t pass yet'}<span class="faint" style="font-weight:500">· true share between ${pct(s.floor)} and ${pct(s.ceiling)}</span></p>
      ${s.survives ? '<p class="faint" style="font-size:12.5px">Groups that respond less tend to be less satisfied, not more (Fauth et al., 2013).</p>' : ''}
    </div>`;
  }

  function repBars(rep, attr) {
    return `<div class="rep" aria-label="${esc(attr)} by level">${rep.rows.map((r) => `<div class="rep-row"><span>${esc(r.level)}</span><span class="rep-bar"><i style="width:${r.share * 100}%"></i></span><span>${pct(r.share)}</span></div>`).join('')}</div>`;
  }

  function secStrengths() {
    const a = S.a;
    return `<section class="sec" id="strengths">
      <div class="sec-head"><h2>Strengths to protect</h2><p>What’s working. Changes made to fix the focus areas shouldn’t break these.</p></div>
      ${a.strengths.length ? '' : '<p class="muted">Nothing clears the bar for a strength yet: no theme is at 62% positive or more, and no question reaches 75% agreement.</p>'}
      <div class="strengths">${a.strengths.map((s) => `<div class="st">
        <span class="big">${pct(s.p)}</span>
        <h3>${s.kind === 'item' ? `agree “${esc(s.short)}”` : esc(fixCase(s.title))}</h3>
        <p>${esc(s.scope)}${s.po != null ? ` · everyone else ${pct(s.po)}` : ''} · ${s.n} people</p>
        ${s.quotes && s.quotes[0] ? `<p class="quote">“${quoteHTML(s.quotes[0])}”</p>` : ''}
      </div>`).join('')}</div>
    </section>`;
  }

  function secRadar() {
    const a = S.a;
    const row = (f) => `<div class="w-row">
      <div><h3>${esc(fixCase(f.headline))}</h3>
        <p>${f.kind === 'org' ? `${pct(f.g.p)} positive` : `${pct(f.g.p)} positive vs ${pct(f.o.p)} for everyone else`} · ${f.g.n} people · ${esc(f.confidence.label.toLowerCase())}</p>
        ${f.early ? `<p class="early-box">${I.wait}<span>${esc(f.earlyReason)}</span></p>` : ''}</div>
      <div class="num">${f.kind === 'org' ? pct(f.g.p) : `−${Math.round(-f.diff * 100)}`}<small>${f.kind === 'org' ? 'positive' : 'points'}</small></div></div>`;
    return `<section class="sec" id="radar">
      <div class="sec-head"><h2>On the radar</h2><p>Real differences that didn’t make the top three, and early signals that need more voices before anyone acts on them.</p></div>
      ${a.watch.length ? `<div class="watch">${a.watch.map(row).join('')}</div>` : ''}
      ${a.early.length ? `<h3 class="eyebrow" style="margin-top:8px">Early signals</h3><div class="watch">${a.early.map(row).join('')}</div>` : ''}
    </section>`;
  }

  function secConfidential() {
    const a = S.a;
    if (!a.signals.length) return '';
    return `<section class="sec" id="confidential">
      <div class="sec-head"><h2>For your eyes only</h2><p>Patterns inside groups too small to report. They never appear in any report that leaves this screen, and they don’t go to the team’s own leader.</p></div>
      ${a.signals.map(signalCard).join('')}
    </section>`;
  }

  function signalCard(s) {
    const ds = S.ds;
    const dept = S.files.responses.rows.find((r) => r[ds.sem.team] === s.team);
    const leader = dept && LEADERS()[dept[ds.sem.department]] || 'the team leader’s manager';
    const h0 = s.hits[0];
    const FEEL = { voice: 'feel unsafe speaking up', mgr: 'feel their manager treats them unfairly', belong: 'feel disrespected' };
    const feelings = s.hits.map((h) => FEEL[h.dim.key] || E.concernText(h.dim).plural);
    const conf = S.store.conf[s.id];
    return `<div class="conf">
      <div class="conf-head"><span class="ic">${I.lock}</span><div>
        <p class="eyebrow" style="color:var(--lock)">Confidential · People & Culture only</p>
        <h3 style="margin-top:4px">In ${esc(s.team)}, a small group of ${esc(s.groupNoun)} (${esc(s.sizeBand)}) ${feelings.map(esc).join(' and ')}, far more than anyone around them.</h3>
      </div></div>
      <div class="cmp">
        ${s.hits.map((h) => `<div><small>${esc(h.dim.label)}</small><b>${pct(h.s.p)}</b><small>positive. Others in the team: ${pct(h.o.p)}. ${esc(cap(s.groupNoun))} elsewhere: ${pct(h.e.p)}.</small></div>`).join('')}
      </div>
      ${s.themes.length ? `<p class="muted" style="font-size:14.5px">Their comments mention: ${s.themes.slice(0, 3).map((t) => `${esc(t.label.toLowerCase())} (${t.count})`).join(', ')}.</p>` : ''}
      <div class="blk"><h4>Suggested process</h4><ol>${G.CONFIDENTIAL_STEPS.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
      <div class="route">${I.route}<span>Goes to <b>People & Culture</b> and <b>${esc(leader)}</b>. Not to the team leader. ${conf ? `<b>Logged:</b> ${esc(conf.status)} (${fmtShort(conf.at)})` : ''}</span></div>
      <div><button class="btn btn-ghost btn-sm" data-act="log-conf" data-id="${s.id}">${conf ? 'Update the follow-up log' : 'Log a confidential follow-up'}</button></div>
    </div>`;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function lensOptions() {
    const a = S.a, ds = S.ds;
    const opts = a.lensCols.map((h) => ({ key: h, label: h, cols: [h] }));
    if (ds.sem.gender && ds.sem.race) opts.push({ key: 'gxr', label: `${ds.sem.gender} × ${ds.sem.race}`, cols: [ds.sem.gender, ds.sem.race] });
    if (ds.sem.gender && (ds.sem.division || ds.sem.department)) { const p = ds.sem.division || ds.sem.department; opts.push({ key: 'gxp', label: `${ds.sem.gender} × ${p}`, cols: [ds.sem.gender, p] }); }
    return opts;
  }

  function lensColumns(lens) {
    const a = S.a, ds = S.ds, k = a.settings.minGroup;
    const vals = (h) => [...new Set(ds.respondents.map((r) => r.groups[h]))].filter((v) => v && !E.PREFER_NOT.test(v)).sort();
    let filters = [];
    if (lens.cols.length === 1) filters = vals(lens.cols[0]).map((v) => ({ [lens.cols[0]]: v }));
    else vals(lens.cols[0]).forEach((x) => vals(lens.cols[1]).forEach((y) => filters.push({ [lens.cols[0]]: x, [lens.cols[1]]: y })));
    const cols = filters.map((f) => { const n = ds.respondents.filter((r) => Object.entries(f).every(([h, v]) => r.groups[h] === v)).length; return { filter: f, n, hidden: n < k, label: a.groupLabel(f) }; }).filter((c) => c.n > 0);
    // Secondary suppression: if exactly one group is hidden, hide the next smallest so it can't be derived.
    if (lens.cols.length === 1) {
      const hid = cols.filter((c) => c.hidden);
      if (hid.length === 1) { const next = cols.filter((c) => !c.hidden).sort((x, y) => x.n - y.n)[0]; if (next) { next.hidden = true; next.secondary = true; } }
    }
    return cols;
  }

  function secExplore(lead) {
    const a = S.a, ds = S.ds;
    const opts = lensOptions();
    if (!S.lens || !opts.find((o) => o.key === S.lens)) S.lens = (opts.find((o) => o.key === (ds.sem.department || '')) || opts[0]).key;
    const lens = opts.find((o) => o.key === S.lens);
    const cols = lensColumns(lens);
    const shortLabel = (c) => Object.values(c.filter).join(' · ');
    return `<section class="sec" id="explore">
      <div class="sec-head"><h2>Explore every group</h2><p>Share positive on each theme, coloured by how far it sits from the organisation as a whole. Select a cell to see the questions behind it.</p></div>
      <div class="lens-tabs" role="group" aria-label="Group by">${opts.map((o) => `<button data-act="lens" data-key="${esc(o.key)}" aria-pressed="${o.key === S.lens}">${esc(o.label)}</button>`).join('')}</div>
      <div class="heat-wrap"><table class="heat">
        <thead><tr><th>Theme</th><th>Everyone<small>${a.responded}</small></th>${cols.map((c) => { const hc = a.headcount(c.filter); const rr = hc ? c.n / hc : null; return `<th>${esc(shortLabel(c))}<small>${c.hidden ? (c.secondary ? 'hidden' : `under ${a.settings.minGroup}`) : c.n + (rr != null && rr < 0.5 ? ` · <span class="low-rr" title="Fewer than half responded">${pct(rr)} responded</span>` : '')}</small></th>`; }).join('')}</tr></thead>
        <tbody>${a.overview.map((o) => `<tr><td>${esc(o.dim.label)}</td>
          <td><span class="cell" style="background:var(--sunk)">${pct(o.p)}</span></td>
          ${cols.map((c) => {
            if (c.hidden) return `<td><span class="cell hidden" title="${c.secondary ? 'Hidden so a smaller group can’t be worked out' : `Fewer than ${a.settings.minGroup} people`}">${c.secondary ? 'hidden' : `&lt;${a.settings.minGroup}`}</span></td>`;
            const cell = a.cell(c.filter, o.dim.key);
            if (cell.suppressed) return `<td><span class="cell hidden">&lt;${a.settings.minGroup}</span></td>`;
            const d = cell.p - o.p;
            const amt = Math.abs(d) < 0.05 ? 0 : Math.min(85, Math.round(Math.abs(d) * 320));
            const bg = `color-mix(in srgb, ${d < 0 ? 'var(--concern)' : 'var(--strength)'} ${amt}%, var(--sunk))`;
            const sel = S.drill && S.drill.dim === o.dim.key && JSON.stringify(S.drill.filter) === JSON.stringify(c.filter);
            return `<td><button class="cell ${sel ? 'sel' : ''}" style="background:${bg};${amt > 55 ? 'color:#fff' : ''}" data-act="drill" data-dim="${o.dim.key}" data-filter="${esc(JSON.stringify(c.filter))}" aria-label="${esc(c.label)}, ${esc(o.dim.label)}: ${pct(cell.p)}">${pct(cell.p)}</button></td>`;
          }).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <div class="heat-key"><span>Below everyone</span><span class="scale"></span><span>Above everyone</span><span class="faint">· Striped: hidden to protect anonymity</span></div>
      ${S.drill ? drillPanel() : ''}
    </section>`;
  }

  function drillPanel() {
    const a = S.a, ds = S.ds;
    const dim = ds.dims.find((d) => d.key === S.drill.dim);
    const filter = S.drill.filter;
    const isOrg = !Object.keys(filter).length;
    const cell = a.cell(filter, dim.key);
    const org = a.overview.find((o) => o.dim.key === dim.key);
    const label = isOrg ? 'Everyone' : fixCase(a.groupLabel(filter));
    const quotes = a.quotesFor(cell.members, dim.key);
    return `<div class="card drill" id="drill">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><p class="eyebrow">${esc(dim.label)}</p><h3>${esc(label)}: ${pct(cell.p)} positive${isOrg ? '' : ` <span class="muted" style="font-size:16px">vs ${pct(org.p)} overall</span>`}</h3><p class="faint" style="font-size:13.5px">${cell.n} people answered${a.headcount(filter) ? ` · ${a.headcount(filter)} in this group · ${pct(cell.members.length / a.headcount(filter))} responded` : ''}</p></div><button class="x" data-act="drill-close" aria-label="Close">${I.x}</button></div>
      <div class="drill-grid">
        <table class="items-tbl"><thead><tr><th>Question</th><th>${isOrg ? 'Agree' : 'This group'}</th>${isOrg ? '' : '<th>Everyone</th>'}</tr></thead><tbody>
          ${dim.items.map((it) => { const g = a.itemCell(filter, it.id); const o = org.items.find((x) => x.id === it.id).p; return `<tr><td>${esc(it.text)}</td><td class="${!isOrg && g != null && o - g >= 0.1 ? 'c' : ''}">${pct(g)}</td>${isOrg ? '' : `<td>${pct(o)}</td>`}</tr>`; }).join('')}
        </tbody></table>
        ${(() => { const hc = a.headcount(filter); return hc && cell.members.length / hc < 0.5 ? `<p class="early-box" style="grid-column:1/-1;margin:0">${I.wait}<span>Fewer than half of this group responded (${pct(cell.members.length / hc)}). Treat this as an early signal and hear from more people before acting.</span></p>` : ''; })()}
        <div class="quotes">${quotes.length ? quotes.map((q) => `<p class="quote">“${quoteHTML(q.text)}”</p>`).join('') : '<p class="faint">No comments from this group on this theme.</p>'}</div>
      </div>
    </div>`;
  }

  function secComments() {
    const a = S.a, c = a.comments;
    const ai = S.aiThemes;
    const themes = ai ? ai.themes : c.themes;
    const max = Math.max(...themes.map((t) => t.count));
    const log = c.log;
    const aiBar = !S.ai ? '' : ai
      ? `<div class="ai-note">${I.check}<span>Themes by Claude (${esc(ai.model)}). Every quote is a real comment, matched back by its id. <button class="btn-quiet" data-act="ai-off">Show keyword themes</button></span></div>`
      : S.aiBusy ? `<div class="ai-note"><span class="spin"></span><span>Claude is reading ${c.all.length} comments\u2026</span></div>`
      : `<div class="ai-note"><span>Themes below come from keyword rules.</span><button class="btn btn-ghost btn-sm" data-act="ai-themes">Read the comments with Claude</button><span class="faint" style="font-size:12.5px">Sends comment text only, with names removed. No ratings, groups or teams.</span></div>`;
    return `<section class="sec" id="comments">
      <div class="sec-head"><h2>What people wrote</h2><p>${c.all.length} comments, grouped by what they\u2019re about. Select a theme to read them.</p></div>
      <div class="privacy-log">${log.name ? `<span class="chip">${I.eyeoff} ${log.name} name${log.name > 1 ? 's' : ''} removed</span>` : ''}${log.phone ? `<span class="chip">${I.eyeoff} ${log.phone} phone number${log.phone > 1 ? 's' : ''} removed</span>` : ''}${log.email ? `<span class="chip">${I.eyeoff} ${log.email} email address${log.email > 1 ? 'es' : ''} removed</span>` : ''}</div>
      ${aiBar}${S.aiError ? `<p class="err">${esc(S.aiError)}</p>` : ''}
      <div class="themes">${themes.map((t) => {
        const open = S.themeOpen === t.key;
        const uniq = []; const seen = {};
        t.items.forEach((x) => { if (seen[x.text]) seen[x.text].n++; else { seen[x.text] = { text: x.text, n: 1 }; uniq.push(seen[x.text]); } });
        uniq.sort((x, y) => y.n - x.n);
        return `<button class="th-row" data-act="theme" data-key="${esc(t.key)}" aria-expanded="${open}"><span class="nm">${esc(t.label)}</span><span class="th-bar" style="width:${(t.count / max) * 100}%"><i class="neg" style="width:${((t.count - t.positive) / t.count) * 100}%"></i><i class="pos" style="width:${(t.positive / t.count) * 100}%"></i></span><span class="c">${t.count}</span></button>
          ${open ? `<div class="th-quotes">${t.summary ? `<p class="muted">${esc(t.summary)}</p>` : ''}${uniq.slice(0, 8).map((q) => `<p class="quote">\u201c${quoteHTML(q.text)}\u201d${q.n > 1 ? `<small>${q.n} people wrote something similar</small>` : ''}</p>`).join('')}</div>` : ''}`;
      }).join('')}</div>
      <div class="legend"><span><i style="background:var(--ink-2)"></i>Concern</span><span><i style="background:var(--strength)"></i>Praise</span></div>
    </section>`;
  }

  async function runAiThemes() {
    const all = S.a.comments.all;
    S.aiBusy = true; S.aiError = null; rerenderSection('comments');
    try {
      const res = await fetch('/api/themes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ comments: all.map((c, id) => ({ id, text: c.text })) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claude could not read the comments.');
      S.aiThemes = {
        model: data.model,
        themes: data.themes.map((t, i) => {
          const items = t.comment_ids.map((id) => all[id]).filter(Boolean);
          const positive = t.sentiment === 'praise' ? items.length : t.sentiment === 'concern' ? 0 : items.filter((x) => x.positive).length;
          return { key: 'ai' + i, label: t.label, summary: t.summary, items, count: items.length, positive };
        }).filter((t) => t.count).sort((x, y) => y.count - x.count),
      };
    } catch (e) { S.aiError = e.message; }
    S.aiBusy = false; rerenderSection('comments');
  }

  function secAbout() {
    const a = S.a;
    return `<section class="sec" id="about">
      <div class="sec-head"><h2>About this data</h2><p>How the numbers were made, so anyone can check them.</p></div>
      ${a.rates ? `<div class="heat-wrap" style="padding:8px 8px 0"><table class="rr-tbl"><thead><tr><th>${esc(a.rates.col)}</th><th>Responded</th><th></th><th style="text-align:right">Rate</th><th style="text-align:right">Margin</th></tr></thead><tbody>
        ${a.rates.map((r) => `<tr><td>${esc(r.v)}</td><td>${r.resp}${r.hc ? ` of ${r.hc}` : ''}</td><td>${r.rr != null ? `<span class="rr-mini"><i style="width:${r.rr * 100}%"></i></span>` : ''}</td><td class="r" ${r.rr != null && r.rr < 0.5 ? 'style="color:var(--concern)"' : ''}>${pct(r.rr)}</td><td class="r faint">±${Math.round(r.moe * 100)}</td></tr>`).join('')}
      </tbody></table></div>` : ''}
      <div class="method">
        <div><b>Positive</b><span>A person counts as positive on a theme when their average across its questions is 3.5 or higher on the 5-point scale (mostly Agree or Strongly agree).</span></div>
        <div><b>Differences</b><span>Each group is compared with everyone else using a two-proportion test. "Clear" means very unlikely to be chance (z ≥ 3), "likely" means z ≥ 2.</span></div>
        <div><b>The silence test</b><span>Counts everyone invited. A finding passes if at least 1 in 5 of the whole group report it even when every non-respondent is assumed to be happy.</span><cite>Manski (2003); Fauth et al. (2013)</cite></div>
        <div><b>Anonymity</b><span>Groups under ${a.settings.minGroup} are hidden everywhere, with secondary suppression. Team-level patterns go only to People & Culture.</span><cite>Hundepool et al. (2012)</cite></div>
        <div><b>Ranking</b><span>Focus areas are ranked by size of the gap, number of people affected and seriousness of the theme. Overlapping groups are merged so the same issue isn’t counted twice.</span></div>
        <div><b>Where AI sits</b><span>Every number is calculated by VoiceBridge, never by AI. Comment themes come from keyword rules, or from Claude when the app runs on its server: only comment text is sent, after personal details are removed, and every quote is matched back to a real comment. Themes should be checked against a human coder.</span><cite>Mellon et al. (2024); Ashwin et al. (2025)</cite></div>
      </div>
      ${a.suppressed.length ? `<p class="faint" style="font-size:13.5px">${a.suppressed.length} groups were hidden because fewer than ${a.settings.minGroup} people answered.</p>` : ''}
    </section>`;
  }

  // Scroll-spy for the table of contents.
  function afterResults() {
    const links = $$('.toc a[data-scroll]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) links.forEach((l) => l.classList.toggle('on', l.dataset.scroll === e.target.id)); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    links.forEach((l) => { const t = document.getElementById(l.dataset.scroll); if (t) io.observe(t); });
  }

  // ------------------------------------------------------------ Release
  function screenRelease() {
    const a = S.a, rel = S.store.release;
    const depts = a.rates ? a.rates.length : 0;
    const win = rel ? rel.window : S.pendingWindow || 30;
    const audiences = [
      { ic: I.exec, k: 'leadership', t: 'Executive committee', d: `Full report: ${a.focus.length} focus areas, ${a.strengths.length} strengths, ${a.watch.length + a.early.length} on the radar.` },
      ...(depts ? [{ ic: I.building, k: 'dept', t: `Department heads (${depts})`, d: 'Their department next to the organisation, plus every finding that involves them.' }] : []),
      { ic: I.phone, k: 'employees', t: `All employees${a.N ? ` (${a.N})` : ''}`, d: 'A plain summary of what people said, and each leader’s response as it arrives.' },
      ...(a.signals.length ? [{ ic: I.lock, k: 'conf', t: 'People & Culture only', d: `${a.signals.length} confidential pattern${a.signals.length > 1 ? 's' : ''}. Never shown to the team’s own leader.`, lock: true }] : []),
    ];
    return `<div class="wrap"><section class="release">
      <div>
        <p class="eyebrow">Release</p>
        <h1 style="margin-top:10px">${rel ? 'Released to everyone at once.' : 'Release the results to everyone at once.'}</h1>
        <p class="lede">${rel ? 'Findings are locked. Leaders can respond to them but can’t edit, delay or hide them.' : 'When you release, every audience gets its version at the same moment. Findings are locked after that: leaders can respond to them, but can’t edit, delay or hide them.'}</p>
      </div>
      ${rel ? `<div class="released"><h2>${I.seal} Released ${fmtDate(rel.at)}, ${new Date(rel.at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</h2>
        <p>Report fingerprint <span class="fp">${esc(rel.fp)}</span>. Anyone can check that the report they received matches it. Responses are due by <b>${fmtDate(rel.due)}</b>.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="btn btn-primary" data-go="follow">Track the follow-through ${I.arrow}</button>${S.sample ? '<button class="btn-quiet" data-act="reset-demo">Start the demo release over</button>' : ''}</div></div>` : ''}
      <div class="card aud">${audiences.map((x) => `<div class="aud-row ${x.lock ? 'lock' : ''}"><span class="aud-ic">${x.ic}</span><div><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p></div><button class="btn btn-ghost btn-sm" data-act="preview" data-k="${x.k}">${I.eye} Preview</button></div>`).join('')}</div>
      <div class="rules">
        <div class="rule">${I.clock}<b>Same moment for everyone</b><p>No leader sees the results before the people who gave them.</p></div>
        <div class="rule">${I.lock}<b>Locked findings</b><p>The wording and numbers can’t be changed after release. A fingerprint proves it.</p></div>
        <div class="rule">${I.route}<b>Routed one level up</b><p>A finding about a team goes to the person that team’s leader reports to, not to the leader first.</p></div>
      </div>
      ${routingDiagram()}
      ${rel ? '' : S.confirming ? `<div class="confirm" role="alertdialog" aria-label="Confirm release">
          <b>Release to ${audiences.length} audiences now?</b>
          <p class="muted">This can’t be undone. ${a.focus.length} focus areas will be locked and each owner will have ${win} days to respond publicly.</p>
          <div class="row"><button class="btn btn-primary" data-act="release-now">Release now</button><button class="btn btn-ghost" data-act="release-cancel">Not yet</button></div></div>`
        : `<div class="go"><div><b>Ready when you are.</b><p>Responses due <label for="win" class="sr">Response window</label><select id="win">${[14, 30, 45].map((d) => `<option value="${d}" ${d === win ? 'selected' : ''}>${d} days</option>`).join('')}</select> after release.</p></div><button class="btn btn-primary btn-lg" data-act="release">Release to everyone</button></div>`}
    </section></div>`;
  }

  function routingDiagram() {
    return `<div class="card routing">
      <p class="eyebrow">How a finding about one team travels</p>
      <svg viewBox="0 0 640 170" width="100%" role="img" aria-label="A finding about a team goes to the leader's manager and People and Culture, and the team leader responds after.">
        <rect x="10" y="62" width="150" height="46" rx="10" fill="var(--concern-soft)"/><text x="85" y="82" text-anchor="middle" class="strong">Finding about</text><text x="85" y="98" text-anchor="middle">Team X</text>
        <path d="M160 85 C 220 85, 220 35, 280 35" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="M160 85 C 220 85, 220 135, 280 135" fill="none" stroke="var(--accent)" stroke-width="2"/>
        <rect x="280" y="12" width="190" height="46" rx="10" fill="var(--accent-soft)"/><text x="375" y="32" text-anchor="middle" class="strong">Team leader’s manager</text><text x="375" y="48" text-anchor="middle">owns the response</text>
        <rect x="280" y="112" width="190" height="46" rx="10" fill="var(--lock-soft)"/><text x="375" y="132" text-anchor="middle" class="strong">People & Culture</text><text x="375" y="148" text-anchor="middle">independent oversight</text>
        <path d="M470 35 C 500 35, 495 85, 512 85" fill="none" stroke="var(--line-2)" stroke-width="2" stroke-dasharray="4 4"/>
        <rect x="512" y="62" width="122" height="46" rx="10" fill="var(--sunk)"/><text x="573" y="82" text-anchor="middle" class="strong">Team leader</text><text x="573" y="98" text-anchor="middle">brought in after</text>
      </svg>
    </div>`;
  }

  // ------------------------------------------------------------ Follow-through
  const LADDER = [['released', 'Released'], ['ack', 'Acknowledged'], ['plan', 'Plan shared'], ['done', 'Done']];
  function statusOf(f) { return (S.store.responses[f.id] && S.store.responses[f.id].status) || 'released'; }
  function dueInfo(asOf) {
    const rel = S.store.release; if (!rel) return null;
    const now = asOf || Date.now();
    const days = Math.ceil((new Date(rel.due) - now) / 86400000);
    return { days, overdue: days < 0 };
  }

  function screenFollow() {
    const a = S.a, rel = S.store.release;
    if (!rel) return `<div class="wrap"><section class="follow"><div class="card empty-state">${I.clock}<h2 class="serif" style="font-size:26px;font-weight:500">Nothing to track yet</h2><p>The response clock starts when you release the results.</p><button class="btn btn-primary" data-go="release">Go to release ${I.arrow}</button></div></section></div>`;
    const due = dueInfo();
    const responded = a.focus.filter((f) => ['plan', 'done'].includes(statusOf(f))).length;
    return `<div class="wrap"><section class="follow">
      <div><p class="eyebrow">Follow-through</p><h1 style="margin-top:10px">Every focus area has an owner and a deadline.</h1>
        <p class="lede">Employees see each status on their page. Silence is visible: a missed deadline shows as overdue to everyone.</p></div>
      <div class="clock">
        <div><b>${due.overdue ? 'Overdue' : due.days}</b><span>${due.overdue ? `since ${fmtDate(rel.due)}` : `days until responses are due (${fmtShort(rel.due)})`}</span></div>
        <div><b>${responded} of ${a.focus.length}</b><span>owners have shared a plan</span></div>
        <div><b>${a.N ? a.N : a.responded}</b><span>people can see these statuses</span></div>
      </div>
      <div class="ft-list">${a.focus.map(ftCard).join('')}</div>
      ${a.signals.length ? `<div class="card ft"><div class="ft-top"><div><p class="eyebrow" style="color:var(--lock)">${I.lock} Confidential log · People & Culture only</p>
        ${a.signals.map((s) => { const c = S.store.conf[s.id]; return `<h3 style="margin-top:8px">${esc(s.team)}: ${esc(s.groupNoun)}</h3><p class="muted" style="font-size:14px">${c ? `${esc(c.status)} · logged ${fmtShort(c.at)}` : 'No follow-up logged yet.'}</p>`; }).join('')}</div>
        <button class="btn btn-ghost btn-sm" data-act="log-conf" data-id="${a.signals[0].id}">Update log</button></div></div>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-ghost" data-act="preview" data-k="employees">${I.eye} See what employees see</button></div>
    </section></div>`;
  }

  function ftCard(f) {
    const ds = S.ds;
    const owner = G.ownerFor(f, ds, LEADERS()).owner;
    const st = statusOf(f);
    const idx = LADDER.findIndex(([k]) => k === st);
    const r = S.store.responses[f.id];
    const due = dueInfo();
    const composing = S.composing === f.id;
    return `<article class="card ft" id="ft-${f.id}">
      <div class="ft-top"><div><h3>${esc(fixCase(f.headline))}</h3>
        <div class="meta"><span>Owner: <b>${esc(owner)}</b></span><span>${st === 'done' ? 'Closed' : due.overdue && idx < 2 ? '<b style="color:var(--concern)">Response overdue</b>' : `Response due ${fmtShort(S.store.release.due)}`}</span></div></div>
        ${!composing && st !== 'done' ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${idx < 1 ? `<button class="btn btn-ghost btn-sm" data-act="ack" data-id="${f.id}">Acknowledge</button>` : ''}${idx < 2 ? `<button class="btn btn-primary btn-sm" data-act="compose" data-id="${f.id}">Write response</button>` : `<button class="btn btn-ghost btn-sm" data-act="done" data-id="${f.id}">Mark done</button>`}</div>` : ''}
      </div>
      <div class="ladder" aria-label="Status">${LADDER.map(([k, l], i) => `<div class="${i < idx ? 'on' : i === idx ? 'on now' : ''}"><i></i>${l}</div>`).join('')}</div>
      ${composing ? composeForm(f, owner, r) : r && r.heard ? responseView(r, owner) : ''}
    </article>`;
  }

  function responseView(r, owner) {
    return `<div class="response"><span class="who">${esc(owner)} · ${fmtDate(r.at)}</span><dl>
      <div><dt>What we heard</dt><dd>${esc(r.heard)}</dd></div>
      <div><dt>What we’ll do first</dt><dd>${esc(r.first)}</dd></div>
      ${r.wont ? `<div><dt>What we won’t do, and why</dt><dd>${esc(r.wont)}</dd></div>` : ''}
      <div><dt>Next update</dt><dd>${r.when ? fmtDate(r.when) : 'Not set'}</dd></div></dl></div>`;
  }

  function composeForm(f, owner, r) {
    const sug = suggestions(f);
    const v = r || {};
    return `<form class="compose" data-form="respond" data-id="${f.id}">
      <div class="locked-finding">${I.lock}<span>The finding is locked. Your response appears next to it, word for word, on every employee’s page.</span></div>
      <label for="r-heard">What did you hear? <small>In your own words, without softening it.</small><textarea id="r-heard" required placeholder="${esc(sug.heard)}">${esc(v.heard || '')}</textarea></label>
      <label for="r-first">What will you do first, and by when? <small>One concrete step is better than five vague ones.</small><textarea id="r-first" required placeholder="${esc(sug.first)}">${esc(v.first || '')}</textarea></label>
      <label for="r-wont">What won’t you do, and why? <small>Optional. Saying no honestly builds more trust than silence.</small><textarea id="r-wont" placeholder="${esc(sug.wont)}">${esc(v.wont || '')}</textarea></label>
      <label for="r-when">When will you report back?<input id="r-when" type="date" value="${v.when || new Date(Date.now() + 75 * 86400000).toISOString().slice(0, 10)}"></label>
      <div class="row"><button type="button" class="btn-quiet" data-act="fill-example" data-id="${f.id}">Fill with an example</button><span style="display:flex;gap:10px"><button type="button" class="btn btn-ghost" data-act="compose-cancel">Cancel</button><button type="submit" class="btn btn-primary">Publish response</button></span></div>
    </form>`;
  }

  function suggestions(f) {
    const who = f.kind === 'org' ? 'many of you' : fixCase(lc(f.label));
    const ex = {
      fair: { heard: `${cap(who)} don’t believe promotions here are fair, and some of you have watched people you trained get promoted ahead of you.`, first: 'By 30 November we will review every team leader appointment in Operations from the last two years, and share what we find with you in December.', wont: 'We won’t launch a mentoring programme yet. We want to fix the process first, not ask you to fix yourselves.' },
      growth: { heard: `${cap(who)} have had little or no conversation about your development, and training rarely reaches the floor.`, first: 'Every person on the floor will have a development conversation with a written next step by 31 January.', wont: 'We can’t fund external degrees this year, but we will expand learnerships from 12 to 30 places.' },
      trust: { heard: 'Most of you don’t believe anything will change because of this survey, and last year’s results were never shared.', first: 'These results are published to everyone today. Each focus area has an owner and a date, and you can track them on this page.', wont: 'We won’t run another survey until we have reported back on this one.' },
    }[f.dim.key] || { heard: `${cap(who)} told us this is a problem.`, first: 'We will meet with the people affected by the end of next month.', wont: '' };
    return ex;
  }

  // ------------------------------------------------------------ Previews
  function employeePage(asOfDay = 0) {
    const a = S.a, rel = S.store.release;
    const asOf = Date.now() + asOfDay * 86400000;
    const due = rel ? dueInfo(asOf) : null;
    const owner = (f) => G.ownerFor(f, S.ds, LEADERS()).owner;
    return `<div class="phone"><div class="phone-in">
      <div class="emp-head"><span class="org">${esc(S.meta.org)}</span><h1>What you told us</h1>
        <p>${a.responded} of you answered the ${esc(S.meta.period || 'latest')} survey${a.rr != null ? ` (${pct(a.rr)} of everyone)` : ''}. Here’s what you said and what’s happening because of it.</p></div>
      ${!rel ? '<p class="preview-tag" style="justify-self:start">Draft: not released yet</p>' : ''}
      <div class="emp-sec"><h2>What’s working</h2>${a.strengths.map((s) => `<div class="emp-item good">${s.kind === 'item' ? `${pct(s.p)} of you say “${esc(lc(s.short))}”.` : `${esc(fixCase(s.title))} (${pct(s.p)}).`}</div>`).join('')}</div>
      <div class="emp-sec"><h2>What needs to change</h2>${a.focus.map((f) => {
        const st = statusOf(f); const r = S.store.responses[f.id];
        const label = LADDER.find(([k]) => k === st)[1];
        const late = due && due.overdue && !['plan', 'done'].includes(st);
        return `<div class="emp-item"><span>${esc(fixCase(G.employeeLine(f)))}</span>
          <span class="status"><span>Owner: ${esc(owner(f))}</span>${late ? '<span class="chip concern">Response overdue</span>' : `<span class="chip ${st === 'plan' || st === 'done' ? 'strength' : ''}">${rel ? label : 'Not released'}</span>`}</span>
          ${r && r.heard ? `<span class="resp-txt"><b>First step:</b> ${esc(r.first)}</span>` : rel && !late ? `<span class="faint" style="font-size:13px">Response due ${fmtShort(rel.due)}</span>` : ''}
        </div>`;
      }).join('')}</div>
      ${placeEarly().length ? `<div class="emp-sec"><h2>We need to hear from more of you</h2>${placeEarly().map((f) => `<div class="emp-item">${esc(f.label.replace(/^People in /, ''))}: only ${pct(f.silence.rr)} of you responded, so we can’t be sure yet what’s going on. Please tell us in the next pulse survey.</div>`).join('')}</div>` : ''}
      <div class="emp-foot"><span>Your answers were anonymous. No group smaller than ${a.settings.minGroup} is ever shown.</span>${rel ? `<span>Released ${fmtDate(rel.at)} · fingerprint <span class="fp" style="font-size:11px">${esc(rel.fp)}</span></span>` : ''}<span>Next pulse survey: ${fmtDate(new Date(today.getFullYear(), today.getMonth() + 3, 15))}</span></div>
    </div></div>`;
  }

  // Only department-level early signals go on the employee page; naming a demographic group's silence publicly could stigmatise it.
  function placeEarly() {
    const ds = S.ds, places = [ds.sem.department, ds.sem.division].filter(Boolean);
    return S.a.early.filter((f) => f.early === 'response' && Object.keys(f.filter).length && Object.keys(f.filter).every((h) => places.includes(h)));
  }

  function deptReport() {
    const a = S.a, ds = S.ds;
    const col = a.rates.col;
    const opts = a.rates.map((r) => r.v);
    if (!S.deptPick || !opts.includes(S.deptPick)) S.deptPick = opts[0];
    const d = S.deptPick;
    const rate = a.rates.find((r) => r.v === d);
    const k = a.settings.minGroup;
    const filter = { [col]: d };
    const division = ds.sem.division ? (S.files.responses.rows.find((r) => r[col] === d) || {})[ds.sem.division] : null;
    const related = [...a.focus, ...a.watch, ...a.early].filter((f) => f.kind === 'org' || f.filter[col] === d || (division && f.filter[ds.sem.division] === division));
    return `<div class="dept-rep">
      <div class="dept-pick">${opts.map((o) => `<button class="chip ${o === d ? 'accent' : 'outline'}" data-act="dept" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <div><p class="eyebrow">Department report</p><h2 class="serif" style="font-size:30px;font-weight:500;margin-top:6px">${esc(d)}</h2>
        <p class="muted">${rate.resp}${rate.hc ? ` of ${rate.hc}` : ''} people responded${rate.rr != null ? ` (${pct(rate.rr)})` : ''}. ${rate.rr != null && rate.rr < 0.5 ? 'Fewer than half responded, so read these results as early signals.' : ''}</p></div>
      ${rate.resp < k ? `<p class="err">Fewer than ${k} people responded, so results for this department are hidden.</p>` : `<div>${a.overview.map((o) => {
        const c = a.cell(filter, o.dim.key);
        return `<div class="cmp-row"><span>${esc(o.dim.label)}</span><span class="cmp-track"><i class="${c.p - o.p <= -0.1 ? 'low' : c.p - o.p >= 0.1 ? 'high' : ''}" style="width:${(c.p || 0) * 100}%"></i><b style="left:${o.p * 100}%"></b></span><span class="v">${pct(c.p)} <small>vs ${pct(o.p)}</small></span></div>`;
      }).join('')}<p class="faint" style="font-size:12.5px;margin-top:6px">Bar: this department. Black line: the whole organisation.</p></div>`}
      <div class="blk"><h4>Findings that involve ${esc(d)}</h4>${related.length ? `<div class="watch">${related.map((f) => `<div class="w-row"><div><h3>${esc(fixCase(f.headline))}</h3><p>${f.status === 'focus' && f.rank ? `Focus area ${f.rank}` : f.early ? 'Early signal' : 'On the radar'}</p></div></div>`).join('')}</div>` : '<p class="faint">None.</p>'}</div>
    </div>`;
  }

  function openSheet(title, html, tag) {
    closeSheet();
    const el = document.createElement('div');
    el.className = 'sheet-back';
    el.id = 'sheet';
    el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-head"><span style="display:flex;gap:10px;align-items:center"><b>${esc(title)}</b>${tag ? `<span class="preview-tag">${esc(tag)}</span>` : ''}</span><button class="x" data-act="close-sheet" aria-label="Close">${I.x}</button></div><div class="sheet-body">${html}</div></div>`;
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
    el.addEventListener('click', (e) => { if (e.target === el) closeSheet(); });
    $('.x', el).focus();
  }
  function closeSheet() { const s = $('#sheet'); if (s) s.remove(); document.body.style.overflow = ''; }

  function preview(k) {
    S.previewing = k;
    if (k === 'leadership') openSheet('Executive committee report', `<div class="report">${secSummary()}${secFocus()}${secStrengths()}${secRadar()}${secComments()}</div>`, 'Preview');
    if (k === 'dept') openSheet('Department heads', deptReport(), 'Preview');
    if (k === 'employees') openSheet('Employee page', employeeSheet(), 'Preview');
    if (k === 'conf') openSheet('People & Culture', `<div class="report">${secConfidential()}</div>`, 'Confidential');
  }
  function employeeSheet() {
    return `<div class="emp-stage" style="padding-block:4px 20px">
      ${S.store.release ? `<div class="emp-note"><span>Show the page as it looks</span><span class="lens-tabs"><button data-act="emp-day" data-d="0" aria-pressed="${S.empDay === 0}">Today</button><button data-act="emp-day" data-d="${S.store.release.window + 1}" aria-pressed="${S.empDay > 0}">After the deadline</button></span></div>` : '<p class="emp-note">This is a draft. Employees see it the moment you release.</p>'}
      ${employeePage(S.empDay)}
    </div>`;
  }
  function refreshSheet() {
    const body = $('#sheet .sheet-body'); if (!body) return;
    const k = S.previewing;
    if (k === 'employees') body.innerHTML = employeeSheet();
    if (k === 'dept') body.innerHTML = deptReport();
    if (k === 'leadership') body.innerHTML = `<div class="report">${secSummary()}${secFocus()}${secStrengths()}${secRadar()}${secComments()}</div>`;
  }

  function logConf(id) {
    const s = S.a.signals.find((x) => x.id === id);
    const cur = S.store.conf[id];
    const opts = ['Not started', 'Confidential conversations booked', 'Conversations held, reviewing pattern', 'Closed with action taken', 'Closed, no further action'];
    openSheet('Confidential follow-up', `<form class="compose" data-form="conf" data-id="${id}" style="border-color:var(--lock)">
      <div class="locked-finding">${I.lock}<span>Only People & Culture can see this log. ${esc(s.team)}: ${esc(s.groupNoun)}.</span></div>
      <label for="c-status">Status<select id="c-status" style="padding:10px;border-radius:10px;border:1px solid var(--line-2);background:var(--ground)">${opts.map((o) => `<option ${cur && cur.status === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
      <label for="c-note">Private note <small>No names. Describe the process, not the people.</small><textarea id="c-note" placeholder="e.g. One-to-ones offered to all 31 people in the team; 12 booked for next week.">${esc(cur ? cur.note : '')}</textarea></label>
      <div class="row"><span></span><button type="submit" class="btn btn-primary">Save to log</button></div></form>`, 'Confidential');
  }

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `${I.check}<span>${esc(msg)}</span>`;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  }

  // ------------------------------------------------------------ Analysis run
  function analyse() {
    if (!S.ds.population && !S.settings.invited) {
      const v = Number(($('#invited') || {}).value);
      if (v >= S.files.responses.rows.length) S.settings.invited = v;
    }
    S.a = E.analyze(S.ds, { minGroup: S.settings.minGroup, invited: S.settings.invited });
    S.open = null; S.drill = null; S.themeOpen = null; S.lens = null; S.aiThemes = null; S.aiError = null;
    load();
  }

  function loadSample() {
    const { rows, headcount } = D.generate();
    const r = E.parseCSV(D.toCSV(rows)), h = E.parseCSV(D.toCSV(headcount));
    S.files.responses = { name: D.files.responses, ...r };
    S.files.headcount = { name: D.files.headcount, ...h };
    S.sample = true; S.error = null; S.a = null;
    S.meta = { org: D.org, survey: D.survey, period: D.period };
    prepare();
    go('check');
  }

  // ------------------------------------------------------------ Events
  const actions = {
    home: () => { closeSheet(); go('start'); },
    sample: loadSample,
    'to-check': () => { prepare(); go('check'); },
    'k-': () => { S.settings.minGroup = Math.max(3, S.settings.minGroup - 1); $('#k-out').textContent = S.settings.minGroup; },
    'k+': () => { S.settings.minGroup = Math.min(20, S.settings.minGroup + 1); $('#k-out').textContent = S.settings.minGroup; },
    analyse: () => { analyse(); go('reading'); },
    'skip-read': () => { clearTimeout(readTimer); go('results'); },
    'toggle-fa': (el) => {
      const id = el.dataset.id; S.open = S.open === id ? '' : id;
      const art = document.getElementById(id);
      const f = S.a.focus.find((x) => x.id === id);
      if (art.closest('.sheet')) { refreshSheet(); return; }
      $$('.fa').forEach((x) => { const ff = S.a.focus.find((y) => y.id === x.id); if (ff) x.outerHTML = focusCard(ff); });
      if (S.open === id) document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
      void f;
    },
    glance: (el) => { S.drill = { dim: el.dataset.dim, filter: {} }; rerenderSection('explore'); document.getElementById('drill').scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    lens: (el) => { S.lens = el.dataset.key; S.drill = null; rerenderSection('explore'); },
    drill: (el) => { S.drill = { dim: el.dataset.dim, filter: JSON.parse(el.dataset.filter) }; rerenderSection('explore'); const d = document.getElementById('drill'); d && d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); },
    'drill-close': () => { S.drill = null; rerenderSection('explore'); },
    theme: (el) => { S.themeOpen = S.themeOpen === el.dataset.key ? null : el.dataset.key; if (el.closest('.sheet')) refreshSheet(); else rerenderSection('comments'); },
    release: () => { S.pendingWindow = Number($('#win').value); S.confirming = true; render(); $('.confirm') && $('.confirm').scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    'release-cancel': () => { S.confirming = false; render(); },
    'release-now': () => {
      const at = Date.now();
      const win = S.pendingWindow || 30;
      const payload = JSON.stringify(S.a.focus.map((f) => [f.headline, f.g.fav, f.g.n]));
      S.store.release = { at, window: win, due: at + win * 86400000, fp: fingerprint(payload + at) };
      S.confirming = false; save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); toast('Released to everyone');
    },
    preview: (el) => preview(el.dataset.k),
    'close-sheet': closeSheet,
    'emp-day': (el) => { S.empDay = Number(el.dataset.d); refreshSheet(); },
    dept: (el) => { S.deptPick = el.dataset.v; refreshSheet(); },
    ack: (el) => { S.store.responses[el.dataset.id] = { ...(S.store.responses[el.dataset.id] || {}), status: 'ack', ackAt: Date.now() }; save(); render(); toast('Acknowledged. Employees can see it.'); },
    compose: (el) => { S.composing = el.dataset.id; render(); const f = $('#r-heard'); f && f.focus({ preventScroll: true }); document.getElementById('ft-' + el.dataset.id).scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'compose-cancel': () => { S.composing = null; render(); },
    'fill-example': (el) => { const f = S.a.focus.find((x) => x.id === el.dataset.id); const s = suggestions(f); $('#r-heard').value = s.heard; $('#r-first').value = s.first; $('#r-wont').value = s.wont; },
    done: (el) => { S.store.responses[el.dataset.id].status = 'done'; save(); render(); toast('Marked done'); },
    'log-conf': (el) => logConf(el.dataset.id),
    'reset-demo': () => { S.store = { release: null, responses: {}, conf: {} }; S.empDay = 0; save(); render(); toast('Demo reset. Nothing has been released.'); },
    'ai-themes': () => runAiThemes(),
    'ai-off': () => { S.aiThemes = null; S.themeOpen = null; rerenderSection('comments'); },
  };

  function rerenderSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const html = { explore: () => secExplore(), comments: () => secComments() }[id]();
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    el.replaceWith(tmp.firstElementChild);
  }

  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); closeSheet(); go(g.dataset.go); return; }
    const sc = e.target.closest('[data-scroll]');
    if (sc) { e.preventDefault(); const t = document.getElementById(sc.dataset.scroll); t && t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const a = e.target.closest('[data-act]');
    if (a && actions[a.dataset.act]) { e.preventDefault(); actions[a.dataset.act](a); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'f-resp' && e.target.files[0]) readFile(e.target.files[0], 'responses');
    if (e.target.id === 'f-hc' && e.target.files[0]) readFile(e.target.files[0], 'headcount');
    if (e.target.id === 'm-org') S.meta.org = e.target.value.trim() || 'Your organisation';
    if (e.target.id === 'm-survey') S.meta.survey = e.target.value.trim() || 'Employee survey';
    if (e.target.id === 'm-period') S.meta.period = e.target.value.trim();
    if (e.target.id === 'invited') { const v = Number(e.target.value); S.settings.invited = v > 0 ? v : null; }
  });
  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.dataset.form === 'respond') {
      const id = form.dataset.id;
      S.store.responses[id] = { status: 'plan', heard: $('#r-heard').value.trim(), first: $('#r-first').value.trim(), wont: $('#r-wont').value.trim(), when: $('#r-when').value, at: Date.now() };
      S.composing = null; save(); render(); const card = document.getElementById('ft-' + id); card && card.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Published. Employees can read it now.');
    }
    if (form.dataset.form === 'conf') {
      S.store.conf[form.dataset.id] = { status: $('#c-status').value, note: $('#c-note').value.trim(), at: Date.now() };
      save(); closeSheet(); render(); toast('Saved to the confidential log');
    }
  });
  // Drag and drop onto the start screen.
  document.addEventListener('dragover', (e) => { const dz = e.target.closest && e.target.closest('.dropzone'); if (dz) { e.preventDefault(); dz.classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const dz = e.target.closest && e.target.closest('.dropzone'); if (dz) dz.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    const dz = e.target.closest && e.target.closest('.dropzone');
    if (!dz) return; e.preventDefault(); dz.classList.remove('over');
    const files = [...e.dataTransfer.files].filter((f) => /\.csv$/i.test(f.name) || f.type === 'text/csv');
    if (!files.length) { S.error = 'That isn’t a CSV file. Export your survey results as CSV and try again.'; render(); return; }
    // If two files are dropped, the one with rating answers is the survey; the other is headcount.
    files.forEach((f) => readFile(f, dz.id === 'dz-resp' && files.length === 1 ? 'responses' : 'auto'));
  });

  const SCREENS = { start: screenStart, check: screenCheck, reading: screenReading, results: () => screenResults(), release: screenRelease, follow: screenFollow, employees: () => `<div class="wrap emp-stage">${employeePage(0)}</div>` };
  const after = { reading: afterReading, results: afterResults };

  // Boot. When served by server.mjs, AI theming becomes available.
  if (/^https?:/.test(location.protocol)) fetch('/api/health').then((r) => (r.ok ? r.json() : null)).then((h) => { if (h && h.ai) { S.ai = h; if (S.screen === 'results') rerenderSection('comments'); } }).catch(() => {});
  // Deep links open on the sample so a shared link always shows something real.
  function bootSample() {
    const { rows, headcount } = D.generate();
    S.files.responses = { name: D.files.responses, ...E.parseCSV(D.toCSV(rows)) };
    S.files.headcount = { name: D.files.headcount, ...E.parseCSV(D.toCSV(headcount)) };
    S.sample = true; S.meta = { org: D.org, survey: D.survey, period: D.period };
    prepare(); analyse();
  }
  const initial = location.hash.slice(1);
  if (initial && initial !== 'start' && DATA_SCREENS.includes(initial)) {
    bootSample();
    go(initial === 'reading' || initial === 'check' ? 'results' : initial);
  } else go('start');
})();
