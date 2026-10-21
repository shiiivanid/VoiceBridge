// Stress-test checks, written from Shivani's stress-test log (17 October 2026).
// Data: Masakhane Retail, a fictional company with known planted patterns (see test/fixtures).
// Run: node test/stress.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
await import('../src/engine.js');
const E = globalThis.VB_ENGINE;
const F = (f) => fs.readFileSync(new URL('./fixtures/' + f, import.meta.url), 'utf8');
const S = (f) => fs.readFileSync(new URL('../sample/' + f, import.meta.url), 'utf8');

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}
// The same steps the app takes: read, clean, detect columns, build, analyse.
function run(surveyText, headcountText, settings = {}) {
  const p = E.parseCSV(surveyText);
  const prep = E.cleanRows ? E.cleanRows(p.headers, p.rows) : { rows: p.rows, removed: {} };
  const cols = E.detect(p.headers, prep.rows);
  const ds = E.buildDataset(cols, prep.rows, headcountText ? E.parseCSV(headcountText).rows : null);
  return { prep, cols, ds, a: E.analyze(ds, { minGroup: 5, ...settings }) };
}
const M = run(F('masakhane_survey_export_sept2026.csv'), F('masakhane_headcount_sept2026.csv'));
const K = run(S('kumo_survey_export_sept2026.csv'), S('kumo_headcount_sept2026.csv'));

console.log('\nPersonal details in comments (log row 14)');
const texts = M.a.comments.all.map((c) => c.text).join('\n');
for (const [label, re] of [['SA ID number', /9203155123087/], ['landline in brackets', /555 1234/], ['first name not on the list (Lindiwe)', /Lindiwe/],
  ['surname after "Mr" (Naidoo)', /Naidoo/], ['mobile number', /0199/], ['personal email', /gmail/], ['name after "Supervisor" (Johan)', /Johan/]]) {
  check(`Removed: ${label}`, () => assert.ok(!re.test(texts), 'still visible in comments'));
}
check('Ordinary words are not mistaken for names', () => {
  const log = { email: 0, phone: 0, name: 0, id: 0 };
  const t = E.redact('My Manager Is Great. Please fix the Canteen in Durban before December.', log);
  assert.equal(t, 'My Manager Is Great. Please fix the Canteen in Durban before December.');
});
check('Kumo redaction is unchanged (1 email, 1 phone, at least 1 name)', () => {
  const l = K.a.comments.log; assert.equal(l.email, 1); assert.equal(l.phone, 1); assert.ok(l.name >= 1);
});

console.log('\nCounting responses (log rows 1, 4, 17, 21)');
check('The duplicated submission is removed', () => assert.equal(M.prep.removed.duplicates, 1));
check('The 3 empty responses are removed', () => assert.equal(M.prep.removed.empty, 3));
check('295 real responses are counted', () => assert.equal(M.a.responded, 295));
check('Growth theme is 68% once the duplicate is removed', () => assert.equal(E.pct(M.a.overview.find((o) => o.dim.key === 'growth').p), '68%'));
check('Store Operations response count excludes the empty rows (154 of 230)', () => {
  const r = M.a.rates.find((x) => x.v === 'Store Operations'); assert.equal(r.resp, 154); assert.equal(r.hc, 230);
});
check('Kumo still has 388 responses and nothing removed', () => {
  assert.equal(K.a.responded, 388); assert.equal(K.prep.removed.duplicates + K.prep.removed.empty + K.prep.removed.summary, 0);
});
const T = run(F('edge4_tiny_messy_semicolons.csv'), null);
check('A "Total" row at the bottom is ignored, so rating questions are still found', () => {
  assert.equal(T.prep.removed.summary, 1); assert.ok(T.cols.filter((c) => c.role === 'rating').length === 3);
});
check('A blank row is not counted as a response (8 people)', () => assert.equal(T.a.responded, 8));
check('With no findings, the headline doesn’t claim groups are having a different experience', () => assert.ok(!/different experience/.test(T.a.headline), T.a.headline));

console.log('\nHeadcount labels that don’t match (log row 20)');
const X = run(F('masakhane_survey_export_sept2026.csv'), F('edge3_headcount_mismatched_labels.csv'));
const issues = X.ds.population.issues;
check('Mismatched labels are reported for Gender, Race, Department and Region', () => {
  for (const h of ['Gender', 'Race', 'Department', 'Region']) assert.ok(issues.some((i) => i.col === h), 'no issue for ' + h);
});
check('The issue names the values, e.g. "Female" in the survey but not the headcount', () => {
  const g = issues.find((i) => i.col === 'Gender'); assert.ok(g.missing.includes('Female')); assert.ok(g.hcOnly.includes('F'));
});
check('Mismatched columns are not used for response rates (no 0% or over-100% rates)', () => {
  assert.ok(!X.ds.population.mapped.includes('Gender')); assert.ok(!X.ds.population.mapped.includes('Race'));
});
check('A finding that couldn’t get a silence test says why', () => {
  const f = [...X.a.focus, ...X.a.watch].find((x) => !x.silence); assert.ok(f, 'no finding without a silence test'); assert.ok(f.silenceNote, 'no note');
});
check('Matching headcount files report no issues (Masakhane and Kumo)', () => {
  assert.equal(M.ds.population.issues.length, 0); assert.equal(K.ds.population.issues.length, 0);
});
check('Labels that differ only in capitals or spaces still match', () => {
  const hc = F('masakhane_headcount_sept2026.csv').replace(/,Female,/g, ',female ,');
  const R = run(F('masakhane_survey_export_sept2026.csv'), hc); assert.equal(R.ds.population.issues.length, 0);
});

