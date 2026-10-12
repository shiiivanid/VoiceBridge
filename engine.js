/* VoiceBridge analysis engine.
 *
 * Pure functions, no DOM. Every number in the report is computed here.
 * Language (headlines, phrasing) is assembled from the numbers; nothing is
 * invented. In the full build an LLM may reword text, but never change a number.
 */
(function (root) {
  // ---------------------------------------------------------------- CSV
  // Excel on a South African or European locale saves CSVs with semicolons; some tools use tabs.
  function sniffDelimiter(text) {
    const counts = { ',': 0, ';': 0, '\t': 0 };
    let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') q = !q;
      else if (!q && (c === '\n' || c === '\r')) break;
      else if (!q && c in counts) counts[c]++;
    }
    return Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a), ',');
  }

  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const delim = sniffDelimiter(text);
    const out = []; let row = []; let cell = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.length > 1 || row[0] !== '') out.push(row);
        row = [];
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); out.push(row); }
    if (!out.length) return { headers: [], rows: [] };
    const headers = out[0].map((h) => h.trim());
    const rows = out.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
    return { headers, rows };
  }

  // ---------------------------------------------------------------- Detection
  const LIKERT_TEXT = [
    [/^strongly disagree$/i, 1], [/^disagree$/i, 2], [/^(neither agree nor disagree|neutral|neither|unsure)$/i, 3],
    [/^agree$/i, 4], [/^strongly agree$/i, 5],
    [/^(very dissatisfied)$/i, 1], [/^(dissatisfied)$/i, 2], [/^(satisfied)$/i, 4], [/^(very satisfied)$/i, 5],
  ];
  const NA = /^(n\/?a|not applicable|don'?t know|prefer not to answer)$/i;

  function likert(v) {
    if (v === '' || v == null) return null;
    if (NA.test(v)) return null;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 1 && n <= 5 && Math.round(n) === n) return n;
    for (const [re, s] of LIKERT_TEXT) if (re.test(v.trim())) return s;
    return undefined; // not a likert value
  }

  // Age before level: "Age_Band" is an age, not a job band.
  const SEMANTICS = [
    ['gender', /\b(gender|sex)\b/i], ['race', /\b(race|ethnic|population group)\b/i], ['age', /\bage\b/i],
    ['level', /\b(level|grade|band|occupational|seniority|job family)\b/i], ['tenure', /\b(tenure|service|years at|time at|how long)\b/i],
    ['team', /\b(team|unit|squad|shift|manager)\b/i], ['division', /\b(division|business area|cluster|region)\b/i],
    ['department', /\b(department|dept|function|site|branch|business unit)\b/i], ['disability', /\bdisab/i],
  ];
  const PREFER_NOT = /prefer not|rather not|not to say|decline/i;

  const DIM_KEYS = [
    ['fair', /fair|advance|promot|equit/i], ['belong', /belong|respect|inclusi/i], ['voice', /voice|safe|speak/i],
    ['mgr', /manager|leader|supervis/i], ['growth', /growth|develop|career|learn/i], ['trust', /follow|survey|action/i],
    ['wellbeing', /well-?being|stress|workload|balance/i], ['engagement', /engage|proud|recommend|motivat/i],
  ];

  // "Job_Level" and "JobLevel" read as "Job Level", so word-boundary rules still match.
  function words(h) { return String(h).replace(/_+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim(); }
  function sentence(s) { return s.replace(/\b([A-Z])([a-z]+)\b/g, (m, a, b, i) => (i ? a.toLowerCase() + b : m)); }

  const COMMENT_HEADER = /\b(comments?|feedback|suggestions?|anything else|remarks|open text|explain|describe|why)\b/i;
  // Items worded so that agreeing is bad. Only flipped when the answers also run against the rest of the survey.
  const NEGATIVE_WORDING = /\b(concerns?|burn ?out|burnt out|burned out|stress(ed|ful)?|exhaust\w*|discriminat\w*|harass\w*|bull(y|ied|ying)|intend to leave|intention to leave|turnover|overwhelm\w*|anxi\w*|excluded)\b/i;

  // Numeric tenure and age become bands so they can be compared like any other group.
  const BANDS = {
    tenure: [[1, 'Under 1 year'], [3, '1–2 years'], [6, '3–5 years'], [11, '6–10 years'], [Infinity, 'More than 10 years']],
    age: [[25, 'Under 25'], [35, '25–34'], [45, '35–44'], [55, '45–54'], [Infinity, '55 and over']],
  };
  function toNumber(v) { const n = Number(String(v).trim().replace(',', '.')); return v === '' || v == null || !Number.isFinite(n) ? null : n; }
  function band(kind, v) { const n = toNumber(v); return n == null ? '' : BANDS[kind].find(([max]) => n < max)[1]; }

  function correlation(rows, a, b) {
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    rows.forEach((r) => {
      const x = likert(r[a]), y = likert(r[b]);
      if (x == null || y == null) return;
      n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
    });
    const d = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
    return n > 2 && d ? (n * sxy - sx * sy) / d : 0;
  }

  function detect(headers, rows) {
    const cols = headers.map((h) => {
      const w = words(h);
      const vals = rows.map((r) => r[h]).filter((v) => v !== '' && v != null);
      const distinct = new Set(vals);
      const avgLen = vals.reduce((s, v) => s + v.length, 0) / Math.max(1, vals.length);
      const semantic = (SEMANTICS.find(([, re]) => re.test(w)) || ['other'])[0];
      const col = { header: h, role: 'ignore', filled: vals.length };
      if (/e-?mail/i.test(w) || vals.some((v) => /@[\w-]+\./.test(v) && v.length < 80 && !/\s/.test(v))) {
        col.role = 'pii'; col.why = 'Email addresses';
      } else if (/\b(name|surname|employee (no|number|id)|staff (no|number|id)|id number|phone|cell)\b/i.test(w)) {
        col.role = 'pii'; col.why = 'Personal identifier';
      } else if (/\b(response|respondent|record)\s*(id|no|number)?\b|^id$/i.test(w)) {
        col.role = 'ignore'; col.why = 'Response ID';
      } else if (/\b(date|time|submitted|timestamp|started|completed)\b/i.test(w)) {
        col.role = 'ignore'; col.why = 'Date or time';
      } else if (vals.length && vals.filter((v) => likert(v) !== undefined).length / vals.length > 0.9) {
        col.role = 'rating';
        const m = h.match(/^\s*([A-Z]{1,3}\d{1,3})?[\s.:)-]*(?:\[([^\]]+)\])?\s*(.*)$/);
        col.code = (m && m[1]) || null;
        col.theme = (m && m[2]) || null;
        col.text = words(((m && m[3]) || h).trim() || h);
      } else if ((avgLen > 18 && distinct.size > Math.min(12, vals.length * 0.3)) || (COMMENT_HEADER.test(w) && avgLen > 12)) {
        col.role = 'comment';
      } else if ((semantic === 'tenure' || semantic === 'age') && distinct.size > 12 && vals.filter((v) => toNumber(v) != null).length / vals.length > 0.9) {
        col.role = 'group'; col.semantic = semantic; col.band = semantic;
        const present = new Set(vals.map((v) => band(semantic, v)));
        col.values = BANDS[semantic].map(([, label]) => label).filter((label) => present.has(label));
      } else if (distinct.size >= 2 && distinct.size <= 30 && avgLen < 45) {
        col.role = 'group';
        col.semantic = semantic;
        col.values = [...distinct].sort();
      } else {
        col.why = distinct.size < 2 ? 'Same value in every row' : 'Not recognised';
      }
      return col;
    });

    const ratings = cols.filter((c) => c.role === 'rating');
    // Reverse-scored items: negatively worded, and answered opposite to the other questions.
    ratings.forEach((c) => {
      if (!NEGATIVE_WORDING.test(c.text) || ratings.length < 3) return;
      const others = ratings.filter((o) => o !== c);
      const r = others.reduce((s, o) => s + correlation(rows, c.header, o.header), 0) / others.length;
      if (r < -0.1) { c.reverse = true; c.text += ' (reverse-scored)'; }
    });

    // Themes from the survey's own prefixes ("DEI_Belonging", "Culture_Trust"), when most questions have one.
    const untagged = ratings.filter((c) => !c.theme);
    const prefixOf = (c) => { const m = String(c.header).match(/^([A-Za-z][A-Za-z&]+)[_:|]+(.+)$/); return m && m[1].length > 1 ? m : null; };
    const counts = {};
    untagged.forEach((c) => { const m = prefixOf(c); if (m) counts[m[1]] = (counts[m[1]] || 0) + 1; });
    const shared = Object.keys(counts).filter((p) => counts[p] >= 2);
    const covered = untagged.filter((c) => { const m = prefixOf(c); return m && shared.includes(m[1]); }).length;
    if (shared.length >= 2 && covered >= untagged.length * 0.8) {
      untagged.forEach((c) => {
        const m = prefixOf(c);
        if (!m || !shared.includes(m[1])) return;
        c.theme = /^[A-Z]{2,}$/.test(m[1]) ? m[1] : sentence(words(m[1]));
        c.text = sentence(words(m[2])) + (c.reverse ? ' (reverse-scored)' : '');
      });
    }
    // Anything still without a theme is grouped by keyword, or as "General".
    cols.filter((c) => c.role === 'rating' && !c.theme).forEach((c) => {
      const k = DIM_KEYS.find(([, re]) => re.test(c.text));
      c.theme = k ? { fair: 'Fairness & advancement', belong: 'Belonging & respect', voice: 'Voice & safety', mgr: 'My manager', growth: 'Growth', trust: 'Trust in follow-through', wellbeing: 'Wellbeing', engagement: 'Engagement' }[k[0]] : 'General';
    });
    return cols;
  }

  // ---------------------------------------------------------------- Dataset
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

  function buildDataset(cols, rows, headcountRows) {
    const ratingCols = cols.filter((c) => c.role === 'rating');
    const groupCols = cols.filter((c) => c.role === 'group');
    const commentCols = cols.filter((c) => c.role === 'comment');

    const dims = [];
    ratingCols.forEach((c, i) => {
      let d = dims.find((x) => x.label === c.theme);
      if (!d) {
        const k = DIM_KEYS.find(([, re]) => re.test(c.theme));
        d = { key: k ? k[0] : slug(c.theme), label: c.theme, items: [] };
        if (dims.some((x) => x.key === d.key)) d.key = slug(c.theme);
        dims.push(d);
      }
      d.items.push({ id: c.code || 'Q' + (i + 1), header: c.header, text: c.text, reverse: !!c.reverse });
    });

    const groupValue = (g, v) => (g.band ? band(g.band, v) : v || '');
    const respondents = rows.map((r, i) => {
      const groups = {};
      groupCols.forEach((g) => { groups[g.header] = groupValue(g, r[g.header]); });
      const ratings = {};
      dims.forEach((d) => d.items.forEach((it) => {
        const v = likert(r[it.header]);
        ratings[it.id] = v == null ? null : it.reverse ? 6 - v : v;
      }));
      const scores = {};
      dims.forEach((d) => {
        const vs = d.items.map((it) => ratings[it.id]).filter((v) => v != null);
        scores[d.key] = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
      });
      const comments = commentCols.map((c) => ({ q: c.header, raw: r[c.header] || '' })).filter((c) => c.raw.length > 1);
      return { i, groups, ratings, scores, comments };
    });

    let population = null;
    if (headcountRows && headcountRows.length) {
      const hcHeaders = Object.keys(headcountRows[0]);
      const map = {};
      groupCols.forEach((g) => {
        const h = hcHeaders.find((x) => x.toLowerCase() === g.header.toLowerCase())
          || hcHeaders.find((x) => (SEMANTICS.find(([s, re]) => s === g.semantic && re.test(x))));
        if (h) map[g.header] = h;
      });
      population = headcountRows.map((p) => {
        const groups = {};
        Object.entries(map).forEach(([g, h]) => { groups[g] = groupValue(groupCols.find((c) => c.header === g), p[h]); });
        return { groups };
      });
      population.mapped = Object.keys(map);
    }

    const bySem = (s) => groupCols.find((g) => g.semantic === s);
    return {
      dims, respondents, population, groupCols, commentCols,
      sem: {
        gender: bySem('gender')?.header, race: bySem('race')?.header, level: bySem('level')?.header,
        tenure: bySem('tenure')?.header, team: bySem('team')?.header, department: bySem('department')?.header,
        division: bySem('division')?.header, age: bySem('age')?.header,
      },
    };
  }

  // ---------------------------------------------------------------- Stats
  const FAV = 3.5, UNF = 2.5;
  function wilson(x, n, z = 1.96) {
    if (!n) return [0, 1];
    const p = x / n, d = 1 + (z * z) / n;
    const c = (p + (z * z) / (2 * n)) / d;
    const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
    return [Math.max(0, c - h), Math.min(1, c + h)];
  }
  function ztest(x1, n1, x2, n2) {
    if (!n1 || !n2) return 0;
    const p = (x1 + x2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
    return se ? (x1 / n1 - x2 / n2) / se : 0;
  }
  function moe(n, N) {
    if (!n) return 1;
    const fpc = N && N > n ? Math.sqrt((N - n) / (N - 1)) : 1;
    return 1.96 * Math.sqrt(0.25 / n) * fpc;
  }
  function tally(list, key) {
    let n = 0, fav = 0, unf = 0;
    for (const r of list) {
      const s = r.scores[key];
      if (s == null) continue;
      n++; if (s >= FAV) fav++; if (s <= UNF) unf++;
    }
    return { n, fav, unf, p: n ? fav / n : null, pu: n ? unf / n : null };
  }
  function confidence(z) {
    const a = Math.abs(z);
    if (a >= 3) return { key: 'clear', label: 'Clear difference' };
    if (a >= 2) return { key: 'likely', label: 'Likely difference' };
    return { key: 'possible', label: 'Possible difference' };
  }

  // ---------------------------------------------------------------- Language
  const PLURAL = { woman: 'women', man: 'men', female: 'women', male: 'men', 'non-binary': 'non-binary people' };
  function groupLabel(ds, filter, opts = {}) {
    const parts = Object.entries(filter);
    const get = (s) => parts.find(([h]) => ds.sem[s] === h);
    const g = get('gender'), r = get('race'), l = get('level'), t = get('tenure');
    const places = parts.filter(([h]) => [ds.sem.department, ds.sem.division, ds.sem.team].includes(h));
    const others = parts.filter(([h]) => ![ds.sem.gender, ds.sem.race, ds.sem.level, ds.sem.tenure, ds.sem.department, ds.sem.division, ds.sem.team, ds.sem.age].includes(h));
    const age = get('age');
    let noun;
    if (g && r) noun = `${r[1]} ${PLURAL[g[1].toLowerCase()] || g[1]}`;
    else if (g) noun = cap(PLURAL[g[1].toLowerCase()] || g[1] + ' respondents');
    else if (r) noun = `${r[1]} employees`;
    else if (l && !places.length && !t) noun = `People in ${l[1].toLowerCase()} roles`;
    else if (t && !places.length) noun = t[1] === 'Under 1 year' ? 'People in their first year' : `People with ${t[1].toLowerCase()} of service`;
    else if (places.length) noun = `People in ${places[0][1]}`;
    else noun = 'People';
    let tail = '';
    if ((g || r) && l) tail += ` in ${l[1].toLowerCase()} roles`;
    if ((g || r || l || t) && places.length) tail += ` in ${places[0][1]}`;
    if ((g || r) && t) tail += t[1] === 'Under 1 year' ? ' in their first year' : ` with ${t[1].toLowerCase()} of service`;
    if (age) tail += ` aged ${age[1].toLowerCase()}`;
    others.forEach(([h, v]) => { tail += ` (${sentence(words(h))}: ${v})`; });
    let s = noun + tail;
    if (opts.lower) s = s.charAt(0).toLowerCase() + s.slice(1);
    // Keep proper nouns capitalised.
    s = s.replace(/\b(black|african|coloured|indian|asian|white)\b/gi, (m) => cap(m.toLowerCase()));
    return s;
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  const CONCERN = {
    fair: { plural: 'don’t see a fair path to promotion', short: 'a fair path to promotion', topic: 'fairness and advancement' },
    belong: { plural: 'don’t feel respected or able to be themselves', short: 'belonging and respect', topic: 'belonging and respect' },
    voice: { plural: 'don’t feel safe speaking up', short: 'speaking up safely', topic: 'speaking up' },
    mgr: { plural: 'don’t feel their manager treats them fairly', short: 'fair treatment by their manager', topic: 'how their manager treats them' },
    growth: { plural: 'aren’t being developed', short: 'development', topic: 'development and growth' },
    trust: { plural: 'don’t believe this survey will change anything', short: 'follow-through on surveys', topic: 'whether anything will change' },
  };
  const STRENGTH = {
    fair: 'feel they are treated fairly', belong: 'feel respected and able to be themselves', voice: 'feel safe to speak up',
    mgr: 'rate their manager highly', growth: 'see a future here', trust: 'trust that the survey will lead to action',
  };
  // Themes VoiceBridge has no wording for keep the survey's own label (acronyms like DEI stay capitalised).
  function topicOf(dim) { return dim.label.split(' ').map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(' '); }
  function concernText(dim) { return CONCERN[dim.key] || { plural: `aren’t positive about ${topicOf(dim)}`, short: topicOf(dim), topic: topicOf(dim) }; }
  function strengthText(dim) { return STRENGTH[dim.key] || `are positive about ${topicOf(dim)}`; }

  // ---------------------------------------------------------------- Comments
  const NAMES = /\b(Thandi|Sipho|Lerato|Pieter|Ayesha|Kagiso|Nomvula|Ravi|Johan|Zanele|Bongani|Priya|Megan|Tshepo|Fatima|Lwazi|Themba|Mandla|Naledi|Andile|Hendrik|Sarah|John|David|Michael|Thabo|Palesa|Riaan|Charl|Kobus|Nadia|Ashwin)\b/g;
  function redact(text, log) {
    let t = text;
    t = t.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, () => { log.email++; return '[email removed]'; });
    t = t.replace(/(\+27|\b0)\s?\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g, () => { log.phone++; return '[number removed]'; });
    t = t.replace(/\b(supervisor|manager|boss|team leader|HOD|colleague)\s+([A-Z][a-z]+)\b/g, (m, role) => { log.name++; return `${role} [name]`; });
    t = t.replace(NAMES, () => { log.name++; return '[name]'; });
    return t;
  }
  const THEMES = [
    { key: 'promotion', label: 'Promotion and career paths', re: /promot|team leader post|supervisor post|criteria|career path|acting supervisor|to apply|what ready means|braai|trained three|future team leaders/i, dims: ['fair'] },
    { key: 'shifts', label: 'Shifts, overtime and transport', re: /night shift|transport|overtime|late shifts?|after 10pm/i, dims: ['fair', 'belong'] },
    { key: 'followthrough', label: 'Whether anything will change', re: /survey|nothing changed|never shared|believe it|hear back|box-ticking|the results|same problems/i, dims: ['trust'] },
    { key: 'voice', label: 'Speaking up', re: /keep quiet|raise something|speak up|scared|decisions are made|just told|input is asked|raising concerns/i, dims: ['voice', 'mgr'] },
    { key: 'treatment', label: 'How supervisors treat people', re: /speak to women|shouts?|safe raising problems|labelled as difficult|comments are made|laughs it off|nobody does anything/i, dims: ['mgr', 'voice', 'belong'] },
    { key: 'development', label: 'Development and training', re: /develop|training|study further|learnership|courses|same position/i, dims: ['growth'] },
    { key: 'pay', label: 'Pay and increases', re: /salary|\bpay\b|increase|grades|earn/i, dims: ['fair'] },
    { key: 'workload', label: 'Workload and pressure', re: /peak season|short-staffed|after hours|too many systems|workload/i, dims: [] },
    { key: 'inclusion', label: 'Inclusion, language and culture', re: /afrikaans|left out|two different companies|mould|culture|be myself|heritage/i, dims: ['belong'] },
    { key: 'team', label: 'Team and colleagues', re: /my team|colleagues|family|support each other|makes time|approachable|listens|trusted to/i, dims: ['belong', 'mgr'] },
    { key: 'facilities', label: 'Facilities', re: /canteen|parking/i, dims: [] },
  ];
  const POSITIVE = /has my back|like family|good colleagues|support each other|approachable|listens|trusted|appreciate|best one|improved|can be myself here|makes time|could not ask/i;

  function codeComments(ds) {
    const log = { email: 0, phone: 0, name: 0 };
    const all = [];
    ds.respondents.forEach((r) => {
      r.comments.forEach((c) => {
        const text = redact(c.raw, log);
        const themes = THEMES.filter((t) => t.re.test(c.raw)).map((t) => t.key);
        const item = { r, text, themes: themes.length ? themes : ['other'], positive: POSITIVE.test(c.raw) };
        all.push(item);
      });
    });
    const themes = [...THEMES, { key: 'other', label: 'Other', dims: [] }].map((t) => {
      const items = all.filter((c) => c.themes.includes(t.key));
      return { ...t, count: items.length, positive: items.filter((c) => c.positive).length, items };
    }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
    return { all, themes, log };
  }

  function pickQuotes(comments, members, dimKey, n = 3) {
    const set = new Set(members);
    const themeKeys = THEMES.filter((t) => t.dims.includes(dimKey)).map((t) => t.key);
    const pool = comments.all.filter((c) => set.has(c.r) && !c.positive && c.themes.some((t) => themeKeys.includes(t)));
    const seen = new Set(); const out = [];
    // Prefer one quote per theme, then fill.
    for (const key of themeKeys) {
      const c = pool.find((x) => x.themes.includes(key) && !seen.has(x.text));
      if (c && out.length < n) { out.push(c); seen.add(c.text); }
    }
    for (const c of pool) { if (out.length >= n) break; if (!seen.has(c.text)) { out.push(c); seen.add(c.text); } }
    return out.map((c) => ({ text: c.text, count: pool.filter((x) => x.text === c.text).length }));
  }

  // ---------------------------------------------------------------- Analysis
  function analyze(ds, settings = {}) {
    const k = settings.minGroup || 5;
    const floorBar = settings.floor || 0.2;
    const R = ds.respondents;
    const N = ds.population ? ds.population.length : settings.invited || null;
    const lensCols = ds.groupCols.filter((g) => g.semantic !== 'team' && g.values.length <= 14).map((g) => g.header);
    const isReal = (v) => v && !PREFER_NOT.test(v);

    const match = (rec, filter) => Object.entries(filter).every(([h, v]) => rec.groups[h] === v);
    const members = (filter) => R.filter((r) => match(r, filter));
    const headcount = (filter) => {
      if (!ds.population) return null;
      const keys = Object.keys(filter);
      if (!keys.every((h) => ds.population.mapped.includes(h))) return null;
      return ds.population.filter((p) => match(p, filter)).length;
    };

    // Overview
    const overview = ds.dims.map((d) => {
      const t = tally(R, d.key);
      const items = d.items.map((it) => {
        let n = 0, f = 0;
        R.forEach((r) => { const v = r.ratings[it.id]; if (v != null) { n++; if (v >= 4) f++; } });
        return { ...it, n, p: n ? f / n : null };
      });
      return { dim: d, ...t, ci: wilson(t.fav, t.n), items };
    });

    // Group definitions: singles + pairs with gender/race.
    const groups = [];
    lensCols.forEach((h) => {
      const vals = [...new Set(R.map((r) => r.groups[h]))].filter(isReal);
      vals.forEach((v) => groups.push({ [h]: v }));
    });
    const pairAnchors = [ds.sem.gender, ds.sem.race].filter(Boolean);
    pairAnchors.forEach((a) => {
      lensCols.filter((b) => b !== a && !(a === ds.sem.race && b === ds.sem.gender)).forEach((b) => {
        const av = [...new Set(R.map((r) => r.groups[a]))].filter(isReal);
        const bv = [...new Set(R.map((r) => r.groups[b]))].filter(isReal);
        av.forEach((x) => bv.forEach((y) => groups.push({ [a]: x, [b]: y })));
      });
    });

    const SEVERITY = { fair: 1.2, voice: 1.2, mgr: 1.15, belong: 1.05, growth: 1, trust: 1 };
    const candidates = [];
    const strengthsC = [];
    const suppressed = new Set();

    groups.forEach((filter) => {
      const mem = members(filter);
      const set = new Set(mem);
      const rest = R.filter((r) => !set.has(r));
      ds.dims.forEach((d) => {
        const g = tally(mem, d.key), o = tally(rest, d.key);
        if (g.n < k) { if (g.n > 0) suppressed.add(groupLabel(ds, filter)); return; }
        const diff = g.p - o.p;
        const z = ztest(g.fav, g.n, o.fav, o.n);
        const base = { filter, members: mem, dim: d, g, o, diff, z };
        if (diff <= -0.1 && z <= (g.n < 15 ? -2.2 : -1.6)) {
          const spec = Object.keys(filter).length;
          candidates.push({ ...base, kind: 'group', score: -diff * 100 * Math.min(1, g.n / 40) * (SEVERITY[d.key] || 1) * (spec === 2 ? 1.05 : 1) });
        }
        // Strengths come from places and tenure, not seniority (seniority highs are the perception gap, not a strength).
        const placeOnly = Object.keys(filter).every((h) => [ds.sem.department, ds.sem.division, ds.sem.tenure].includes(h));
        if (placeOnly && diff >= 0.08 && z >= 2 && g.p >= 0.7) strengthsC.push({ ...base, kind: 'group', score: diff * 100 * Math.min(1, g.n / 40) });
      });
    });

    // Org-wide concerns
    overview.forEach((o) => {
      if (o.p != null && o.p < 0.5) {
        candidates.push({ kind: 'org', filter: {}, members: R, dim: o.dim, g: o, o: null, diff: o.p - 0.5, z: -9, score: (0.56 - o.p) * 100 * 1.35 });
      }
    });

    // Rank, dedupe overlapping groups on the same theme.
    candidates.sort((a, b) => b.score - a.score);
    const accepted = [];
    const overlap = (a, b) => {
      if (a.kind === 'org' || b.kind === 'org') return a.kind === b.kind ? 1 : 0;
      const sa = new Set(a.members); let inter = 0;
      b.members.forEach((m) => { if (sa.has(m)) inter++; });
      return inter / Math.min(a.members.length, b.members.length);
    };
    candidates.forEach((c) => {
      const clash = accepted.find((a) => a.dim.key === c.dim.key && overlap(a, c) > 0.45);
      if (clash) return;
      accepted.push(c);
    });

    // Merge: same group across several themes becomes one finding.
    const findingsMap = new Map();
    accepted.forEach((c) => {
      const key = c.kind === 'org' ? 'org:' + c.dim.key : JSON.stringify(Object.entries(c.filter).sort());
      if (!findingsMap.has(key)) findingsMap.set(key, { primary: c, also: [] });
      else findingsMap.get(key).also.push(c);
    });

    // Evidence for each finding.
    const comments = codeComments(ds);
    const findings = [...findingsMap.values()].map(({ primary: c, also }) => {
      const hc = c.kind === 'org' ? N : headcount(c.filter);
      const responded = c.kind === 'org' ? R.length : c.members.length;
      const conf = c.kind === 'org' ? { key: 'clear', label: 'Organisation-wide' } : confidence(c.z);
      let silence = null;
      if (hc) {
        const nonresp = Math.max(0, hc - responded);
        silence = {
          headcount: hc, responded, nonresp, unf: c.g.unf, answered: c.g.n,
          floor: c.g.unf / hc, ceiling: (c.g.unf + nonresp) / hc, rr: responded / hc,
          survives: c.g.unf / hc >= floorBar,
        };
      }
      const label = c.kind === 'org' ? (c.g.pu > 0.5 ? 'Most people' : 'Many people') : groupLabel(ds, c.filter);
      const ct = concernText(c.dim);
      const items = c.dim.items.map((it) => {
        const pg = itemFav(c.members, it.id);
        const po = c.kind === 'org' ? null : itemFav(R.filter((r) => !new Set(c.members).has(r)), it.id);
        return { ...it, pg, po };
      });
      const ownerScope = c.kind === 'org' ? 'org' : (c.filter[ds.sem.department] || c.filter[ds.sem.division] || null);
      return {
        id: (c.kind === 'org' ? 'org-' : 'g-') + c.dim.key + '-' + slug(label),
        kind: c.kind, filter: c.filter, members: c.members, dim: c.dim, also: also.map((a) => ({ dim: a.dim, diff: a.diff, g: a.g, o: a.o })),
        label, headline: `${label} ${ct.plural}.`, ct,
        g: c.g, o: c.o, diff: c.diff, z: c.z, confidence: conf, score: c.score,
        ciG: wilson(c.g.fav, c.g.n), ciO: c.o ? wilson(c.o.fav, c.o.n) : null,
        silence, items, ownerScope,
        quotes: c.members.length >= k ? pickQuotes(comments, c.members, c.dim.key) : [],
        breakdown: breakdown(ds, c, R, k),
      };
    });

    findings.forEach((f) => {
      const passes = f.confidence.key !== 'possible' && (!f.silence || f.silence.survives);
      f.status = passes ? 'focus' : 'drop';
      if (!passes && f.g.n >= 15) {
        if (f.silence && f.silence.rr < 0.5) {
          f.status = 'watch'; f.early = 'response';
          f.earlyReason = `Only ${pct(f.silence.rr)} of this group responded. If the others feel differently, the true share with this concern could be anywhere from ${pct(f.silence.floor)} to ${pct(f.silence.ceiling)}. Hear from more people before acting.`;
        } else if (f.confidence.key === 'possible') {
          f.status = 'watch'; f.early = 'chance';
          f.earlyReason = 'The difference is small enough that it could be chance. Check it again in the next pulse.';
        }
      }
    });
    findings.sort((a, b) => (a.status === b.status ? b.score - a.score : a.status === 'focus' ? -1 : 1));
    const focus = findings.filter((f) => f.status === 'focus').slice(0, 3);
    const watch = findings.filter((f) => f.status === 'focus' && !focus.includes(f)).slice(0, 4);
    const early = findings.filter((f) => f.status === 'watch').sort((a, b) => (a.early === b.early ? b.score - a.score : a.early === 'response' ? -1 : 1)).slice(0, 3);
    focus.forEach((f, i) => { f.rank = i + 1; });

    // Strengths: best org-wide items and themes, plus standout groups.
    const strengths = [];
    const itemsAll = overview.flatMap((o) => o.items.map((it) => ({ ...it, dim: o.dim })));
    // A reverse-scored item can't be quoted as "X% agree", so it is never the headline strength.
    itemsAll.filter((it) => it.p >= 0.75 && !it.reverse).sort((a, b) => b.p - a.p).slice(0, 1).forEach((it) => {
      strengths.push({ kind: 'item', title: `${pct(it.p)} agree: “${it.text}”`, short: it.text, p: it.p, dim: it.dim, n: it.n, scope: 'Across the organisation' });
    });
    strengthsC.sort((a, b) => b.score - a.score);
    const usedS = [];
    strengthsC.forEach((s) => {
      if (strengths.length >= 3) return;
      if (usedS.some((u) => u.dim.key === s.dim.key || overlap(u, s) > 0.5)) return;
      usedS.push(s);
      const lbl = groupLabel(ds, s.filter);
      strengths.push({ kind: 'group', title: `${lbl} ${strengthText(s.dim)}`, label: lbl, p: s.g.p, po: s.o.p, dim: s.dim, n: s.g.n, scope: lbl, filter: s.filter, members: s.members });
    });
    overview.filter((o) => o.p >= 0.62 && !strengths.some((s) => s.dim.key === o.dim.key)).sort((a, b) => b.p - a.p).slice(0, Math.max(0, 3 - strengths.length)).forEach((o) => {
      strengths.push({ kind: 'dim', title: `Most people ${strengthText(o.dim)}`, p: o.p, dim: o.dim, n: o.n, scope: 'Across the organisation' });
    });
    strengths.forEach((s) => {
      const keys = THEMES.filter((t) => t.dims.includes(s.dim.key)).map((t) => t.key);
      s.quotes = comments.all.filter((c) => c.positive && c.themes.some((t) => keys.includes(t)) && (!s.members || s.members.includes(c.r))).map((c) => c.text);
      s.quotes = [...new Set(s.quotes)].slice(0, 2);
    });

    // Confidential signals: small groups inside one team.
    const signals = [];
    if (ds.sem.team) {
      const teams = [...new Set(R.map((r) => r.groups[ds.sem.team]))].filter(Boolean);
      const attrs = [ds.sem.gender, ds.sem.race].filter(Boolean);
      const dimsToCheck = ds.dims.filter((d) => ['mgr', 'voice', 'belong'].includes(d.key));
      teams.forEach((t) => {
        const inTeam = R.filter((r) => r.groups[ds.sem.team] === t);
        attrs.forEach((a) => {
          [...new Set(inTeam.map((r) => r.groups[a]))].filter(isReal).forEach((v) => {
            const sub = inTeam.filter((r) => r.groups[a] === v);
            const others = inTeam.filter((r) => r.groups[a] !== v);
            const elsewhere = R.filter((r) => r.groups[a] === v && r.groups[ds.sem.team] !== t);
            const hits = [];
            dimsToCheck.forEach((d) => {
              const s = tally(sub, d.key), o = tally(others, d.key), e = tally(elsewhere, d.key);
              if (s.n < 3 || o.n < 3) return;
              const z = ztest(s.fav, s.n, o.fav, o.n);
              if (s.p - o.p <= -0.3 && s.p - e.p <= -0.3 && z <= -2) hits.push({ dim: d, s, o, e, z });
            });
            // Two or more themes must agree before a small group is flagged; one low theme in a tiny group is often chance.
            if (hits.length >= 2 && sub.length >= 4) {
              const themeCounts = {};
              comments.all.filter((c) => sub.includes(c.r)).forEach((c) => c.themes.forEach((th) => { themeCounts[th] = (themeCounts[th] || 0) + 1; }));
              const themeList = Object.entries(themeCounts).sort((x, y) => y[1] - x[1]).map(([key, count]) => ({ label: (THEMES.find((x) => x.key === key) || { label: 'Other' }).label, count }));
              signals.push({
                id: 'sig-' + slug(t + '-' + v), team: t, attr: a, value: v, hits, n: sub.length,
                sizeBand: sub.length < 5 ? 'fewer than 5' : sub.length < 10 ? 'fewer than 10' : 'more than 10',
                groupNoun: groupLabel(ds, { [a]: v }, { lower: true }),
                themes: themeList,
                leaderOfLeader: null,
              });
            }
          });
        });
      });
    }

    // Perception gap between the most and least senior levels.
    let perception = null;
    if (ds.sem.level) {
      const vals = [...new Set(R.map((r) => r.groups[ds.sem.level]))].filter(isReal);
      const stats = vals.map((v) => {
        const mem = members({ [ds.sem.level]: v });
        const per = ds.dims.map((d) => tally(mem, d.key));
        const avg = per.reduce((s, t) => s + (t.p || 0), 0) / per.length;
        return { v, n: mem.length, avg, per };
      }).filter((s) => s.n >= k).sort((a, b) => b.avg - a.avg);
      if (stats.length >= 2) {
        const top = stats[0], bottom = stats[stats.length - 1];
        const gap = top.avg - bottom.avg;
        if (gap >= 0.15) perception = { top, bottom, gap, dims: ds.dims.map((d, i) => ({ dim: d, top: top.per[i].p, bottom: bottom.per[i].p })) };
      }
    }

    // Response rates by the first place-like column.
    const placeCol = ds.sem.department || ds.sem.division;
    let rates = null;
    if (placeCol) {
      const vals = [...new Set(R.map((r) => r.groups[placeCol]))].filter(Boolean).sort();
      rates = vals.map((v) => {
        const resp = R.filter((r) => r.groups[placeCol] === v).length;
        const hc = headcount({ [placeCol]: v });
        return { v, resp, hc, rr: hc ? resp / hc : null, moe: moe(resp, hc) };
      });
      rates.col = placeCol;
    }

    return {
      settings: { minGroup: k, floor: floorBar },
      N, responded: R.length, rr: N ? R.length / N : null, moe: moe(R.length, N),
      overview, focus, watch, early, strengths, signals, perception, rates, comments,
      suppressed: [...suppressed], lensCols, groupsTested: groups.length,
      headline: makeHeadline(overview, focus, strengths),
      summary: makeSummary(focus, strengths, N, R.length),
      groupLabel: (f) => groupLabel(ds, f),
      cell: (filter, dimKey) => { const mem = members(filter); const t = tally(mem, dimKey); return { ...t, members: mem, suppressed: t.n < k }; },
      itemCell: (filter, itemId) => itemFav(members(filter), itemId),
      headcount,
      representation: (attr, val, scope) => representation(ds, attr, val, scope),
      quotesFor: (mem, dimKey) => (mem.length >= k ? pickQuotes(comments, mem, dimKey) : []),
    };

    function itemFav(list, id) {
      let n = 0, f = 0;
      list.forEach((r) => { const v = r.ratings[id]; if (v != null) { n++; if (v >= 4) f++; } });
      return n >= k ? f / n : null;
    }
  }

  function breakdown(ds, c, R, k) {
    // The cross-section the finding sits in, for the dot plot.
    const keys = Object.keys(c.filter);
    if (!keys.length) {
      const h = ds.sem.level || ds.sem.department || keys[0];
      if (!h) return null;
      return crossRows(ds, R, [h], k, c.dim.key, {});
    }
    return crossRows(ds, R, keys, k, c.dim.key, c.filter);
  }
  function crossRows(ds, R, keys, k, dimKey, highlight) {
    const isReal = (v) => v && !PREFER_NOT.test(v);
    const valsA = [...new Set(R.map((r) => r.groups[keys[0]]))].filter(isReal).sort();
    const valsB = keys[1] ? [...new Set(R.map((r) => r.groups[keys[1]]))].filter(isReal).sort() : [null];
    const rows = [];
    valsB.forEach((b) => valsA.forEach((a) => {
      const f = { [keys[0]]: a }; if (b != null) f[keys[1]] = b;
      const mem = R.filter((r) => Object.entries(f).every(([h, v]) => r.groups[h] === v));
      const t = tally(mem, dimKey);
      rows.push({ filter: f, label: groupLabel(ds, f), n: t.n, p: t.n >= k ? t.p : null, ci: t.n >= k ? wilson(t.fav, t.n) : null, hidden: t.n < k, highlight: Object.entries(highlight).length > 0 && Object.entries(highlight).every(([h, v]) => f[h] === v) });
    }));
    rows.sort((x, y) => (y.p ?? -1) - (x.p ?? -1));
    return rows;
  }

  function representation(ds, attr, val, scope) {
    if (!ds.population || !ds.population.mapped.includes(attr) || !ds.sem.level) return null;
    const lvlCol = ds.sem.level;
    let pop = ds.population;
    if (scope) pop = pop.filter((p) => Object.entries(scope).every(([h, v]) => p.groups[h] === v));
    const levels = [...new Set(pop.map((p) => p.groups[lvlCol]))];
    const order = (s) => (/senior|executive|top/i.test(s) ? 0 : /middle|manage|professional/i.test(s) ? 1 : /semi|unskilled|general/i.test(s) ? 3 : 2);
    levels.sort((a, b) => order(a) - order(b));
    const rows = levels.map((l) => {
      const at = pop.filter((p) => p.groups[lvlCol] === l);
      return { level: l, n: at.length, share: at.length ? at.filter((p) => p.groups[attr] === val).length / at.length : 0 };
    }).filter((r) => r.n > 0);
    const overall = pop.filter((p) => p.groups[attr] === val).length / pop.length;
    const mgmt = pop.filter((p) => order(p.groups[lvlCol]) <= 1);
    const mgmtShare = mgmt.length ? mgmt.filter((p) => p.groups[attr] === val).length / mgmt.length : null;
    return { rows, overall, mgmtShare, mgmtN: mgmt.length, n: pop.length };
  }

  function makeHeadline(overview, focus, strengths) {
    const s = strengths[0];
    let first = 'People value parts of working here';
    if (s) {
      if (/team help/i.test(s.short || '')) first = 'People trust their teams';
      else if (s.dim.key === 'mgr') first = 'People value their managers';
      else if (s.dim.key === 'belong') first = 'People feel they belong';
      else if (s.dim.key === 'growth') first = 'People see a future here';
      else first = 'Strengths are real';
    }
    const keys = focus.map((f) => f.dim.key);
    let second = 'Some groups are having a very different experience';
    if (keys.includes('trust') && (keys.includes('fair') || keys.includes('growth'))) second = 'They don’t yet trust the system';
    else if (keys.includes('trust')) second = 'They don’t believe anything will change';
    else if (keys.includes('voice') || keys.includes('mgr')) second = 'Not everyone feels safe to say so';
    return `${first}. ${second}.`;
  }

  function makeSummary(focus, strengths, N, n) {
    const bits = [];
    focus.forEach((f) => {
      if (f.kind === 'org') bits.push(`${f.label.toLowerCase()} ${f.ct.plural} (${pct(f.g.p)} positive)`);
      else bits.push(`${f.label.charAt(0).toLowerCase() + f.label.slice(1)} ${f.ct.plural}`);
    });
    const list = bits.length > 1 ? bits.slice(0, -1).join('; ') + '; and ' + bits[bits.length - 1] : bits[0] || '';
    return list;
  }

  function pct(p) { return p == null ? '–' : Math.round(p * 100) + '%'; }

  const api = { parseCSV, detect, buildDataset, analyze, wilson, ztest, moe, pct, likert, redact, groupLabel, concernText, topicOf, THEMES, PREFER_NOT };
  root.VB_ENGINE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
