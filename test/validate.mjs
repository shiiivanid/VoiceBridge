// VoiceBridge validation suite.  Run: node test/validate.mjs
//
// 1. Known answers: the synthetic Kumo data has eight planted patterns; the engine must find each one.
// 2. Bad input: empty files, wrong formats and tiny surveys must fail safely, never with a confident wrong answer.
// 3. Fairness: swapping group labels must swap the findings and nothing else.
// 4. Consistency: the same input always gives the same output.
import assert from 'node:assert/strict';

await import('../src/data.js');
await import('../src/engine.js');
const D = globalThis.VB_DATA, E = globalThis.VB_ENGINE;

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}
function run(rows, headcount, settings = {}) {
  const p = E.parseCSV(D.toCSV(rows));
  const cols = E.detect(p.headers, p.rows);
  const ds = E.buildDataset(cols, p.rows, headcount ? E.parseCSV(D.toCSV(headcount)).rows : null);
  return { cols, ds, a: E.analyze(ds, { minGroup: 5, ...settings }) };
}

const { rows, headcount } = D.generate();
const { cols, ds, a } = run(rows, headcount);
const all = [...a.focus, ...a.watch, ...a.early];
const has = (dim, filter) => all.find((f) => f.dim.key === dim && Object.entries(filter).every(([h, v]) => f.filter[h] === v) && Object.keys(f.filter).length === Object.keys(filter).length);

console.log('\nKnown answers (planted patterns)');
check('P1 Women in Operations: fairness & advancement is a focus area', () => {
  const f = has('fair', { Gender: 'Woman', Division: 'Operations' });
  assert.ok(f, 'not found'); assert.equal(f.status, 'focus'); assert.ok(f.silence.survives, 'should pass the silence test');
});
check('P2 DBN Shift B women: confidential signal only, never in a report', () => {
  const s = a.signals.find((x) => x.team === 'DBN Shift B' && x.value === 'Woman');
  assert.ok(s, 'signal missing');
  assert.ok(!all.some((f) => Object.values(f.filter).includes('DBN Shift B')), 'team leaked into a report finding');
});
check('P3 Low trust that results lead to action is an organisation-wide focus area', () => {
  const f = a.focus.find((x) => x.kind === 'org' && x.dim.key === 'trust'); assert.ok(f);
});
check('P3 People with 5+ years of service trust follow-through least', () => {
  const long = a.cell({ 'Length of service': '5+ years' }, 'trust').p, first = a.cell({ 'Length of service': 'Under 1 year' }, 'trust').p;
  assert.ok(long < first - 0.15, `5+ years ${long} vs first year ${first}`);
});
check('P4 Teams helping each other is the top strength', () => {
  assert.ok(/help each other/i.test(a.strengths[0].short || ''));
});
check('P5 African employees in semi-skilled roles: growth is a focus area', () => {
  const f = has('growth', { Race: 'African', 'Occupational level': 'Semi-skilled' }); assert.ok(f); assert.equal(f.status, 'focus');
});
check('P6 Technology voice is flagged as an early signal because of low response', () => {
  const f = a.early.find((x) => x.filter.Department === 'Technology' && x.dim.key === 'voice');
  assert.ok(f, 'not an early signal'); assert.equal(f.early, 'response');
});
check('P7 Non-binary employees (3 people) are never shown', () => {
  assert.ok(!all.some((f) => Object.values(f.filter).includes('Non-binary')));
  assert.ok(a.cell({ Gender: 'Non-binary' }, 'fair').suppressed);
});
check('P8 Perception gap between senior management and semi-skilled staff is detected', () => {
  assert.ok(a.perception); assert.equal(a.perception.top.v, 'Senior management'); assert.ok(a.perception.gap > 0.25);
});
check('Personal details in comments are removed', () => {
  assert.equal(a.comments.log.phone, 1); assert.equal(a.comments.log.email, 1); assert.ok(a.comments.log.name >= 1);
  assert.ok(!a.comments.all.some((c) => /082 555|@kumo|Johan/.test(c.text)));
});
check('The email column is detected as personal data and dropped', () => {
  assert.equal(cols.find((c) => c.header === 'Email').role, 'pii');
});
check('No false alarm: Indian and White employees have no focus area', () => {
  assert.ok(!a.focus.some((f) => ['Indian', 'White'].includes(f.filter.Race)));
});

console.log('\nBad input');
check('Empty file gives no rows', () => { assert.equal(E.parseCSV('').rows.length, 0); });
check('A file with no rating questions is recognised as such', () => {
  const p = E.parseCSV('Name,Comment\nA,hello there this is long text\nB,another long comment here');
  assert.ok(!E.detect(p.headers, p.rows).some((c) => c.role === 'rating'));
});
check('Numeric 1–5 answers work as well as text answers', () => {
  const p = E.parseCSV('Gender,Q1 [Fairness] Things are fair\n' + Array.from({ length: 30 }, (_, i) => `${i % 2 ? 'Woman' : 'Man'},${(i % 5) + 1}`).join('\n'));
  const c = E.detect(p.headers, p.rows); assert.equal(c.find((x) => x.header.startsWith('Q1')).role, 'rating');
});
check('"Don’t know" and N/A answers are ignored, not scored', () => { assert.equal(E.likert('N/A'), null); assert.equal(E.likert("Don't know"), null); });
check('A tiny survey (8 people) produces no group findings', () => {
  const r = run(rows.slice(0, 8), null, { invited: 20 }).a;
  assert.equal(r.focus.filter((f) => f.kind === 'group').length, 0);
});
check('Without a headcount file the silence test is skipped, not faked', () => {
  const r = run(rows, null).a; assert.ok(r.focus.every((f) => f.silence === null || f.kind === 'org'));
});
check('Raising the anonymity threshold to 10 hides more groups', () => {
  const r10 = run(rows, headcount, { minGroup: 10 }).a; assert.ok(r10.suppressed.length > a.suppressed.length);
});

