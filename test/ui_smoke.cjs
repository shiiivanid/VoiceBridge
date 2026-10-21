// Headless check of VoiceBridge screens: runs the real src/*.js in a minimal fake browser,
// clicks through Upload -> Check -> Results, and reports any crash plus key text on each screen.
const fs = require('fs'), vm = require('vm'), path = require('path');
const [, , SRC, SURVEY, HEADCOUNT, MODE] = process.argv;

const app = { innerHTML: '' };
const handlers = {};
let captured = '';
const fakeEl = () => ({ replaceWith(x) { captured = x.__html; }, scrollIntoView() {}, closest() { return null }, focus() {} });
global.window = globalThis;
global.document = {
  addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); },
  querySelector: (s) => (s === '#app' ? app : s === '#sheet' || s.startsWith('#sheet ') ? null : { focus() {}, value: '' }),
  querySelectorAll: () => [],
  getElementById: () => fakeEl(),
  createElement: () => ({ addEventListener() {}, click() {}, remove() {}, style: {}, querySelector() { return { focus() {} }; }, set innerHTML(v) { this.__html = v; }, get firstElementChild() { return { __html: this.__html }; } }),
  body: { appendChild() {}, style: {} },
};
global.location = { hash: '', protocol: 'file:' };
global.history = { replaceState() {} };
const store = {};
global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
global.scrollTo = () => {};
global.addEventListener = () => {};
global.FileReader = class { readAsText(f) { this.result = f.text; this.onload(); } };

for (const f of ['data.js', 'engine.js', 'guidance.js', 'app.js']) vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f });

const S_firstDim = () => (app.innerHTML.match(/data-act="glance" data-dim="([^"]+)"/) || [])[1];
const fire = (type, target) => handlers[type].forEach((h) => h({ target, preventDefault() {}, dataTransfer: null }));
const el = (data) => ({ dataset: data, closest(sel) { if (sel === '[data-act]' && data.act) return this; if (sel === '[data-go]' && data.go) return this; return null; } });
const click = (data) => fire('click', el(data));
const text = () => app.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const show = (label, needles) => { const t = text(); console.log(`\n[${label}]`); needles.forEach((n) => console.log(`  ${t.includes(n) ? 'OK  ' : 'MISSING'} "${n}"`)); };

try {
  show('Start screen', ['What your file needs', 'Download the Excel template', 'Download a survey template']);
  if (MODE === 'sample') {
    click({ act: 'sample' });
  } else {
    fire('change', { id: 'f-resp', files: [{ name: path.basename(SURVEY), text: fs.readFileSync(SURVEY, 'utf8') }] });
    if (HEADCOUNT && HEADCOUNT !== '-') fire('change', { id: 'f-hc', files: [{ name: path.basename(HEADCOUNT), text: fs.readFileSync(HEADCOUNT, 'utf8') }] });
    click({ act: 'to-check' });
  }
  show('Check screen', MODE === 'masakhane' ? ['ways to group people'] : MODE === 'sample' ? ['ways to group people', 'Matched to 600 people'] : HEADCOUNT !== '-' ? ['0 ways to group people', 'no columns to group people by', 'Matched to 26 people', 'None of the headcount'] : ['0 ways to group people', 'no columns to group people by', 'How many people were invited?']);
  show('Theme check on Check screen', ['which theme each question is in']);
  if (MODE !== 'sample' && HEADCOUNT === '-') fire('change', { id: 'invited', value: '26' });
  click({ act: 'analyse' });
  click({ act: 'skip-read' });
  const t = text();
  console.log('\n[Results screen] rendered OK, length', t.length);
  console.log('  headline:', (app.innerHTML.match(/<h1>([^<]*)<\/h1>/) || [])[1]);
  show('Results content', MODE === 'sample' ? ['Focus areas', 'Explore every group', 'Gender × Race'] : MODE === 'masakhane' ? ['Focus areas', 'Explore every group', 'With disability', 'Without disability'] : ['Explore every group', 'This file has no columns to group people by', '20 of 26 people']);
  click({ act: 'glance', dim: MODE === 'sample' ? 'trust' : MODE === 'masakhane' ? S_firstDim() : 'commitment' });
  console.log('\n[Drill-down from summary]', /Everyone: \d+% positive/.test(captured.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')) ? 'OK' : 'MISSING', '"Everyone: N% positive"');
  if (MODE === 'masakhane') {
    const id = (app.innerHTML.match(/id="(g-[^"]*disabilit[^"]*)"/) || [])[1];
    click({ act: 'toggle-fa', id }); click({ go: 'results' });
    const dots = (app.innerHTML.match(/<span class="lbl"[^>]*>([^<]*)<\/span>/g) || []).map((x) => x.replace(/<[^>]+>/g, ''));
    console.log('[Disability focus area graph labels]', JSON.stringify(dots));
    click({ act: 'lens', key: 'Do you have a disability?' });
    const heads = (captured.match(/<th>([^<]*)<small>/g) || []).map((x) => x.replace(/<[^>]+>/g, ''));
    console.log('[Explore, disability tab, column headers]', JSON.stringify(heads));
  }
  click({ go: 'release' });
  console.log('[Release screen] rendered OK:', text().includes('Release the results to everyone at once'));
  click({ act: 'preview', k: 'employees' });
  console.log('[Employee preview] opened OK');
} catch (e) {
  console.log('\nCRASH:', e.message);
  console.log(e.stack.split('\n').slice(0, 4).join('\n'));
  process.exitCode = 1;
}
process.exit();
