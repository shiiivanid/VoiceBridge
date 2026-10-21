// Every focus area / radar item whose graph is drawn must show its own group (the red row).
// Before 20 October the graph stopped at 12 rows and could cut it off (Kumo focus area 2).
import fs from 'node:fs';
await import('../src/engine.js'); const E = globalThis.VB_ENGINE;
const load = (survey, hc) => { const s = E.parseCSV(survey); const c = E.cleanRows(s.headers, s.rows); const cols = E.detect(s.headers, c.rows); return E.analyze(E.buildDataset(cols, c.rows, hc ? E.parseCSV(hc).rows : null), { minGroup: 5 }); };
await import('../src/data.js'); const D = globalThis.VB_DATA; const k = D.generate();
const sets = {
  Kumo: load(D.toCSV(k.rows), D.toCSV(k.headcount)),
  Masakhane: load(fs.readFileSync('test/fixtures/masakhane_survey_export_sept2026.csv', 'utf8'), fs.readFileSync('test/fixtures/masakhane_headcount_sept2026.csv', 'utf8')),
  Thembeka: load(fs.readFileSync('../Thembeka test data/thembeka_survey_export_aug2026.csv', 'utf8'), fs.readFileSync('../Thembeka test data/thembeka_headcount_aug2026.csv', 'utf8')),
};
let pass = 0, fail = 0;
for (const [name, a] of Object.entries(sets)) {
  for (const f of [...a.focus, ...a.watch, ...a.early].filter((x) => x.kind !== 'org' && x.breakdown)) {
    const shown = f.breakdown.filter((r) => !r.hidden);           // what the graph now draws
    const old = f.breakdown.slice(0, 12);                          // what it used to draw
    const ok = shown.some((r) => r.highlight);
    ok ? pass++ : fail++;
    console.log(`${ok ? '✓' : '✗'} ${name}: ${f.headline}  (${shown.length} rows${old.some((r) => r.highlight) ? '' : '; was cut off before'})`);
  }
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