console.log('\nFairness (label swap)');
check('Swapping "Woman" and "Man" swaps the finding and changes nothing else', () => {
  const swap = (v) => (v === 'Woman' ? 'Man' : v === 'Man' ? 'Woman' : v);
  const r = run(rows.map((x) => ({ ...x, Gender: swap(x.Gender) })), headcount.map((x) => ({ ...x, Gender: swap(x.Gender) }))).a;
  const f = [...r.focus, ...r.watch].find((x) => x.dim.key === 'fair' && x.filter.Gender === 'Man' && x.filter.Division === 'Operations');
  const orig = has('fair', { Gender: 'Woman', Division: 'Operations' });
  assert.ok(f, 'swapped finding missing'); assert.equal(f.g.p, orig.g.p); assert.equal(f.g.n, orig.g.n);
});
check('Renaming race labels does not change any number', () => {
  const map = { African: 'Group A', Coloured: 'Group B', Indian: 'Group C', White: 'Group D' };
  const r = run(rows.map((x) => ({ ...x, Race: map[x.Race] || x.Race })), headcount.map((x) => ({ ...x, Race: map[x.Race] || x.Race }))).a;
  assert.deepEqual(r.focus.map((f) => [f.dim.key, f.g.n, f.g.fav]), a.focus.map((f) => [f.dim.key, f.g.n, f.g.fav]));
});

console.log('\nConsistency');
check('The same file gives identical results every time', () => {
  const b = run(rows, headcount).a;
  assert.deepEqual(b.focus.map((f) => f.headline), a.focus.map((f) => f.headline));
  assert.equal(JSON.stringify(b.overview.map((o) => o.p)), JSON.stringify(a.overview.map((o) => o.p)));
});
check('Row order does not matter', () => {
  const b = run([...rows].reverse(), headcount).a;
  assert.deepEqual(b.focus.map((f) => [f.headline, f.g.fav]), a.focus.map((f) => [f.headline, f.g.fav]));
});

console.log('\nOther survey formats');
// A typical HR-system export: semicolons, decimal commas, underscore headers with theme prefixes,
// a negatively worded item, numeric tenure and a comment box with only a few distinct answers.
const fmt = (() => {
  const head = 'Employee_ID;Job_Level;Tenure_Years;Age_Band;Gender;DEI_Belonging;DEI_Discrimination_Concern;DEI_Fairness;Wellbeing_Support;Wellbeing_Burnout;Overall_Comment';
  const lines = Array.from({ length: 60 }, (_, i) => {
    const b = (i % 5) + 1;
    return [`SYN-${i}`, i % 3 ? 'Individual Contributor' : 'Team Lead', `${i % 12},${i % 10}`, i % 2 ? '25–34' : '35–44', i % 2 ? 'Woman' : 'Man',
      b, 6 - b, b, b, 6 - b, i % 4 ? '' : ['Workloads can be intense.', 'Recognition would help morale.'][i % 8 ? 1 : 0]].join(';');
  });
  const p = E.parseCSV(head + '\r\n' + lines.join('\r\n'));
  return { p, cols: E.detect(p.headers, p.rows) };
})();
const col = (h) => fmt.cols.find((c) => c.header === h);
check('Semicolon-separated files are split into columns', () => { assert.equal(fmt.p.headers.length, 11); });
check('Underscore headers are recognised (Employee_ID removed, Job_Level, Age_Band)', () => {
  assert.equal(col('Employee_ID').role, 'pii'); assert.equal(col('Job_Level').semantic, 'level'); assert.equal(col('Age_Band').semantic, 'age');
});
check('Theme prefixes become themes (DEI, Wellbeing)', () => {
  assert.deepEqual([...new Set(fmt.cols.filter((c) => c.role === 'rating').map((c) => c.theme))], ['DEI', 'Wellbeing']);
});
check('Negatively worded items that run against the rest are reverse-scored, others are not', () => {
  assert.ok(col('DEI_Discrimination_Concern').reverse); assert.ok(col('Wellbeing_Burnout').reverse); assert.ok(!col('DEI_Belonging').reverse);
  const ds = E.buildDataset(fmt.cols, fmt.p.rows);
  const id = ds.dims.flatMap((d) => d.items).find((it) => it.header === 'DEI_Discrimination_Concern').id;
  ds.respondents.forEach((r) => assert.equal(r.ratings[id], 6 - E.likert(fmt.p.rows[r.i].DEI_Discrimination_Concern)));
});
check('Numeric tenure with decimal commas is grouped into service bands', () => {
  assert.equal(col('Tenure_Years').role, 'group'); assert.ok(col('Tenure_Years').values.includes('Under 1 year'));
});
check('A comment box with few distinct answers is read as comments, not as a group', () => { assert.equal(col('Overall_Comment').role, 'comment'); });
check('A negatively worded item that runs with the rest is not flipped', () => {
  const p = E.parseCSV('Stress_Manageable;Team_Support;Team_Respect\n' + Array.from({ length: 30 }, (_, i) => { const b = (i % 5) + 1; return `${b};${b};${b}`; }).join('\n'));
  assert.ok(!E.detect(p.headers, p.rows).some((c) => c.reverse));
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
