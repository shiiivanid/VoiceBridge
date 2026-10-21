// Prints a full plain-text summary of everything the engine reports for each test dataset.
// Used as a safety net: save the output before a change, run again after, and compare.
// Any difference that wasn't intended is a side effect to investigate.
import fs from 'node:fs';
await import('../src/engine.js');
const E = globalThis.VB_ENGINE;
const F = (f) => new URL('./fixtures/' + f, import.meta.url);
const S = (f) => new URL('../sample/' + f, import.meta.url);
const pct = (x) => (x == null ? '-' : Math.round(x * 100) + '%');

function run(name, survey, headcount, settings = {}) {
  const out = [];
  const log = (...a) => out.push(a.join(' '));
  const p = E.parseCSV(fs.readFileSync(survey, 'utf8'));
  const prep = E.cleanRows ? E.cleanRows(p.headers, p.rows) : { rows: p.rows };
  const cols = E.detect(p.headers, prep.rows);
  const hc = headcount ? E.parseCSV(fs.readFileSync(headcount, 'utf8')).rows : null;
  const ds = E.buildDataset(cols, prep.rows, hc);
  const a = E.analyze(ds, { minGroup: 5, ...settings });
  log('=====', name);
  if (prep.removed) log('removed rows', JSON.stringify(prep.removed));
  cols.forEach((c) => log('col', c.role, c.theme || c.semantic || c.why || '', c.reverse ? 'REV' : '', c.header.slice(0, 60)));
  if (ds.population && ds.population.issues) log('headcount issues', JSON.stringify(ds.population.issues));
  log('responded', a.responded, 'N', a.N, 'rr', pct(a.rr), 'moe', pct(a.moe));
  log('headline', a.headline);
  a.overview.forEach((o) => log('theme', o.dim.label, pct(o.p), o.n, o.items.map((i) => i.id + ':' + pct(i.p)).join(' ')));
  const f = (tag, x) => log(tag, x.headline, pct(x.g.p), 'vs', pct(x.o && x.o.p), 'n', x.g.n, x.confidence.label,
    x.silence ? `sil ${x.silence.unf}/${x.silence.headcount} ${pct(x.silence.floor)}-${pct(x.silence.ceiling)} ${x.silence.survives}` : 'nosil' + (x.silenceNote ? ':' + x.silenceNote : ''),
    'also', x.also.map((y) => y.dim.key).join(','), x.early || '', 'quotes', x.quotes.length);
  a.focus.forEach((x) => f('FOCUS', x)); a.watch.forEach((x) => f('WATCH', x)); a.early.forEach((x) => f('EARLY', x));
  a.strengths.forEach((s) => log('STRENGTH', s.title, pct(s.p), pct(s.po), s.n, 'quotes', (s.quotes || []).length));
  a.signals.forEach((s) => log('SIGNAL', s.team, s.attr, s.value, s.sizeBand, s.hits.map((h) => `${h.dim.key} ${pct(h.s.p)}/${pct(h.o.p)}/${pct(h.e.p)}`).join(' ')));
  log('perception', a.perception ? `${a.perception.top.v} ${pct(a.perception.top.avg)} / ${a.perception.bottom.v} ${pct(a.perception.bottom.avg)}` : 'none');
  log('hidden', a.suppressed.length, 'groups tested', a.groupsTested, 'lenses', a.lensCols.join('|'));
  if (a.rates) log('rates', a.rates.map((r) => `${r.v} ${r.resp}/${r.hc}`).join(' | '));
  log('comments', a.comments.all.length, JSON.stringify(a.comments.log), a.comments.themes.map((t) => t.key + ':' + t.count).join(' '));
  a.comments.all.forEach((c, i) => { if (/\[(name|email|number|ID)/.test(c.text) || i < 3) log('  c', c.text); });
  return out.join('\n');
}
const all = [
  run('kumo', S('kumo_survey_export_sept2026.csv'), S('kumo_headcount_sept2026.csv')),
  run('kumo-no-headcount', S('kumo_survey_export_sept2026.csv'), null),
  run('shivani-dei', F('shivani_dei_survey.csv'), null),
  run('masakhane', F('masakhane_survey_export_sept2026.csv'), F('masakhane_headcount_sept2026.csv')),
  run('masakhane-mismatched-hc', F('masakhane_survey_export_sept2026.csv'), F('edge3_headcount_mismatched_labels.csv')),
  run('edge1-forms', F('edge1_forms_style_no_theme_tags.csv'), F('masakhane_headcount_sept2026.csv')),
  run('edge4-tiny', F('edge4_tiny_messy_semicolons.csv'), null),
].join('\n\n');
const target = process.argv[2];
if (target) fs.writeFileSync(target, all + '\n'); else console.log(all);
