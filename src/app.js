/* VoiceBridge app: screens, state and interactions. */
(function () {
  const D = window.VB_DATA, E = window.VB_ENGINE, G = window.VB_GUIDE, IN = window.VB_INTAKE;
  const pct = E.pct;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const quoteHTML = (t) => esc(t).replace(/\[(name|number removed|email removed|ID number removed)\]/g, (m, x) => `<span class="redacted">${x === 'name' ? 'name removed' : x}</span>`);
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
    open: null, lens: null, drill: null, themeOpen: null, themeAll: null, quotesAll: {}, simOpen: {},
    store: { release: null, responses: {}, conf: {} },
    composing: null, empDay: 0, deptPick: null,
    error: null,
  };
  const LEADERS = () => (S.sample ? D.leaders : {});
  // Saved release state belongs to one exact pair of files: a different survey never picks up another's release.
  function dataKey() {
    const r = S.files.responses, h = S.files.headcount;
    if (!r) return 'none';
    if (!r.key) r.key = fingerprint(JSON.stringify([r.headers, r.rows.map((x) => r.headers.map((k) => x[k]))]));
    const hk = h ? (h.key || (h.key = fingerprint(JSON.stringify([h.headers, h.rows.length, h.rows.slice(0, 50)])))) : '-';
    return r.key + '/' + hk;
  }
  const storeKey = () => 'vb2:' + dataKey();
  function load() {
    S.store = { release: null, responses: {}, conf: {} };
    try { const v = JSON.parse(localStorage.getItem(storeKey()) || 'null'); if (v) S.store = Object.assign({ release: null, responses: {}, conf: {} }, v); }
    catch (e) { S.storageFailed = true; }
  }
  function save() { try { localStorage.setItem(storeKey(), JSON.stringify(S.store)); S.storageFailed = false; } catch (e) { S.storageFailed = true; } }

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
    try {
      app.innerHTML = bar() + `<main id="main">${SCREENS[S.screen]()}</main>`;
      after[S.screen] && after[S.screen]();
    } catch (e) { showProblem(e); }
  }
  // Safety net: if anything unexpected goes wrong, the page says so plainly instead of freezing or going blank.
  // The files stay loaded, and nothing has been sent anywhere.
  function showProblem(e) {
    try { console.error('VoiceBridge:', e); } catch (x) { /* no console */ }
    const app = $('#app');
    app.innerHTML = `<div class="wrap"><section class="check"><div class="hc-warn" role="alert">
      <h3>${I.wait} Something went wrong on this screen</h3>
      <p>VoiceBridge hit a problem it didn’t expect. Your files are still loaded in this browser and nothing has been sent anywhere.</p>
      <p class="faint" style="font-size:13px">Technical detail: ${esc(String((e && e.message) || e)).slice(0, 300)}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px"><button class="btn btn-primary btn-sm" data-act="home">Go back to the start</button><button class="btn btn-ghost btn-sm" data-act="retry">Try again</button></div>
    </div></section></div>`;
  }
  window.addEventListener('error', (e) => { if (e && e.error) showProblem(e.error); });
  window.addEventListener('unhandledrejection', (e) => showProblem(e && e.reason));

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

  // A refusal says what happened, why it matters and what to do, in that order.
  function errorBox(err) {
    if (typeof err === 'string') return `<p class="err" role="alert">${esc(err)}</p>`;
    return `<div class="err-box" role="alert"><b>${esc(err.title)}</b><p>${esc(err.detail)}</p>${err.fix ? `<p><b>What to do:</b> ${esc(err.fix)}</p>` : ''}</div>`;
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
          <div class="promise">${I.shield}<span>Names, emails, ID and phone numbers are removed before anything is analysed.</span></div>
          <div class="promise">${I.eyeoff}<span>No group smaller than 5 people is ever shown, in any report.</span></div>
          <div class="promise">${I.laptop}<span>Your file is read in this browser. Nothing is uploaded.</span></div>
        </div>
      </div>
      <div class="card drop">
        <label class="dropzone" id="dz-resp" for="f-resp">
          <span style="color:var(--accent)">${I.up}</span>
          ${r ? `<span class="file-ok">${I.check} ${esc(r.name)} <button type="button" class="file-x" data-act="remove-file" data-k="responses" aria-label="Remove ${esc(r.name)}" title="Remove this file">${I.x}</button></span><span class="faint">${E.cleanRows(r.headers, r.rows).rows.length} responses</span>` : `<span class="big">Drop your survey export here</span><span class="faint">You can drop the headcount file at the same time</span><span class="faint">CSV or Excel from Microsoft Forms, Google Forms, Qualtrics or SurveyMonkey</span>`}
          <input id="f-resp" type="file" accept=".csv,.tsv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr">
        </label>
        <div class="hc-row">
          ${h ? `${I.check}<span>Headcount: <b>${esc(h.name)}</b> (${h.rows.length} people)</span><button type="button" class="file-x" data-act="remove-file" data-k="headcount" aria-label="Remove ${esc(h.name)}" title="Remove this file">${I.x}</button>` : `<span>Add a headcount file so response rates can be checked for every group.</span><label class="btn-quiet" for="f-hc" style="cursor:pointer">Add headcount</label>`}
          <input id="f-hc" type="file" accept=".csv,.tsv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr">
        </div>
        ${S.reading ? `<p class="faint" role="status">Reading ${esc(S.reading)}…</p>` : ''}
        ${S.error ? errorBox(S.error) : ''}
        ${S.info ? `<p class="tip" role="status">${I.info}<span>${esc(S.info)}</span></p>` : ''}
        ${r ? `<button class="btn btn-primary btn-lg" data-act="to-check">Continue ${I.arrow}</button>` : ''}
        <div class="or">or</div>
        <button class="sample" data-act="sample">
          <span class="logo">K</span>
          <span><b>Try it with Kumo Logistics</b><small>A fictional South African logistics company: 600 staff, September survey. All data is synthetic.</small></span>
          <span style="color:var(--accent)">${I.arrow}</span>
        </button>
        ${S.a ? `<button class="btn btn-ghost" data-go="results">Back to ${esc(S.meta.org)} results</button>` : ''}
      </div>
    </section>
    ${needsCard()}</div>`;
  }

  // What a file needs for an accurate, reliable report (added after the stress test, 17 Oct 2026),
  // so people know the rules before they upload rather than finding out from an error.
  function needsCard() {
    const need = [
      ['One row per person, as CSV or Excel', 'Export from Microsoft Forms, Google Forms, Qualtrics or SurveyMonkey and upload it as it is. Excel workbooks (.xlsx) and CSV files both work. “Total” or “Average” rows are removed automatically.'],
      ['Rating questions on a 1–5 agreement scale', 'Strongly disagree, Disagree, Neither agree nor disagree, Agree, Strongly agree (other wordings such as “Somewhat agree” work too), or the numbers 1–5. Answers coded 0–4 are converted. Other scales (1–7, 1–10, yes/no) can’t be read.'],
      ['Each question tagged with its theme', 'Put the theme in square brackets at the start, e.g. “[Belonging] I can be myself at work”, with at least two questions per theme. Untagged questions can be sorted into themes on the next screen.'],
      ['Columns that describe people', 'For example Department, Gender, Race, Occupational level, Length of service. Spell each label the same way every time (always “Female”, never a mix of “F” and “Female”).'],
      [`At least ${E.MIN_RESPONSES} responses`, 'Fewer than that and the results are too uncertain to report, and people could be recognised. Any group smaller than 5 is hidden.'],
      ['Optional: a headcount file', 'One row for everyone who was invited, with the same column names and the same labels as the survey. It lets VoiceBridge check response rates and run the silence test. If the labels don’t match, VoiceBridge won’t analyse until they do.'],
      ['Optional: comment questions', 'Names, ID numbers, phone numbers and emails are removed automatically, but only common names are recognised, so skim the quotes before release.'],
    ];
    return `<section class="card needs" aria-labelledby="needs-h">
      <h2 id="needs-h">What your file needs</h2>
      <p class="muted">VoiceBridge can only be as accurate as the data you give it. These rules keep the report reliable and anonymous.</p>
      <ol class="needs-list">${need.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
      <div class="needs-go"><button class="btn btn-primary btn-sm" data-act="template-xlsx">Download the Excel template (easiest to read)</button><button class="btn btn-ghost btn-sm" data-act="template" data-k="survey">Download a survey template</button><button class="btn btn-ghost btn-sm" data-act="template" data-k="headcount">Download a headcount template</button></div>
    </section>`;
  }

  // Small example files in exactly the format VoiceBridge reads. Made in the browser; nothing is sent anywhere.
  const TEMPLATES = {
    survey: ['Response ID,Department,Gender,Race,Occupational level,Length of service,B1 [Belonging] I can be myself at work,B2 [Belonging] People here treat me with respect,V1 [Voice] I can raise a concern without fear,V2 [Voice] When I speak up my input is taken seriously,What one thing would make this a better place to work?',
      'R001,Operations,Female,Black African,Semi-skilled,1–3 years,Agree,Strongly agree,Disagree,Neither agree nor disagree,More training for shift leaders',
      'R002,Finance,Male,White,Skilled,5+ years,Strongly agree,Agree,Agree,Agree,',
      'R003,Operations,Female,Coloured,Skilled,Under 1 year,Disagree,Agree,Strongly disagree,Disagree,Nobody listens when we raise safety issues'].join('\r\n'),
    headcount: ['Employee no.,Department,Gender,Race,Occupational level,Length of service',
      'E001,Operations,Female,Black African,Semi-skilled,1–3 years',
      'E002,Finance,Male,White,Skilled,5+ years',
      'E003,Operations,Female,Coloured,Skilled,Under 1 year'].join('\r\n'),
  };
  // Excel version of both templates, with a plain-English "Read me first" sheet (stress-test log, row 3, 20 October).
  // Built once with sample/voicebridge_template.xlsx and stored here so the page still works offline.
  const TEMPLATE_XLSX = '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';
  function downloadExcelTemplate() {
    const bytes = Uint8Array.from(atob(TEMPLATE_XLSX), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'voicebridge_template.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function downloadTemplate(kind) {
    const blob = new Blob(['\ufeff' + TEMPLATES[kind] + '\r\n'], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `voicebridge_${kind}_template.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Reading uploads. Every file goes through intake.js, which reads CSV and Excel, fixes what is safe to fix,
  // and refuses (with a reason and a fix) what it can't read correctly. Nothing leaves the browser.
  async function fileBytes(file) {
    if (typeof file.arrayBuffer === 'function') return new Uint8Array(await file.arrayBuffer());
    if (file.bytes) return file.bytes;                                      // test harness
    if (typeof file.text === 'string') return new TextEncoder().encode(file.text);
    return new Uint8Array(await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsArrayBuffer(file); }));
  }
  const README = /read ?me|instructions|notes|about|help/i;
  // slot: 'responses' (survey box), 'headcount' (headcount box) or 'auto' (several files dropped at once).
  function readFiles(list, slot) {
    const job = (async () => {
      if (slot !== 'headcount' || S.errorSlot === 'headcount') S.error = null;
      S.info = null; S.reading = list.map((f) => f.name).join(' and '); render();
      const before = S.error;
      try {
        const sheets = [];
        for (const f of list) {
          const res = await IN.read(await fileBytes(f), f.name);
          if (!res.ok) { S.error = res.error; return; }
          res.sheets.filter((sh) => !(res.sheets.length > 1 && README.test(sh.name))).forEach((sh) => sheets.push({ ...sh, file: f.name, format: res.format, label: res.sheets.length > 1 ? `the “${sh.name}” sheet of “${f.name}”` : `“${f.name}”`, survey: IN.isSurvey(sh) }));
        }
        const surveys = sheets.filter((x) => x.survey), others = sheets.filter((x) => !x.survey);
        const useSurvey = (x) => {
          const p = IN.prepareSurvey(x, x.label);
          if (!p.ok) { S.error = p.error; return false; }
          S.files.responses = { name: x.file + (x.label.startsWith('the') ? ` (${x.name} sheet)` : ''), headers: p.headers, rows: p.rows, notes: p.notes, warnings: p.warnings, format: x.format };
          S.sample = false; S.a = null; S.themeOverrides = {};
          const guess = x.file.replace(/\.(csv|tsv|txt|xlsx)$/i, '').split(/[_\s-]+/)[0] || 'Your organisation';
          S.meta = { org: guess.charAt(0).toUpperCase() + guess.slice(1), survey: 'Employee survey', period: '' };
          return true;
        };
        const useHeadcount = (x) => {
          const p = IN.prepareHeadcount(x, x.label);
          if (!p.ok) { S.error = p.error; return false; }
          S.files.headcount = { name: x.file + (x.label.startsWith('the') ? ` (${x.name} sheet)` : ''), headers: p.headers, rows: p.rows, notes: p.notes, warnings: p.warnings };
          return true;
        };
        if (slot === 'headcount') {
          if (surveys.length) { S.error = { title: `${cap(surveys[0].label)} looks like a survey file, not a headcount`, detail: 'It has answers to rating questions. A headcount lists everyone who was invited, with their department, gender and so on, and no answers.', fix: 'Put the survey export in the survey box, and a headcount (or nothing) in the headcount box.' }; return; }
          if (others.length > 1) { S.error = { title: 'That workbook has more than one sheet of people', detail: `VoiceBridge found ${others.length} sheets (${others.map((x) => `“${x.name}”`).join(', ')}) and can’t tell which is the headcount.`, fix: 'Keep only the headcount sheet, or save it as its own CSV file.' }; return; }
          if (useHeadcount(others[0]) && S.screen === 'check' && S.files.responses) prepare();
          return;
        }
        if (surveys.length > 1) {
          S.error = { title: 'More than one survey file', detail: `${surveys.map((x) => cap(x.label)).join(' and ')} all contain survey answers. VoiceBridge reports on one survey at a time.`, fix: 'Upload one survey export, plus its headcount if you have one. To combine two exports, paste them into one file first.' };
          return;
        }
        if (!surveys.length) {
          if (slot === 'auto' && list.length > 1) { S.error = { title: 'None of those files has survey answers', detail: `VoiceBridge couldn’t find rating questions in ${list.map((f) => `“${f.name}”`).join(' or ')}.`, fix: 'Check that one of them is the survey export (one row per person, with answers from Strongly disagree to Strongly agree).' }; return; }
          if (slot === 'auto' && others.length === 1 && S.files.responses) { useHeadcount(others[0]); return; }
          const p = IN.prepareSurvey(others[0], others[0].label);
          S.error = p.ok ? null : { ...p.error, fix: p.error.fix + (p.error.code === 'norating' ? ' If this is the headcount file, add it with “Add headcount” instead.' : '') };
          return;
        }
        if (others.length > 1) { S.error = { title: 'Too many files', detail: `VoiceBridge needs one survey export and, optionally, one headcount, but got ${sheets.length}: ${sheets.map((x) => x.label).join(', ')}.`, fix: 'Upload just the survey and its headcount.' }; return; }
        if (!useSurvey(surveys[0])) return;
        if (others.length === 1) {
          if (useHeadcount(others[0]) && surveys[0].file === others[0].file) S.info = `Read the survey and the headcount from the two sheets of “${surveys[0].file}”.`;
        }
      } catch (e) {
        S.error = { title: 'VoiceBridge couldn’t read that file', detail: `Something unexpected happened while reading it (${String((e && e.message) || e).slice(0, 120)}).`, fix: 'Save it again from your survey tool or Excel as “CSV UTF-8”, and upload that.' };
      } finally {
        if (S.error && S.error !== before) S.errorSlot = slot;
        S.reading = null; render();
      }
    })();
    pending.add(job); job.finally(() => pending.delete(job));
    return job;
  }
  const pending = new Set();
  // Lets automated tests wait until every file being read has finished.
  window.VB_WHEN_IDLE = () => Promise.all([...pending]);
  // ------------------------------------------------------------ Check
  function prepare() {
    const r = S.files.responses;
    load();
    // After a release, the settings it was made with are locked, so the published findings can't quietly change.
    const locked = S.store.release && S.store.release.settings;
    if (locked) { S.settings.minGroup = locked.minGroup; S.themeOverrides = { ...(locked.themes || {}) }; if (locked.invited) S.settings.invited = locked.invited; }
    S.clean = E.cleanRows(r.headers, r.rows);
    S.cols = E.detect(r.headers, S.clean.rows, { themes: S.themeOverrides });
    S.ds = E.buildDataset(S.cols, S.clean.rows, S.files.headcount ? S.files.headcount.rows : null);
  }

  // Lets the user check, and change, which theme each question belongs to.
  // Opens by itself when some questions couldn't be placed (they would otherwise be lumped together as "General").
  const STANDARD_THEMES = ['Fairness & advancement', 'Belonging & respect', 'Voice & safety', 'My manager', 'Growth', 'Trust in follow-through', 'Wellbeing', 'Engagement'];
  function themeEditor(cols) {
    const ratings = cols.filter((c) => c.role === 'rating');
    const general = ratings.filter((c) => c.theme === 'General');
    const guessed = ratings.filter((c) => c.themeGuessed && !c.themeChosen);
    const options = [...new Set([...ratings.map((c) => c.theme), ...STANDARD_THEMES])].filter((t) => t !== 'General').concat('General');
    const open = S.themeEditOpen || general.length > 0;
    return `${general.length ? `<p class="err" role="status">${I.wait} ${general.length} question${general.length === 1 ? '' : 's'} couldn’t be placed in a theme and ${general.length === 1 ? 'is' : 'are'} grouped as “General”, which mixes unrelated questions and can hide real findings. Choose a theme for ${general.length === 1 ? 'it' : 'each one'} below.</p>` : ''}
      ${guessed.length && !general.length ? `<p class="tip">${I.info}<span>${guessed.length} question${guessed.length === 1 ? ' wasn’t' : 's weren’t'} tagged with a theme, so VoiceBridge placed ${guessed.length === 1 ? 'it' : 'them'} by ${guessed.length === 1 ? 'its' : 'their'} wording. Check the placement below.</span></p>` : ''}
      <details class="theme-edit" ${open ? 'open' : ''}><summary>Check or change which theme each question is in</summary>
        <div class="theme-rows">${ratings.map((c) => `<label class="theme-row ${c.theme === 'General' ? 'is-general' : ''}"><span>${esc(c.text)}${c.themeGuessed && !c.themeChosen ? ' <small class="faint">(placed by wording)</small>' : ''}</span>
          <select data-theme-for="${esc(c.header)}" aria-label="Theme for ${esc(c.text)}" ${S.store.release ? 'disabled' : ''}>${options.map((t) => `<option ${t === c.theme ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}</div>
      </details>`;
  }

  // Explains why the analysis is blocked (too few responses). Headcount problems are explained in hcWarning.
  function blockPanel(blocks) {
    const few = blocks.find((b) => b.kind === 'too-few');
    if (!few) return '';
    return `<div class="hc-warn" role="alert"><h3>${I.wait} Too few responses to report on</h3>
      <p>This file has <b>${few.n} real responses</b>. VoiceBridge needs at least <b>${few.min}</b>. With fewer, the organisation-wide figures could be out by more than 22 percentage points, almost every group falls under the anonymity threshold, and people could be recognised from their answers.</p>
      <p>If this is a small team, discuss the results with them directly rather than through a report.</p></div>`;
  }

  // Lists any headcount problems found by the engine, in plain language, with what to change in the file.
  function hcWarning(issues) {
    if (!issues || !issues.length) return '';
    const q = (v) => `<code>${esc(v)}</code>`;
    const line = (i) => i.kind === 'labels'
      ? `<li><b>${esc(i.col)}</b>: the survey uses ${i.missing.slice(0, 4).map(q).join(', ')}${i.missing.length > 4 ? ' …' : ''}, which ${i.missing.length === 1 ? 'doesn’t' : 'don’t'} appear in the headcount’s <b>${esc(i.hcCol)}</b> column${i.hcOnly.length ? ` (it uses ${i.hcOnly.slice(0, 4).map(q).join(', ')})` : '. The headcount may be missing people'}.</li>`
      : `<li><b>${esc(i.col)}</b>: more people responded than the headcount lists (${i.over.slice(0, 3).map((o) => `${q(o.value)} ${o.responded} responses, ${o.headcount} in headcount`).join('; ')}). The headcount may be out of date.</li>`;
    return `<div class="hc-warn" role="alert"><h3>${I.wait} The headcount doesn’t match the survey</h3>
      <ul>${issues.map(line).join('')}</ul>
      <p><b>VoiceBridge won’t analyse until this is fixed.</b> With these labels it can’t work out response rates or run the silence test for these groups, so findings could look more certain than they are. Change the labels in the headcount file to match the survey exactly, then use <b>Upload a corrected headcount</b> below.</p>
      <p class="faint" style="font-size:13px">Organisations without a headcount file can still use VoiceBridge: start again without one. Every finding is then labelled “silence test not run”.</p></div>`;
  }

  // Everything VoiceBridge changed to read the file, and anything the user should check, in plain sentences.
  function readNotes() {
    const r = S.files.responses, h = S.files.headcount;
    const notes = [...(r && r.notes || []).map((n) => ['survey', n]), ...(h && h.notes || []).map((n) => ['headcount', n])];
    const warns = [...(r && r.warnings || []), ...(h && h.warnings || [])];
    if (!notes.length && !warns.length) return '';
    return `<div class="card check-sec"><h2>${I.info} How VoiceBridge read your file${h && h.notes && h.notes.length ? 's' : ''}</h2>
      ${warns.length ? `<div class="hc-warn" role="status"><h3>${I.wait} Please check</h3><ul>${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
      ${notes.length ? `<ul class="read-notes">${notes.map(([k, n]) => `<li>${h && h.notes && h.notes.length ? `<b>${k === 'survey' ? 'Survey' : 'Headcount'}:</b> ` : ''}${esc(n)}</li>`).join('')}</ul>` : ''}
    </div>`;
  }

  function screenCheck() {
    const cols = S.cols, ds = S.ds, r = { ...S.files.responses, rows: S.clean.rows };
    const rm = S.clean.removed;
    const blocks = E.blockers(ds);
    const pii = cols.filter((c) => c.role === 'pii');
    const ignored = cols.filter((c) => c.role === 'ignore');
    const groups = cols.filter((c) => c.role === 'group');
    const comments = cols.filter((c) => c.role === 'comment');
    const items = cols.filter((c) => c.role === 'rating').length;
    const reversed = cols.filter((c) => c.reverse);
    // Count real identifiers: Microsoft Forms fills "Email" with "anonymous" when responses are anonymous.
    const realIds = (c) => S.clean.rows.filter((row) => { const v = String(row[c.header] || '').trim(); return v && !/^(anonymous|anon|n\/?a|-)$/i.test(v) && (!/email/i.test(c.why) || v.includes('@')); }).length;
    const hasEmail = pii.some((c) => /email/i.test(c.why) && realIds(c) > 0);
    const N = ds.population ? ds.population.length : S.settings.invited;
    return `<div class="wrap"><section class="check">
      <div>
        <p class="eyebrow">Before anything is analysed</p>
        <h1 style="margin-top:10px">Here’s what’s in ${S.sample ? 'the Kumo file' : 'your file'}</h1>
        <p class="summary">${r.rows.length} responses · ${items} rating questions in ${ds.dims.length} themes · ${comments.length} comment question${comments.length === 1 ? '' : 's'} · ${groups.length} ways to group people</p>
      </div>
      ${blocks.length ? `<p class="err" role="alert">${I.wait} VoiceBridge can’t analyse this yet: ${blocks.map((b) => b.kind === 'too-few' ? `only ${b.n} responses (it needs at least ${b.min})` : 'the headcount doesn’t match the survey').join(', and ')}. Details below.</p>` : ''}

      <div class="card check-sec">
        <h2>Report details</h2>
        <div class="meta-fields">
          <label for="m-org">Organisation<input id="m-org" type="text" value="${esc(S.meta.org)}"></label>
          <label for="m-survey">Survey<input id="m-survey" type="text" value="${esc(S.meta.survey)}"></label>
          <label for="m-period">When it ran<input id="m-period" type="text" placeholder="e.g. September 2026" value="${esc(S.meta.period)}"></label>
        </div>
      </div>

      ${readNotes()}
      ${S.store.release ? `<div class="card check-sec"><h2>${I.lock} Released ${fmtDate(S.store.release.at)}: settings locked</h2>
        <p class="muted">These results have been released, so the settings they were made with (anonymity threshold ${S.settings.minGroup}${Object.keys(S.themeOverrides || {}).length ? ', your theme choices' : ''}) can’t be changed. Otherwise the published findings could quietly change.</p>
        ${S.confirmUnrelease ? `<div class="confirm" role="alertdialog"><b>Start a new release?</b><p class="muted">This removes the current release, and every leader response saved in this browser, for this file. It can’t be undone.</p><div class="row"><button class="btn btn-primary btn-sm" data-act="unrelease-yes">Yes, start a new release</button><button class="btn btn-ghost btn-sm" data-act="unrelease-no">Keep the release</button></div></div>` : `<div><button class="btn btn-ghost btn-sm" data-act="unrelease">Start a new release</button></div>`}</div>` : ''}

      <div class="card check-sec">
        <h2>${I.shield} Removed before analysis</h2>
        <div class="removed">
          ${pii.map((c) => { const n = realIds(c); return `<div class="removed-row"><span><b>${esc(c.header)}</b></span><span>${n ? `${esc(c.why)} · ${n} removed, never analysed` : 'Empty or “anonymous” · not used'}</span></div>`; }).join('')}
          ${ignored.length ? `<div class="removed-row"><span>${ignored.map((c) => esc(c.header)).join(', ')}</span><span>Not needed, not used</span></div>` : ''}
          ${S.clean.total ? `<div class="removed-row"><span>${S.clean.total} row${S.clean.total === 1 ? '' : 's'} that ${S.clean.total === 1 ? 'isn’t' : 'aren’t'} a real response</span><span>${[
            rm.duplicates ? `${rm.duplicates} exact duplicate${rm.duplicates === 1 ? '' : 's'} (the same submission twice)` : '',
            rm.empty ? `${rm.empty} empty (no rating question answered)` : '',
            rm.summary ? `${rm.summary} summary row${rm.summary === 1 ? '' : 's'} such as “Total”` : '',
          ].filter(Boolean).join(' · ')}. Not counted.</span></div>` : ''}
          <div class="removed-row"><span>Names, ID numbers, phone numbers and emails typed into comments</span><span>Removed automatically. Only common names are recognised, so skim the quotes before you release.</span></div>
        </div>
        ${hasEmail ? `<p class="tip">${I.info}<span>Your survey collected email addresses. Next time, switch on anonymous mode in your survey tool. People answer more honestly when they know they can’t be identified.</span></p>` : ''}
      </div>

      <div class="card check-sec">
        <h2>Themes <span class="chip">${ds.dims.length}</span></h2>
        <div class="themes-list">${ds.dims.map((d) => `<div class="theme-pill"><b>${esc(d.label)}</b><small>${d.items.length} question${d.items.length === 1 ? '' : 's'}</small></div>`).join('')}</div>
        ${themeEditor(cols)}
        ${reversed.length ? `<p class="tip">${I.info}<span><b>Reverse-scored:</b> ${reversed.map((c) => esc(c.header)).join(', ')}. Agreeing with ${reversed.length === 1 ? 'this question' : 'these questions'} means a worse experience, and the answers run opposite to the rest of the survey, so they are flipped before anything is scored.</span></p>` : ''}
      </div>

      <div class="card check-sec">
        <h2>Ways to group people <span class="chip">${groups.length}</span></h2>
        <div class="group-chips">${groups.map((g) => `<span class="chip">${esc(g.header)} <small>${g.semantic === 'team' ? `${g.values.length} teams · confidential checks only` : `${g.values.filter((v) => !E.PREFER_NOT.test(v)).length} ${g.band ? 'bands' : 'groups'}`}</small></span>`).join('')}</div>
        ${groups.some((g) => g.band) ? `<p class="tip">${I.info}<span>${groups.filter((g) => g.band).map((g) => `<b>${esc(g.header)}</b> is grouped into bands (${g.values.map(esc).join(', ')})`).join('; ')}.</span></p>` : ''}
        ${groups.length ? `<p class="tip">${I.info}<span>Teams are too small to report on safely, so they are only used to spot patterns that need a confidential look.</span></p>`
          // A survey export can arrive with no demographic or department columns at all (found testing a real survey file, 19 October).
          : `<p class="tip">${I.info}<span>This file has no columns to group people by, such as department, gender or occupational level. VoiceBridge will report on the organisation as a whole only: no group comparisons, confidential checks or perception gap.</span></p>`}
      </div>

      <div class="card check-sec">
        <h2>Who was invited</h2>
        ${ds.population ? `<p>Matched to <b>${ds.population.length} people</b> in <b>${esc(S.files.headcount.name)}</b>${ds.population.mapped.length ? `, by ${ds.population.mapped.map(esc).join(', ')}` : ''}. Overall response rate: <b>${pct(r.rows.length / ds.population.length)}</b>.</p>${hcWarning(ds.population.issues)}`
          : `<div class="inline-field"><label for="invited">How many people were invited?</label><input id="invited" type="number" min="${r.rows.length}" placeholder="e.g. ${Math.round(r.rows.length * 1.5)}" value="${S.settings.invited || ''}"><span class="faint">${N ? `Response rate ${pct(r.rows.length / N)}` : 'Needed for the response rate.'}</span></div>
             <p class="tip">${I.info}<span>With a headcount file (from your HR system or EE report) VoiceBridge can check the response rate of every group, not just the total.</span></p>`}
      </div>

      <div class="card check-sec">
        <h2>${I.eyeoff} Anonymity</h2>
        <div class="inline-field">
          <span>Hide any group smaller than</span>
          <span class="stepper"><button data-act="k-" aria-label="Fewer" ${S.store.release ? 'disabled' : ''}>−</button><output id="k-out">${S.settings.minGroup}</output><button data-act="k+" aria-label="More" ${S.store.release ? 'disabled' : ''}>+</button></span>
          <span>people</span>
        </div>
        <p class="tip">${I.info}<span>5 is the common standard. When one group is hidden, the next smallest is hidden too, so nobody can work it out by subtraction.</span></p>
      </div>

      ${blockPanel(blocks)}
      <div class="check-go">
        <button class="btn btn-ghost" data-act="home">Use a different file</button>
        ${blocks.some((b) => b.kind === 'headcount') ? `<label class="btn btn-ghost" for="f-hc2" style="cursor:pointer">Upload a corrected headcount</label><input id="f-hc2" type="file" accept=".csv,.tsv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr">` : ''}
        <button class="btn btn-primary btn-lg" data-act="analyse" ${blocks.length ? 'disabled aria-disabled="true" title="Fix the problems above first"' : ''}>Read the results ${I.arrow}</button>
      </div>
    </section></div>`;
  }

  // ------------------------------------------------------------ Reading
  function screenReading() {
    const a = S.a, ds = S.ds;
    const pii = S.cols.filter((c) => c.role === 'pii').reduce((s, c) => s + c.filled, 0);
    const log = a.comments.log;
    const typed = log.email + log.phone + log.name + (log.id || 0);
    const lines = [
      `Removed ${pii} personal identifiers${typed ? `, and ${typed} name${typed === 1 ? '' : 's'} or number${typed === 1 ? '' : 's'} typed into comments` : ''}`,
      a.N ? `Matched ${a.responded} responses to ${a.N} people invited` : `Read ${a.responded} responses`,
      `Compared ${a.groupsTested} groups across ${ds.dims.length} themes`,
      `Hid ${a.suppressed.length} groups smaller than ${a.settings.minGroup}`,
      `Read ${a.comments.all.length} comments`,
      !a.N ? 'No headcount, so findings couldn’t be tested against the people who stayed silent'
        : [...a.focus, ...a.watch].some((f) => !f.silence) ? 'Tested findings against the people who stayed silent, where the headcount allowed'
        : 'Tested every finding against the people who stayed silent',
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
        <div class="legend glance-key"><span><i style="background:var(--strength)"></i>Green: 70% or more positive, a strength</span><span><i style="background:var(--ink-2)"></i>Grey: 45–69% positive</span><span><i style="background:var(--concern)"></i>Red: under 45% positive, a concern</span><span><i class="tick-key"></i>Thin line: 50%</span></div>
      </div>
      ${a.perception ? perceptionCallout(a.perception) : ''}
    </section>`;
  }

  // "Senior management" -> "People in senior management roles", "Unskilled" -> "People in unskilled roles".
  function levelPeople(v) { return `People in ${v.toLowerCase()}${/\broles?$/i.test(v) ? '' : ' roles'}`; }

  function perceptionCallout(p) {
    return `<div class="callout">
      <h3>Before you read on: leaders see a different organisation</h3>
      <p>${esc(levelPeople(p.top.v))} are positive about ${pct(p.top.avg)} of what we asked. ${esc(levelPeople(p.bottom.v))} are positive about ${pct(p.bottom.avg)} of what we asked. If the findings below don’t match your own experience, that is expected. They describe the experience of people further from the top.</p>
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
      <div class="sec-head"><h2>Focus areas</h2>
        <div class="plain-key"><b>Reading the labels</b><span><b>Clear difference:</b> very unlikely to be chance.</span><span><b>Likely difference:</b> probably real, but less certain.</span><span><b>Passes the silence test:</b> still true even if every person who didn’t answer the survey is happy.</span></div>
        <p>Ranked by how large the difference is, how many people it affects, and how sure we can be. Each one passed three tests: big enough to matter, unlikely to be chance, and still true if everyone who stayed silent is perfectly happy.</p></div>
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
    const sil = f.silence ? (f.silence.survives ? `<span class="chip strength">${I.silence} Passes the silence test</span>` : `<span class="chip concern">${I.wait} Needs more responses</span>`)
      : f.silenceNote ? `<span class="chip concern">${I.wait} Silence test not run</span>` : '';
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
            <p class="faint" style="font-size:12.5px">Dot: share positive about ${esc(E.topicOf(f.dim))}. Grey bar: where the true figure most likely lies (wider means fewer people answered, so less certain). Dashed line: the whole organisation.${f.kind === 'org' ? '' : ' <span style="color:var(--concern);font-weight:650">Red: the group this finding is about.</span>'}</p>
            ${itemsTable(f)}
            ${f.also.length ? `<p class="muted" style="font-size:14px">Also lower for this group: ${f.also.map((x) => `<b>${esc(x.dim.label)}</b> (${pct(x.g.p)} vs ${pct(x.o.p)})`).join(', ')}.</p>` : ''}
          </div>
          ${f.silence ? `<div class="blk"><h4>The silence test</h4>${silenceBlock(f)}</div>` : f.silenceNote ? `<div class="blk"><h4>The silence test</h4><p class="sil-note">${I.wait}<span>${esc(f.silenceNote)}</span></p></div>` : ''}
        </div>
        <div class="fa-col">
          ${f.quotes.length ? quotesBlock(f) : ''}
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

  // Graph labels: "People with a disability" becomes "With disability" so it fits (stress-test log, row 5, 20 October).
  function graphLabel(label) {
    return fixCase(label).replace(/^People (with|without) a disability$/, (m, w) => (w === 'with' ? 'With disability' : 'Without disability')).replace(/ (with|without) a disability\b/, ' $1 disability');
  }

  // Every group large enough to report is shown, so the group a finding is about can never be cut off
  // (it used to stop after 12 rows, sorted high to low). Hidden small groups are summed up in one line.
  function dotPlot(rows, avg, plain) {
    const shown = rows.filter((r) => !r.hidden);
    const hiddenN = rows.length - shown.length;
    return `<div class="dots" role="img" aria-label="Share positive by group">
      ${shown.map((r) => `<div class="dot-row ${r.highlight ? 'hl' : ''} ${r.hidden ? 'hid' : ''}">
        <span class="lbl" title="${esc(fixCase(r.label))}">${esc(graphLabel(r.label))}</span>
        <span class="track"><span class="axis"></span><span class="avg" style="left:${avg * 100}%"></span>
          ${r.hidden ? `<span class="hidden-note">Fewer than ${S.a.settings.minGroup} people, hidden</span>` : `<span class="ci" style="left:${r.ci[0] * 100}%;width:${(r.ci[1] - r.ci[0]) * 100}%"></span><span class="pt" style="left:${r.p * 100}%"></span>`}
        </span>
        <span class="v">${r.hidden ? '' : pct(r.p)}</span></div>`).join('')}
      ${hiddenN ? `<p class="faint" style="font-size:12.5px;margin:2px 0 4px">${hiddenN} more group${hiddenN === 1 ? ' has' : 's have'} fewer than ${S.a.settings.minGroup} people and ${hiddenN === 1 ? 'is' : 'are'} hidden.</p>` : ''}
      <div class="dot-axis"><span></span><span class="scale"><span style="left:0">0%</span><span style="left:50%">50%</span><span style="left:100%">100%</span></span><span></span></div>
    </div>`;
  }

  function itemsTable(f) {
    return `<table class="items-tbl"><thead><tr><th>Question</th><th>${f.kind === 'org' ? 'Agree' : esc(fixCase(f.label))}</th>${f.kind === 'org' ? '' : '<th>Everyone else</th>'}</tr></thead><tbody>
      ${f.items.map((it) => `<tr><td>${esc(it.text)}</td><td class="${f.kind !== 'org' && it.pg != null && it.po != null && it.po - it.pg >= 0.1 ? 'c' : ''}">${pct(it.pg)}</td>${f.kind === 'org' ? '' : `<td>${pct(it.po)}</td>`}</tr>`).join('')}
    </tbody></table>`;
  }

  // One quote standing for a group of similar comments. "See all N" lists every person's own comment so a person can check
  // that they really do say the same thing (similar wording is grouped by a rule, not by understanding).
  function quoteGroup(g, ctx) {
    const n = g.items.length, key = ctx + '|' + fingerprint(g.text), open = !!S.simOpen[key];
    return `<div class="quote-g"><p class="quote">“${quoteHTML(g.text)}”${n > 1 ? `<small>${n} people wrote something similar · <button type="button" class="btn-quiet sim-btn" data-act="see-similar" data-key="${esc(key)}" aria-expanded="${open}">${open ? 'Hide' : `See all ${n}`}</button></small>` : ''}</p>
      ${open ? `<ol class="sim-list">${g.items.map((i) => `<li>“${quoteHTML(i.text)}”</li>`).join('')}</ol>` : ''}</div>`;
  }

  // "In their words": three quotes, with "See all" to read every comment this group wrote on this theme.
  function quotesBlock(f) {
    const a = S.a;
    const every = a.quotesFor(f.members, f.dim.key, 1000);
    const total = every.reduce((s, q) => s + q.count, 0);
    // Every comment, one per person, grouped by similar wording; the first three follow the engine's choice of quotes.
    const groups = E.similarGroups(every.flatMap((q) => Array.from({ length: q.count }, () => ({ text: q.text }))));
    const first = [];
    f.quotes.forEach((q) => { const g = groups.find((x) => x.items.some((i) => i.text === q.text)); if (g && !first.includes(g)) first.push(g); });
    const list = S.quotesAll[f.id] ? [...first, ...groups.filter((g) => !first.includes(g))] : first;
    return `<div class="blk"><h4>In their words</h4><div class="quotes">${list.map((g) => quoteGroup(g, 'f:' + f.id)).join('')}</div>
      ${groups.length > first.length ? `<div><button class="btn btn-ghost btn-sm see-all" data-act="quotes-all" data-id="${f.id}">${S.quotesAll[f.id] ? 'Show fewer' : `See all ${total} comments from this group on ${esc(E.topicOf(f.dim))}`}</button></div>` : ''}
      <p class="faint" style="font-size:12.5px">Personal details removed. Quotes appear only for groups of ${a.settings.minGroup} or more.</p></div>`;
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
      <p class="stamp">${s.survives ? I.silence + ' Passes the silence test' : I.wait + ' Doesn’t pass yet'}<span class="faint" style="font-weight:500">· counting the people who didn’t answer, the real figure is somewhere between ${pct(s.floor)} and ${pct(s.ceiling)}</span></p>
      ${s.survives ? '<p class="faint" style="font-size:12.5px">Groups that respond less tend to be less satisfied, not more (Fauth et al., 2013).</p>' : ''}
    </div>`;
  }

  function repBars(rep, attr) {
    return `<div class="rep" aria-label="${esc(attr)} by level">${rep.rows.map((r) => r.hidden
      ? `<div class="rep-row"><span>${esc(r.level)}</span><span class="faint" style="font-size:12px">Fewer than ${S.a.settings.minGroup} people, hidden</span><span></span></div>`
      : `<div class="rep-row"><span>${esc(r.level)}</span><span class="rep-bar"><i style="width:${r.share * 100}%"></i></span><span>${pct(r.share)}</span></div>`).join('')}<p class="faint" style="font-size:12px;margin:4px 0 0">Each bar: the share of that level made up by ${esc(attr.charAt(0).toLowerCase() + attr.slice(1)).replace(/^(black|african|coloured|indian|white)/, (m) => m.charAt(0).toUpperCase() + m.slice(1))}, from the headcount file.</p></div>`;
  }

  function secStrengths() {
    const a = S.a;
    return `<section class="sec" id="strengths">
      <div class="sec-head"><h2>Strengths to protect</h2><p>What’s working. Changes made to fix the focus areas shouldn’t break these.</p></div>
      ${a.strengths.length ? '' : '<p class="muted">Nothing clears the bar for a strength yet: no theme is at 62% positive or more, and no question reaches 75% agreement.</p>'}
      <div class="strengths">${a.strengths.map((s) => `<div class="st">
        <span class="big">${pct(s.p)}</span>
        <h3>${s.kind === 'item' ? `agree “${esc(s.short)}”` : esc(fixCase(s.title))}</h3>
        <p>${esc(s.scope)} · ${s.n} people</p>
        ${s.po != null ? `<p class="st-cmp"><span><b>${pct(s.po)}</b> everyone else (the other ${((a.overview.find((o) => o.dim.key === s.dim.key) || {}).n || a.responded) - s.n} people)</span><span><b>${pct((a.overview.find((o) => o.dim.key === s.dim.key) || {}).p)}</b> whole organisation, including this group (as in the Explore table)</span></p>` : ''}
        ${s.quotes && s.quotes[0] ? `<p class="quote">“${quoteHTML(s.quotes[0])}”</p>` : ''}
      </div>`).join('')}</div>
    </section>`;
  }

  // How sure we are about a difference, in words rather than statistics.
  function sureText(f) {
    if (f.kind === 'org') return 'across the whole organisation';
    return { clear: 'very unlikely to be chance', likely: 'probably a real difference', possible: 'could be chance' }[f.confidence.key] || f.confidence.label.toLowerCase();
  }

  function secRadar() {
    const a = S.a;
    const row = (f) => `<div class="w-row">
      <div><h3>${esc(fixCase(f.headline))}</h3>
        <p>${f.g.n} people answered · ${esc(sureText(f))}</p>
        ${f.early ? `<p class="early-box">${I.wait}<span>${esc(f.earlyReason)}</span></p>` : ''}</div>
      <div class="num"><span class="num-big">${pct(f.g.p)}</span><small>positive</small><small class="num-cmp">${f.kind === 'org' ? `fewer than half; ${pct(1 - f.g.p)} are not positive` : `${Math.round(-f.diff * 100)} points below everyone else (${pct(f.o.p)})`}</small></div></div>`;
    return `<section class="sec" id="radar">
      <div class="sec-head"><h2>On the radar</h2><p>Real differences that didn’t make the top three, and early signals that need more voices before anyone acts on them. On the right of each row, in red: the share of that group who answered positively, and how far below everyone else it is (for the whole organisation, how far below half).</p></div>
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

  // One theme on a confidential card: what the theme asks about (its own questions), one plain sentence, and three bars to compare.
  function confTheme(s, h) {
    const qs = h.dim.items.slice(0, 2).map((it) => `“${esc(it.text.replace(/ \(reverse-scored\)$/, ''))}”`).join(' and ');
    const bar = (lbl, p, me) => `<div class="cbar ${me ? 'me' : ''}"><span>${lbl}</span><span class="cbar-t"><i style="width:${(p || 0) * 100}%"></i></span><b>${pct(p)}</b></div>`;
    return `<div class="conf-theme">
      <p class="ct-name"><b>${esc(h.dim.label)}</b> <span class="faint">questions such as ${qs}</span></p>
      <p>${h.s.p === 0 ? '<b>None</b> (0%)' : `Only <b>${pct(h.s.p)}</b>`} of this small group answered these questions positively, against <b>${pct(h.o.p)}</b> of their teammates and <b>${pct(h.e.p)}</b> of ${esc(s.groupNoun)} in other teams.</p>
      <div class="cbars">${bar('This small group', h.s.p, true)}${bar(`Others in ${esc(s.team)}`, h.o.p)}${bar(`${esc(cap(s.groupNoun))} in other teams`, h.e.p)}</div>
    </div>`;
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
        ${s.hits.map((h) => confTheme(s, h)).join('')}
      </div>
      <p class="muted" style="font-size:14px">What this means: inside one team, this group is having a much worse experience than their own teammates <i>and</i> than people like them elsewhere in the organisation. That points to something about this team, not the organisation as a whole. The group is too small to report, so it stays confidential.</p>
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
    // Gender by place: both division and department when the survey has both (stress test, log row 8: Gender × Department was missing).
    if (ds.sem.gender && ds.sem.division) opts.push({ key: 'gxp', label: `${ds.sem.gender} × ${ds.sem.division}`, cols: [ds.sem.gender, ds.sem.division] });
    if (ds.sem.gender && ds.sem.department && ds.sem.department !== ds.sem.division) opts.push({ key: 'gxd', label: `${ds.sem.gender} × ${ds.sem.department}`, cols: [ds.sem.gender, ds.sem.department] });
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
    // No grouping columns (no department, gender, level...): nothing to break down, and the page used to crash here.
    // The organisation-wide drill-down from the summary still works.
    if (!opts.length) {
      return `<section class="sec" id="explore">
      <div class="sec-head"><h2>Explore every group</h2><p>This file has no columns to group people by, such as department, gender or occupational level, so results can only be shown for the organisation as a whole. Select a theme in the summary to see the questions behind it.</p></div>
      ${S.drill ? drillPanel() : ''}
    </section>`;
    }
    if (!S.lens || !opts.find((o) => o.key === S.lens)) S.lens = (opts.find((o) => o.key === (ds.sem.department || '')) || opts[0]).key;
    const lens = opts.find((o) => o.key === S.lens);
    const cols = lensColumns(lens);
    // Explore column headers: a disability column's "Yes"/"No" is shown as "With disability"/"Without disability".
    const shortLabel = (c) => Object.entries(c.filter).map(([h, v]) => (h === ds.sem.disability && /^(yes|y|true|1)$/i.test(v) ? 'With disability' : h === ds.sem.disability && /^(no|n|false|0)$/i.test(v) ? 'Without disability' : v)).join(' · ');
    return `<section class="sec" id="explore">
      <div class="sec-head"><h2>Explore every group</h2><p>Share positive on each theme, coloured by how far it sits from the organisation as a whole. Select a cell to see the questions behind it.</p></div>
      <div class="lens-tabs" role="group" aria-label="Group by">${opts.map((o) => `<button data-act="lens" data-key="${esc(o.key)}" aria-pressed="${o.key === S.lens}">${esc(o.label)}</button>`).join('')}</div>
      <div class="heat-wrap"><table class="heat">
        <thead><tr><th>Theme</th><th>Whole organisation<small>${a.responded}</small></th>${cols.map((c) => { const hc = a.headcount(c.filter); const rr = hc ? c.n / hc : null; return `<th>${esc(shortLabel(c))}<small>${c.hidden ? (c.secondary ? 'hidden' : `under ${a.settings.minGroup}`) : c.n + (rr != null && rr < 0.5 ? ` · <span class="low-rr" title="Fewer than half responded">${pct(rr)} responded</span>` : '')}</small></th>`; }).join('')}</tr></thead>
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
        <table class="items-tbl"><thead><tr><th>Question</th><th>${isOrg ? 'Agree' : esc(label)}</th>${isOrg ? '' : '<th>Whole organisation</th>'}</tr></thead><tbody>
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
      <div class="privacy-log">${log.name ? `<span class="chip">${I.eyeoff} ${log.name} name${log.name > 1 ? 's' : ''} removed</span>` : ''}${log.phone ? `<span class="chip">${I.eyeoff} ${log.phone} phone number${log.phone > 1 ? 's' : ''} removed</span>` : ''}${log.email ? `<span class="chip">${I.eyeoff} ${log.email} email address${log.email > 1 ? 'es' : ''} removed</span>` : ''}${log.id ? `<span class="chip">${I.eyeoff} ${log.id} ID or account number${log.id > 1 ? 's' : ''} removed</span>` : ''}</div>
      ${aiBar}${S.aiError ? `<p class="err">${esc(S.aiError)}</p>` : ''}
      <div class="themes">${themes.map((t) => {
        const open = S.themeOpen === t.key;
        const uniq = E.similarGroups(t.items);
        return `<button class="th-row" data-act="theme" data-key="${esc(t.key)}" aria-expanded="${open}"><span class="nm">${esc(t.label)}</span><span class="th-bar" style="width:${(t.count / max) * 100}%"><i class="neg" style="width:${((t.count - t.positive) / t.count) * 100}%"></i><i class="pos" style="width:${(t.positive / t.count) * 100}%"></i></span><span class="c">${t.count}</span></button>
          ${open ? `<div class="th-quotes">${t.summary ? `<p class="muted">${esc(t.summary)}</p>` : ''}${uniq.slice(0, S.themeAll === t.key ? uniq.length : 8).map((g) => quoteGroup(g, 't:' + t.key)).join('')}
            ${uniq.length > 8 ? `<button class="btn btn-ghost btn-sm see-all" data-act="theme-all" data-key="${esc(t.key)}">${S.themeAll === t.key ? 'Show fewer' : `See all ${t.count} comments`}</button>` : ''}</div>` : ''}`;
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
      ${a.rates ? `<div class="heat-wrap" style="padding:8px 8px 0"><table class="rr-tbl"><thead><tr><th>${esc(a.rates.col)}</th><th>Responded</th><th></th><th style="text-align:right">Response rate</th><th style="text-align:right">Accuracy</th></tr></thead><tbody>
        ${a.rates.map((r) => `<tr><td>${esc(r.v)}</td><td>${r.resp}${r.hc ? ` of ${r.hc}` : ''}</td><td>${r.rr != null ? `<span class="rr-mini"><i style="width:${r.rr * 100}%"></i></span>` : ''}</td><td class="r" ${r.rr != null && r.rr < 0.5 ? 'style="color:var(--concern)"' : ''}>${pct(r.rr)}</td><td class="r ${r.moe > 0.1 ? '' : 'faint'}" ${r.moe > 0.1 ? 'style="color:var(--concern)"' : ''}>± ${Math.round(r.moe * 100)} points</td></tr>`).join('')}
      </tbody></table>
      <p class="faint table-key"><b>Response rate:</b> the share of people in that group who answered. <b>Accuracy:</b> because not everyone answered, that group’s results could be this many percentage points higher or lower than if everyone had. Smaller is better; anything over ± 10 points (in red) should be read with care.</p></div>` : ''}
      <div class="method">
        <div><b>Positive</b><span>A person counts as positive on a theme when their average across its questions is 3.5 or higher on the 5-point scale (mostly Agree or Strongly agree).</span></div>
        <div><b>Differences</b><span>Each group is compared with everyone else. “Clear difference” means it is very unlikely to be chance; “likely” means it is probably real; “possible” means it could be chance. (For the technically minded: a two-proportion test, z ≥ 3 and z ≥ 2.)</span></div>
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
        ${!composing && st !== 'done' ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${idx < 1 ? `<button class="btn btn-ghost btn-sm" data-act="ack" data-id="${f.id}">Acknowledge</button>` : ''}${idx < 2 ? `<button class="btn btn-primary btn-sm" data-act="compose" data-id="${f.id}">Write response</button>` : `<button class="btn btn-ghost btn-sm" data-act="compose" data-id="${f.id}">Edit response</button><button class="btn btn-ghost btn-sm" data-act="done" data-id="${f.id}">Mark done</button>`}</div>`
          : !composing ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-act="compose" data-id="${f.id}">Edit response</button><button class="btn btn-ghost btn-sm" data-act="reopen" data-id="${f.id}">Reopen</button></div>` : ''}
      </div>
      <div class="ladder" aria-label="Status">${LADDER.map(([k, l], i) => `<div class="${i < idx ? 'on' : i === idx ? 'on now' : ''}"><i></i>${l}</div>`).join('')}</div>
      ${composing ? composeForm(f, owner, r) : r && r.heard ? responseView(r, owner) : ''}
    </article>`;
  }

  function responseView(r, owner) {
    // An edited response says so, with the date, so employees can see it changed after it was first published.
    return `<div class="response"><span class="who">${esc(owner)} · ${fmtDate(r.firstAt || r.at)}${r.editedAt ? ` · edited ${fmtDate(r.editedAt)}` : ''}</span><dl>
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
      ${S.composeError ? `<p class="err" role="alert">${esc(S.composeError)}</p>` : ''}
      <label for="r-heard">What did you hear? <small>In your own words, without softening it.</small><textarea id="r-heard" required placeholder="${esc(sug.heard)}">${esc(v.heard || '')}</textarea></label>
      <label for="r-first">What will you do first, and by when? <small>One concrete step is better than five vague ones.</small><textarea id="r-first" required placeholder="${esc(sug.first)}">${esc(v.first || '')}</textarea></label>
      <label for="r-wont">What won’t you do, and why? <small>Optional. Saying no honestly builds more trust than silence.</small><textarea id="r-wont" placeholder="${esc(sug.wont)}">${esc(v.wont || '')}</textarea></label>
      <label for="r-when">When will you report back?<input id="r-when" type="date" value="${v.when || new Date(Date.now() + 75 * 86400000).toISOString().slice(0, 10)}"></label>
      <div class="row"><button type="button" class="btn-quiet" data-act="fill-example" data-id="${f.id}">Fill with an example</button><span style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn btn-ghost" data-act="compose-clear">Clear form</button><button type="button" class="btn btn-ghost" data-act="compose-cancel">${v.heard ? 'Back, keep what was published' : 'Back'}</button><button type="submit" class="btn btn-primary">${v.heard ? 'Save changes' : 'Publish response'}</button></span></div>
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
          ${r && r.heard ? `<span class="resp-txt"><b>First step:</b> ${esc(r.first)}${r.editedAt ? ` <small class="faint">(edited ${fmtShort(r.editedAt)})</small>` : ''}</span>` : rel && !late ? `<span class="faint" style="font-size:13px">Response due ${fmtShort(rel.due)}</span>` : ''}
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
      }).join('')}<p class="faint" style="font-size:12.5px;margin-top:6px">Bar: this department. Black line: the whole organisation. Green: 10 or more points above the organisation. Red: 10 or more points below. Grey: within 10 points.</p></div>`}
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
      if (v >= S.clean.rows.length) S.settings.invited = v;
    }
    S.a = E.analyze(S.ds, { minGroup: S.settings.minGroup, invited: S.settings.invited });
    S.open = null; S.drill = null; S.themeOpen = null; S.lens = null; S.aiThemes = null; S.aiError = null; S.themeAll = null; S.quotesAll = {}; S.simOpen = {};
    load();
  }

  function loadSample() {
    const { rows, headcount } = D.generate();
    const r = E.parseCSV(D.toCSV(rows)), h = E.parseCSV(D.toCSV(headcount));
    S.files.responses = { name: D.files.responses, ...r };
    S.files.headcount = { name: D.files.headcount, ...h };
    S.sample = true; S.error = null; S.a = null; S.themeOverrides = {};
    S.meta = { org: D.org, survey: D.survey, period: D.period };
    prepare();
    go('check');
  }

  // ------------------------------------------------------------ Events
  const actions = {
    home: () => { closeSheet(); go('start'); },
    // Take a dropped file off the start screen. Anything worked out from it is cleared too, so a new file starts fresh.
    'remove-file': (el) => {
      S.files[el.dataset.k] = null;
      S.cols = null; S.ds = null; S.a = null; S.error = null; S.settings.invited = null;
      S.store = { release: null, responses: {}, conf: {} };
      if (el.dataset.k === 'responses') { S.sample = false; S.meta = { org: 'Your organisation', survey: 'Employee survey', period: '' }; }
      ['f-resp', 'f-hc'].forEach((id) => { const i = document.getElementById(id); if (i) i.value = ''; });
      render(); toast(el.dataset.k === 'responses' ? 'Survey file removed' : 'Headcount file removed');
    },
    sample: loadSample,
    template: (el) => downloadTemplate(el.dataset.k),
    'template-xlsx': () => downloadExcelTemplate(),
    'to-check': () => { prepare(); go('check'); },
    retry: () => render(),
    unrelease: () => { S.confirmUnrelease = true; render(); },
    'unrelease-no': () => { S.confirmUnrelease = false; render(); },
    'unrelease-yes': () => { S.store = { release: null, responses: {}, conf: {} }; S.confirmUnrelease = false; save(); prepare(); render(); toast('The release was removed. You can change the settings and release again.'); },
    'k-': () => { if (S.store.release) return; S.settings.minGroup = Math.max(3, S.settings.minGroup - 1); $('#k-out').textContent = S.settings.minGroup; },
    'k+': () => { if (S.store.release) return; S.settings.minGroup = Math.min(20, S.settings.minGroup + 1); $('#k-out').textContent = S.settings.minGroup; },
    analyse: () => { if (E.blockers(S.ds).length) return render(); analyse(); go('reading'); },
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
    'see-similar': (el) => {
      S.simOpen[el.dataset.key] = !S.simOpen[el.dataset.key];
      if (el.closest('.sheet')) { refreshSheet(); return; }
      if (el.dataset.key.startsWith('t:')) { rerenderSection('comments'); return; }
      const id = el.dataset.key.slice(2).split('|')[0]; const art = document.getElementById(id); const f = S.a.focus.find((x) => x.id === id);
      if (art && f) art.outerHTML = focusCard(f);
    },
    'theme-all': (el) => { S.themeAll = S.themeAll === el.dataset.key ? null : el.dataset.key; if (el.closest('.sheet')) refreshSheet(); else rerenderSection('comments'); },
    'quotes-all': (el) => {
      const id = el.dataset.id; S.quotesAll[id] = !S.quotesAll[id];
      const art = document.getElementById(id); const f = S.a.focus.find((x) => x.id === id);
      if (el.closest('.sheet')) refreshSheet(); else if (art && f) art.outerHTML = focusCard(f);
    },
    theme: (el) => { S.themeOpen = S.themeOpen === el.dataset.key ? null : el.dataset.key; if (el.closest('.sheet')) refreshSheet(); else rerenderSection('comments'); },
    release: () => { S.pendingWindow = Number($('#win').value); S.confirming = true; render(); $('.confirm') && $('.confirm').scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    'release-cancel': () => { S.confirming = false; render(); },
    'release-now': () => {
      const at = Date.now();
      const win = S.pendingWindow || 30;
      const payload = JSON.stringify(S.a.focus.map((f) => [f.headline, f.g.fav, f.g.n]));
      S.store.release = { at, window: win, due: at + win * 86400000, fp: fingerprint(payload + at), settings: { minGroup: S.settings.minGroup, themes: { ...(S.themeOverrides || {}) }, invited: S.settings.invited } };
      S.confirming = false; save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); toast('Released to everyone');
    },
    preview: (el) => preview(el.dataset.k),
    'close-sheet': closeSheet,
    'emp-day': (el) => { S.empDay = Number(el.dataset.d); refreshSheet(); },
    dept: (el) => { S.deptPick = el.dataset.v; refreshSheet(); },
    ack: (el) => { S.store.responses[el.dataset.id] = { ...(S.store.responses[el.dataset.id] || {}), status: 'ack', ackAt: Date.now() }; save(); render(); toast('Acknowledged. Employees can see it.'); },
    compose: (el) => { S.composing = el.dataset.id; render(); const f = $('#r-heard'); f && f.focus({ preventScroll: true }); document.getElementById('ft-' + el.dataset.id).scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'compose-cancel': () => { S.composing = null; S.composeError = null; render(); },
    'compose-clear': () => { ['#r-heard', '#r-first', '#r-wont'].forEach((q) => { const x = $(q); if (x) x.value = ''; }); const h = $('#r-heard'); h && h.focus(); },
    reopen: (el) => { S.store.responses[el.dataset.id].status = 'plan'; save(); render(); toast('Reopened. It shows as “Plan shared” again.'); },
    'fill-example': (el) => { const f = S.a.focus.find((x) => x.id === el.dataset.id); const s = suggestions(f); $('#r-heard').value = s.heard; $('#r-first').value = s.first; $('#r-wont').value = s.wont; },
    done: (el) => { S.store.responses[el.dataset.id].status = 'done'; save(); render(); toast('Marked done'); },
    'log-conf': (el) => logConf(el.dataset.id),
    'reset-demo': () => { S.store = { release: null, responses: {}, conf: {} }; S.empDay = 0; save(); prepare(); analyse(); render(); toast('Demo reset. Nothing has been released.'); },
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
    if (a && actions[a.dataset.act]) { e.preventDefault(); try { actions[a.dataset.act](a); } catch (err) { showProblem(err); } }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'f-resp' && e.target.files[0]) { readFiles([...e.target.files], e.target.files.length > 1 ? 'auto' : 'responses'); try { e.target.value = ''; } catch (x) { /* read-only in tests */ } }
    if ((e.target.id === 'f-hc' || e.target.id === 'f-hc2') && e.target.files[0]) { readFiles([e.target.files[0]], 'headcount'); try { e.target.value = ''; } catch (x) { /* read-only in tests */ } }
    // Theme chosen for a question on the Check screen: re-read the file with that choice.
    if (e.target.dataset && e.target.dataset.themeFor && !S.store.release) {
      S.themeOverrides = { ...(S.themeOverrides || {}), [e.target.dataset.themeFor]: e.target.value };
      S.themeEditOpen = true; prepare(); render();
    }
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
      // A response made only of spaces would show employees "Plan shared" with nothing in it.
      if (!$('#r-heard').value.trim() || !$('#r-first').value.trim()) {
        S.composeError = 'Write what you heard and what you’ll do first before publishing. Employees will read exactly what you write.';
        render(); const box = $('#r-heard'); box && box.focus && box.focus(); return;
      }
      S.composeError = null;
      const prev = S.store.responses[id] || {};
      const editing = !!prev.heard;
      S.store.responses[id] = { ...prev, status: prev.status === 'done' ? 'done' : 'plan', heard: $('#r-heard').value.trim(), first: $('#r-first').value.trim(), wont: $('#r-wont').value.trim(), when: $('#r-when').value, at: Date.now(), firstAt: prev.firstAt || prev.at || Date.now(), editedAt: editing ? Date.now() : null };
      S.composing = null; save(); render(); const card = document.getElementById('ft-' + id); card && card.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast(editing ? 'Changes saved. Employees see the new version, marked as edited.' : 'Published. Employees can read it now.');
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
    const files = [...e.dataTransfer.files];
    if (!files.length) return;
    // Every file is checked by its content, not its name. With two files, the one with rating answers is the survey.
    readFiles(files, files.length === 1 ? 'responses' : 'auto');
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