console.log('\nWording and Explore (log rows 6, 8)');
check('Disability group reads "People with a disability"', () => {
  const f = M.a.focus.find((x) => x.dim.key === 'belong'); assert.ok(f); assert.match(f.headline, /^People with a disability /);
});
check('Planted findings still found: under-25s on growth, disability on belonging', () => {
  assert.ok(M.a.focus.some((x) => x.dim.key === 'growth' && /under 25/.test(x.headline)));
  assert.ok(M.a.focus.some((x) => x.dim.key === 'belong'));
});
check('Contact Centre wellbeing stays an early signal (low response)', () => assert.ok(M.a.early.some((x) => /Contact Centre/.test(x.headline) && x.early === 'response')));
check('Confidential pattern in JHB Store 4 is still found', () => assert.ok(M.a.signals.some((s) => s.team === 'JHB Store 4')));

console.log('\nRound 2 (Shivani’s re-check, 17 October): refusing, themes, comments, perception gap');
check('A mismatched headcount blocks the analysis', () => assert.ok(E.blockers(X.ds).some((b) => b.kind === 'headcount')));
check('A matching headcount does not block (Masakhane and Kumo)', () => { assert.equal(E.blockers(M.ds).length, 0); assert.equal(E.blockers(K.ds).length, 0); });
check(`Fewer than ${E.MIN_RESPONSES} responses blocks the analysis (8-person file)`, () => assert.ok(E.blockers(T.ds).some((b) => b.kind === 'too-few' && b.n === 8)));
check('No headcount at all does not block (Kumo without headcount)', () => {
  const N = run(S('kumo_survey_export_sept2026.csv'), null); assert.equal(E.blockers(N.ds).length, 0);
});
check('No perception gap where none was planted (Masakhane: senior group of 10)', () => assert.equal(M.a.perception, null));
check('The planted perception gap in Kumo is still found', () => { assert.ok(K.a.perception); assert.equal(K.a.perception.top.v, 'Senior management'); });
const FM = run(F('edge1_forms_style_no_theme_tags.csv'), F('masakhane_headcount_sept2026.csv'));
check('Untagged Forms export: no question is left in "General"', () => {
  const g = FM.cols.filter((c) => c.role === 'rating' && c.theme === 'General'); assert.equal(g.length, 0, g.map((c) => c.header).join('; '));
});
check('Untagged Forms export: questions land in the same 6 themes as the tagged file', () => assert.equal(FM.ds.dims.length, 6));
check('Untagged Forms export: the under-25 growth finding is found again', () => assert.ok(FM.a.focus.some((f) => f.dim.key === 'growth' && /under 25/.test(f.headline))));
check('A theme chosen on the Check screen overrides the guess', () => {
  const p = E.parseCSV(F('edge1_forms_style_no_theme_tags.csv')); const c = E.cleanRows(p.headers, p.rows);
  const cols = E.detect(p.headers, c.rows, { themes: { 'My ideas are listened to': 'Engagement' } });
  assert.equal(cols.find((x) => x.header === 'My ideas are listened to').theme, 'Engagement');
});
check('Tagged surveys are unaffected by the new keywords (Kumo themes unchanged)', () => {
  assert.deepEqual(K.ds.dims.map((d) => d.label), ['Fairness & advancement', 'Belonging & respect', 'Voice & safety', 'My manager', 'Growth', 'Trust in follow-through']);
});
check('Fewer than 10% of Masakhane comments land in "Other" (was 43%)', () => {
  const o = (M.a.comments.themes.find((t) => t.key === 'other') || { count: 0 }).count; assert.ok(o / M.a.comments.all.length < 0.1, `${o} of ${M.a.comments.all.length}`);
});
check('The Contact Centre wellbeing finding now has quotes about workload', () => {
  const f = M.a.early.find((x) => /Contact Centre/.test(x.headline)); assert.ok(f.quotes.length >= 2);
});
check('The disability finding’s first quote is about access or inclusion', () => {
  const f = M.a.focus.find((x) => x.dim.key === 'belong'); assert.match(f.quotes[0].text, /wheelchair|accessib|invisible|differently|disabilit/);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
