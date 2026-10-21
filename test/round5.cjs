// Plain-language pass (20 October) checks, using the Thembeka test files: runs the real app code in a minimal fake browser and checks each change from
// Shivani's "Additional changes and checks" PDF on screen. Run: node test/round5.cjs
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = path.join(__dirname, '..', 'src'), FX = path.join(__dirname, 'fixtures'), UP = path.join(__dirname, '..', '..');
const app = { innerHTML: '' }, handlers = {}, fields = {};
let captured = '';
const field = (sel) => (fields[sel] = fields[sel] || { value: '', focus() {}, scrollIntoView() {} });
global.window = globalThis;
global.document = {
  addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); },
  querySelector: (s) => (s === '#app' ? app : s === '#sheet' || s.startsWith('#sheet ') ? null : field(s)),
  querySelectorAll: () => [],
  getElementById: (id) => Object.assign(field('#' + id), { replaceWith(x) { captured = x.__html; }, scrollIntoView() {}, closest() { return null; } }),
  createElement: () => ({ addEventListener() {}, click() {}, remove() {}, style: {}, querySelector() { return { focus() {} }; }, set innerHTML(v) { this.__html = v; }, get firstElementChild() { return { __html: this.__html }; } }),
  body: { appendChild() {}, style: {} },
};
global.location = { hash: '', protocol: 'file:' }; global.history = { replaceState() {} };
const store = {}; global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
global.scrollTo = () => {}; global.addEventListener = () => {};
global.FileReader = class { readAsText(f) { this.result = f.text; this.onload(); } };
global.URL.createObjectURL = () => 'blob:x'; global.URL.revokeObjectURL = () => {};
for (const f of ['data.js', 'engine.js', 'intake.js', 'guidance.js', 'app.js']) vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f });

const fire = (type, target) => handlers[type].forEach((h) => h({ target, preventDefault() {}, dataTransfer: null }));
const el = (data) => ({ dataset: data, closest(sel) { return (sel === '[data-act]' && data.act) || (sel === '[data-go]' && data.go) ? this : null; } });
const click = (data) => fire('click', el(data));
const txt = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(`  ${ok ? '✓' : '✗'} ${name}${extra ? '  [' + extra + ']' : ''}`); };
const upload = (id, file) => fire('change', { id, files: [{ name: path.basename(file), text: fs.readFileSync(file, 'utf8') }] });
const toResults = () => { click({ act: 'analyse' }); click({ act: 'skip-read' }); };


const TH = path.join(UP, 'Thembeka test data');
(async () => {
upload('f-resp', path.join(TH, 'thembeka_survey_export_aug2026.csv')); await globalThis.VB_WHEN_IDLE();
upload('f-hc', path.join(TH, 'thembeka_headcount_aug2026.csv')); await globalThis.VB_WHEN_IDLE();
click({ act: 'to-check' }); toResults();
let t = txt(app.innerHTML);
console.log('On the radar');
const rows = (app.innerHTML.match(/<div class="w-row">[\s\S]*?<\/small><\/div><\/div>/g) || []).map(txt);
check('Every row shows the same kind of number: the group\'s % positive', rows.length > 0 && rows.every((r) => /\d+% positive/.test(r)), rows.length + ' rows');
check('Organisation-wide row says it is below half, not just "38%"', /38% positive fewer than half; 62% are not positive/.test(t));
check('Group rows say how far below everyone else', /\d+ points below everyone else \(\d+%\)/.test(t));
check('No statistics jargon in row details ("likely difference" replaced)', !/· likely difference|· possible difference|· clear difference/.test(t) && /probably a real difference|very unlikely to be chance|could be chance/.test(t));
console.log('Plain-language keys');
check('Focus areas explain "Clear difference" and "silence test"', /Reading the labels/.test(t) && /Clear difference: very unlikely to be chance/.test(t) && /Passes the silence test: still true/.test(t));
check('Graph caption has no "95% confidence" jargon', !/95% confidence/.test(t) && /where the true figure most likely lies/.test(t));
check('"Margin" renamed and explained', !/>Margin</.test(app.innerHTML) && /Accuracy/.test(t) && /could be this many percentage points higher or lower/.test(t) && /± 23 points/.test(t));
console.log('Reading all comments');
check('Quotes say "N people wrote something similar"', /\d+ people wrote something similar/.test(t) && !/people wrote this/.test(t));
click({ act: 'theme', key: 'other' });
const before = (captured.match(/class="quote"/g) || []).length;
const btn = (captured.match(/See all (\d+) comments</) || []);
check('A long comment theme has a "See all" button', !!btn[0], btn[0]);
click({ act: 'theme-all', key: 'other' });
const after = (captured.match(/class="quote"/g) || []).length;
check('"See all" shows every group of comments in the theme', after > before, `${before} -> ${after} quotes`);
// "See all N" under one quote lists exactly N comments
const sim = captured.match(/(\d+) people wrote something similar · <button[^>]*data-key="([^"]+)"[^>]*>See all (\d+)</);
check('Each grouped quote has its own "See all N" button', !!sim && sim[1] === sim[3], sim ? `${sim[1]} people, button says ${sim[3]}` : '');
click({ act: 'see-similar', key: sim[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&') });
const list = (captured.match(/<ol class="sim-list">([\s\S]*?)<\/ol>/) || [])[1] || '';
check('...and it lists exactly N comments, one per person', (list.match(/<li>/g) || []).length === Number(sim[1]), `${(list.match(/<li>/g) || []).length} listed`);
click({ act: 'see-similar', key: sim[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&') });
check('"Hide" closes the list again', !/<ol class="sim-list">/.test(captured));
click({ act: 'theme-all', key: 'other' });
check('"Show fewer" goes back to 8', (captured.match(/class="quote"/g) || []).length === before);
console.log('Similar wording is grouped, different meaning is not');
const G = (a, b) => VB_ENGINE.similarGroups([{ text: a }, { text: b }]).length === 1;
check('Same point in different words is grouped', G('Please hire more nurses. We are burning out.', 'We are burning out, please hire more nurses!'));
check('"listens" vs "never listens" is kept apart', !G('My manager listens to us.', 'My manager never listens to us.'));
check('"fine" vs "not fine" is kept apart', !G('Pay is fine', 'Pay is not fine'));
check('A short comment is not swallowed by a long one', !G('Communication within the organization.', 'Ensure that the values and culture of the organisation is improved. Promoting more honest and open communication within the organization'));
click({ act: 'sample' }); toResults();   // Kumo: focus area 1 has 12 different comments
const fid = (app.innerHTML.match(/<article class="fa open" id="([^"]+)"/) || [])[1];
const qbtn = (app.innerHTML.match(/See all (\d+) comments from this group on [^<]+/) || []);
check('Focus area quotes have a "See all comments" button (Kumo)', !!qbtn[0], qbtn[0]);
const q0 = (app.innerHTML.match(/class="quote"/g) || []).length;
click({ act: 'quotes-all', id: fid }); click({ go: 'results' });
const q1 = (app.innerHTML.match(/class="quote"/g) || []).length;
check('...and it opens the full list', q1 > q0, `${q0} -> ${q1}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
})();
