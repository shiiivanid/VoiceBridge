// VoiceBridge edge-case suite (21 October 2026).  Run: node test/edge.mjs
//
// Runs the real app code (src/*.js) in a fresh simulated browser for every case, from upload to the employee page.
//
//  Part 1 – Correct files in every format: the Kumo survey saved 30+ different ways (CSV with commas, semicolons,
//           tabs or pipes; different line endings and text encodings; Excel workbooks; Qualtrics, SurveyMonkey and
//           Microsoft Forms layouts; answers as words, numbers, 0–4, "5 - Strongly agree", Afrikaans …).
//           Every one must give exactly the same report as the built-in Kumo sample.
//  Part 2 – Broken or unusual files: each must either be read correctly (and say what was changed) or be refused
//           with a specific message. None may crash, freeze, or quietly produce a report from misread data.
//  Part 3 – Behaviour after the upload: release locks, blank leader responses, saved state per file, and the
//           safety net that catches unexpected errors.
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'src');
const CODE = ['data.js', 'engine.js', 'intake.js', 'guidance.js', 'app.js'].map((f) => [f, fs.readFileSync(path.join(SRC, f), 'utf8')]);
const FX = path.join(here, 'fixtures');

// ---------------------------------------------------------------- A fresh simulated browser per case
function makeApp() {
  const app = { innerHTML: '' }, handlers = {}, fields = {}, store = {};
  let captured = '', sheetHtml = '';
  const field = (sel) => (fields[sel] = fields[sel] || { value: '', focus() {}, scrollIntoView() {} });
  const winHandlers = {};
  const ctx = {
    console: { log() {}, error() {}, warn() {} }, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
    TextDecoder, TextEncoder, DecompressionStream, Response, Blob, URL, atob, btoa, structuredClone,
    location: { hash: '', protocol: 'file:' }, history: { replaceState() {} },
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    scrollTo() {}, addEventListener(t, f) { (winHandlers[t] = winHandlers[t] || []).push(f); },
    fetch: () => Promise.reject(new Error('offline')),
    FileReader: class { readAsText(f) { this.result = f.text; this.onload(); } },
  };
  ctx.document = {
    addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); },
    querySelector: (s) => (s === '#app' ? app : s.startsWith('#sheet') ? null : field(s)),
    querySelectorAll: () => [],
    getElementById: (id) => Object.assign(field('#' + id), { replaceWith(x) { captured = x.__html; }, scrollIntoView() {}, closest() { return null; } }),
    createElement: () => ({ addEventListener() {}, click() {}, remove() {}, style: {}, querySelector() { return { focus() {} }; }, set innerHTML(v) { this.__html = v; sheetHtml = v; }, get innerHTML() { return this.__html; }, get firstElementChild() { return { __html: this.__html }; } }),
    body: { appendChild() {}, style: {} },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const [f, src] of CODE) vm.runInContext(src, ctx, { filename: f });
  const fire = (type, target, extra = {}) => (handlers[type] || []).forEach((h) => h({ target, preventDefault() {}, ...extra }));
  const el = (d) => ({ dataset: d, closest(s) { return (s === '[data-act]' && d.act) || (s === '[data-go]' && d.go) ? this : null; } });
  return {
    html: () => app.innerHTML, captured: () => captured, sheet: () => sheetHtml, store, fields, field,
    click: (d) => fire('click', el(d)),
    submit: (d) => fire('submit', { dataset: d }),
    change: (target) => fire('change', target),
    async upload(slot, files) {
      const list = files.map((f) => ({ name: f.name, bytes: f.bytes }));
      if (slot === 'drop') fire('drop', { closest: (s) => (s === '.dropzone' ? { id: 'dz-resp', classList: { remove() {} } } : null) }, { dataTransfer: { files: list } });
      else fire('change', { id: slot === 'hc' ? 'f-hc' : 'f-resp', files: list });
      await ctx.VB_WHEN_IDLE();
    },
    winError: (e) => (winHandlers.error || []).forEach((h) => h({ error: e })),
  };
}

// ---------------------------------------------------------------- What a report says, for comparing two runs
const txt = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
function reportOf(a) {
  const h = a.html();
  return JSON.stringify({
    headline: txt((h.match(/<h1>[\s\S]*?<\/h1>/) || [''])[0]),
    responded: (txt(h).match(/\d+ of \d+ people responded/) || [''])[0],
    themes: [...h.matchAll(/class="nm">([^<]+)<\/span>[\s\S]*?class="val">([^<]+)</g)].map((m) => m[1] + ' ' + m[2]),
    focus: [...h.matchAll(/data-act="toggle-fa" data-id="([^"]+)"/g)].map((m) => m[1]),
    focusText: [...h.matchAll(/<p class="fa-sub">([\s\S]*?)<\/p>/g)].map((m) => txt(m[1])),
    radar: (h.match(/class="w-row"/g) || []).length,
  });
}
const screenIs = (a, name) => new RegExp(`aria-current="page"[^>]*>[\\s\\S]{0,80}${name}`).test(a.html());
const errorOf = (a) => txt((a.html().match(/<div class="err-box"[\s\S]*?<\/div>|<p class="err"[^>]*>[\s\S]*?<\/p>/) || [''])[0]);

// Runs a case from upload to the employee page. Returns what happened at each stage.
async function run(uploads, opts = {}) {
  const a = makeApp();
  for (const [slot, files] of uploads) await a.upload(slot, files);
  const out = { a, start: a.html() };
  out.error = errorOf(a);
  if (!/data-act="to-check"/.test(a.html())) { out.stage = 'start'; return out; }
  a.click({ act: 'to-check' });
  if (opts.k) for (let i = 5; i < opts.k; i++) a.click({ act: 'k+' });
  out.check = a.html();
  if (/<button[^>]*data-act="analyse"[^>]*disabled/.test(out.check) || !/data-act="analyse"/.test(out.check)) { out.stage = 'check'; out.error = errorOf(a); return out; }
  a.click({ act: 'analyse' }); a.click({ act: 'skip-read' });
  out.results = a.html(); out.report = reportOf(a); out.stage = 'results';
  // Click through everything a user would.
  const first = (out.results.match(/data-act="toggle-fa" data-id="([^"]+)"/) || [])[1];
  if (first) a.click({ act: 'toggle-fa', id: first });
  [...new Set([...out.results.matchAll(/data-act="lens" data-key="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"')))].forEach((k) => a.click({ act: 'lens', key: k }));
  const dim = (out.results.match(/data-act="glance" data-dim="([^"]+)"/) || [])[1];
  if (dim) a.click({ act: 'glance', dim });
  const th = (out.results.match(/data-act="theme" data-key="([^"]+)"/) || [])[1];
  if (th) { a.click({ act: 'theme', key: th }); a.click({ act: 'theme-all', key: th }); }
  a.click({ go: 'release' }); a.click({ act: 'release' }); a.click({ act: 'release-now' });
  out.released = /Released/.test(a.html());
  a.click({ go: 'follow' });
  const id = (a.html().match(/data-act="compose" data-id="([^"]+)"/) || [])[1];
  if (id) { a.click({ act: 'compose', id }); a.click({ act: 'fill-example', id }); a.submit({ form: 'respond', id }); out.responded = /What we heard|First step|Edit response/.test(a.html()); }
  a.click({ act: 'preview', k: 'employees' }); out.employee = a.sheet();
  if (/Department heads/.test(a.html())) a.click({ act: 'preview', k: 'dept' });
  out.crashed = /Something went wrong on this screen/.test(a.html());
  out.final = a.html();
  return out;
}

// ---------------------------------------------------------------- Test helpers
let pass = 0, fail = 0;
const failures = [];
function check(name, ok, extra = '') { if (ok) pass++; else { fail++; failures.push(name); } console.log(`  ${ok ? '✓' : '✗'} ${name}${!ok && extra ? '  [' + String(extra).slice(0, 300) + ']' : ''}`); }
const bytes = (s) => new TextEncoder().encode(s);
const file = (name, b) => ({ name, bytes: typeof b === 'string' ? bytes(b) : b });
const noBadText = (h) => !/\bNaN\b|\bundefined\b|\bInfinity\b|\[object Object\]/.test(txt(h));

// ---------------------------------------------------------------- Kumo in many formats
await import(path.join(SRC, 'data.js'));
const D = globalThis.VB_DATA;
const { rows: KR, headcount: KH } = D.generate();
const KS = D.toCSV(KR), KHC = D.toCSV(KH);
const HEAD = Object.keys(KR[0]);
const L = ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'];
const isQ = (k) => /^[A-Z]\d \[/.test(k);
const withAnswers = (fn) => D.toCSV(KR.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, isQ(k) ? fn(L.indexOf(v) + 1, v) : v]))));
const delim = (csv, d) => csv.split('\n').map((line) => { let q = false, o = ''; for (const c of line) { if (c === '"') q = !q; o += !q && c === ',' ? d : c; } return o; }).join('\n');
const utf16 = (s, bom = true) => { const b = new Uint8Array((s.length + (bom ? 1 : 0)) * 2); let o = 0; if (bom) { b[0] = 0xff; b[1] = 0xfe; o = 2; } for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); b[o++] = c & 255; b[o++] = c >> 8; } return b; };
const cp1252 = (s) => Uint8Array.from([...s].map((c) => ({ '’': 0x92, '‘': 0x91, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97, 'é': 0xe9 }[c] ?? c.charCodeAt(0))));

// A minimal Excel writer (shared strings, as Excel itself saves), used to test the reader.
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(files) {
  const parts = [], central = []; let off = 0;
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content), comp = zlib.deflateRawSync(data), nb = Buffer.from(name), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nb.length, 26);
    parts.push(lh, nb, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, nb); off += 30 + nb.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...parts, cd, end]));
}
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function xlsx(sheets) {
  const strings = [], idx = new Map();
  const si = (s) => { if (!idx.has(s)) { idx.set(s, strings.length); strings.push(s); } return idx.get(s); };
  const col = (i) => { let s = ''; i++; while (i) { s = String.fromCharCode(65 + ((i - 1) % 26)) + s; i = Math.floor((i - 1) / 26); } return s; };
  const files = { '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>', '_rels/.rels': '<?xml version="1.0"?><Relationships/>' };
  files['xl/workbook.xml'] = `<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`;
  files['xl/_rels/workbook.xml.rels'] = `<?xml version="1.0"?><Relationships>${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`;
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = `<?xml version="1.0"?><worksheet><sheetData>${s.rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => (v === '' || v == null ? '' : typeof v === 'number' ? `<c r="${col(ci)}${ri + 1}"><v>${v}</v></c>` : `<c r="${col(ci)}${ri + 1}" t="s"><v>${si(String(v))}</v></c>`)).join('')}</row>`).join('')}</sheetData></worksheet>`;
  });
  files['xl/sharedStrings.xml'] = `<?xml version="1.0"?><sst>${strings.map((s) => `<si><t xml:space="preserve">${xmlEsc(s)}</t></si>`).join('')}</sst>`;
  return zip(files);
}
const asRows = (objs) => [Object.keys(objs[0]), ...objs.map((o) => Object.values(o))];

console.log('\nPart 1 – correct files in every format give the same report as the Kumo sample');
const base = makeApp();
base.click({ act: 'sample' }); base.click({ act: 'analyse' }); base.click({ act: 'skip-read' });
const BASE = reportOf(base);
check('The built-in Kumo sample produces a report', JSON.parse(BASE).focus.length === 3, BASE);

const lines = KS.split('\n');
const qualtricsHead = HEAD.map((h, i) => `Q${i + 1}`).join(',');
const VALID = [
  ['CSV, commas, Unix line endings', [['resp', [file('kumo.csv', KS)]], ['hc', [file('hc.csv', KHC)]]]],
  ['CSV with Windows line endings and a byte-order mark', [['resp', [file('kumo.csv', '﻿' + KS.replace(/\n/g, '\r\n'))]], ['hc', [file('hc.csv', KHC.replace(/\n/g, '\r\n'))]]]],
  ['CSV with old Mac line endings', [['resp', [file('kumo.csv', KS.replace(/\n/g, '\r'))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Semicolons (Excel on a South African computer)', [['resp', [file('kumo.csv', delim(KS, ';'))]], ['hc', [file('hc.csv', delim(KHC, ';'))]]]],
  ['Tabs', [['resp', [file('kumo.tsv', delim(KS, '\t'))]], ['hc', [file('hc.tsv', delim(KHC, '\t'))]]]],
  ['Pipes', [['resp', [file('kumo.txt', delim(KS, '|'))]], ['hc', [file('hc.csv', KHC)]]]],
  ['UTF-16 with a byte-order mark (Excel "Unicode text")', [['resp', [file('kumo.txt', utf16(delim(KS, '\t')))]], ['hc', [file('hc.csv', KHC)]]]],
  ['UTF-16 without a byte-order mark', [['resp', [file('kumo.txt', utf16(delim(KS, '\t'), false))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Windows-1252 (Excel "CSV" on Windows)', [['resp', [file('kumo.csv', cp1252(KS))]], ['hc', [file('hc.csv', cp1252(KHC))]]]],
  ['Title lines above the column names', [['resp', [file('kumo.csv', 'Kumo Logistics Employee Survey\nExported 30 September 2026\n\n' + KS)]], ['hc', [file('hc.csv', KHC)]]]],
  ['Qualtrics layout (codes, question row, ImportId row)', [['resp', [file('kumo.csv', [qualtricsHead, lines[0], HEAD.map((h, i) => `"{""ImportId"":""QID${i}""}"`).join(','), ...lines.slice(1)].join('\n'))]], ['hc', [file('hc.csv', KHC)]]]],
  ['SurveyMonkey second heading row', [['resp', [file('kumo.csv', [lines[0], HEAD.map(() => 'Response').join(','), ...lines.slice(1)].join('\n'))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Answers as numbers 1–5', [['resp', [file('kumo.csv', withAnswers((n) => String(n)))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Answers coded 0–4', [['resp', [file('kumo.csv', withAnswers((n) => String(n - 1)))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Answers as "4.0"', [['resp', [file('kumo.csv', withAnswers((n) => n + '.0'))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Answers as "5 - Strongly agree"', [['resp', [file('kumo.csv', withAnswers((n, v) => `${n} - ${v}`))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Answers as "Strongly agree (5)"', [['resp', [file('kumo.csv', withAnswers((n, v) => `${v} (${n})`))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Qualtrics wording (Somewhat agree / Somewhat disagree)', [['resp', [file('kumo.csv', withAnswers((n) => ['Strongly disagree', 'Somewhat disagree', 'Neither agree nor disagree', 'Somewhat agree', 'Strongly agree'][n - 1]))]], ['hc', [file('hc.csv', KHC)]]]],
  ['"Agree strongly" wording', [['resp', [file('kumo.csv', withAnswers((n, v) => ({ 5: 'Agree strongly', 1: 'Disagree strongly' }[n] || v)))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Lower case with stray spaces', [['resp', [file('kumo.csv', withAnswers((n, v) => `  ${v.toLowerCase()} `))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Afrikaans answers', [['resp', [file('kumo.csv', withAnswers((n) => ['Stem glad nie saam nie', 'Stem nie saam nie', 'Neutraal', 'Stem saam', 'Stem volkome saam'][n - 1]))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Words and numbers mixed between questions', [['resp', [file('kumo.csv', withAnswers((n, v) => (Math.random() < 0.5 ? String(n) : v)))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Comments with line breaks, commas and quote marks', [['resp', [file('kumo.csv', D.toCSV(KR.map((r, i) => (i % 5 ? r : { ...r, 'Is there anything else you want leadership to hear?': (r['Is there anything else you want leadership to hear?'] ? r['Is there anything else you want leadership to hear?'] + '\nAlso: shifts, overtime, "transport".' : '') }))))]], ['hc', [file('hc.csv', KHC)]]]],
  ['A "Total" row and blank lines at the end', [['resp', [file('kumo.csv', KS + '\n\nTotal,,,,,,\n\n')]], ['hc', [file('hc.csv', KHC + '\n\n')]]]],
  ['Empty trailing columns', [['resp', [file('kumo.csv', lines.map((l) => l + ',,').join('\n'))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Headcount uploaded before the survey', [['hc', [file('hc.csv', KHC)]], ['resp', [file('kumo.csv', KS)]]]],
  ['Survey and headcount dropped together (headcount first)', [['drop', [file('hc.csv', KHC), file('kumo.csv', KS)]]]],
  ['Survey and headcount chosen together in the file picker', [['resp', [file('kumo.csv', KS), file('hc.csv', KHC)]]]],
  ['Excel workbook with shared strings', [['resp', [file('kumo.xlsx', xlsx([{ name: 'Sheet1', rows: asRows(KR) }]))]], ['hc', [file('hc.xlsx', xlsx([{ name: 'Sheet1', rows: asRows(KH) }]))]]]],
  ['Excel workbook with answers stored as numbers', [['resp', [file('kumo_numbers.xlsx', fs.readFileSync(path.join(FX, 'edge/kumo_numbers.xlsx')))]], ['hc', [file('hc.csv', KHC)]]]],
  ['Microsoft Forms Excel export (dates, "anonymous" name column)', [['resp', [file('Kumo survey(1-388).xlsx', fs.readFileSync(path.join(FX, 'edge/kumo_microsoft_forms.xlsx')))]], ['hc', [file('hc.csv', KHC)]]]],
  ['VoiceBridge Excel template filled in (survey and headcount in one workbook)', [['resp', [file('kumo_in_template.xlsx', fs.readFileSync(path.join(FX, 'edge/kumo_in_template.xlsx')))]]]],
  ['Excel workbook with a title row and a notes sheet', [['resp', [file('kumo.xlsx', xlsx([{ name: 'Notes', rows: [['Survey run in September'], ['Do not edit']] }, { name: 'Responses', rows: [['Kumo survey export'], [], ...asRows(KR)] }]))]], ['hc', [file('hc.csv', KHC)]]]],
];
for (const [name, uploads] of VALID) {
  let r;
  try { r = await run(uploads); } catch (e) { check(name, false, 'threw: ' + e.message); continue; }
  const same = r.report === BASE;
  check(name, r.stage === 'results' && same && !r.crashed && r.released && r.responded !== false, r.stage !== 'results' ? `stopped at ${r.stage}: ${r.error}` : !same ? `report differs: ${r.report.slice(0, 250)}` : r.crashed ? 'safety net shown' : 'release or response failed');
}

console.log('\nPart 2 – broken or unusual files are read correctly with a note, or refused with a specific message');
const refuse = (re) => (r) => r.stage !== 'results' && re.test(r.error) && !/Something went wrong/.test(r.final || '');
const accept = (noteRe, extra = () => true) => (r) => r.stage === 'results' && !r.crashed && (!noteRe || noteRe.test(txt(r.check || ''))) && extra(r) && noBadText(r.results);
const ext = (r) => r.stage === 'results';
const BROKEN = [
  ['Empty file', [['resp', [file('a.csv', '')]]], refuse(/is empty/)],
  ['Only blank lines', [['resp', [file('a.csv', '\n \n\n')]]], refuse(/is empty/)],
  ['Column names but no answers', [['resp', [file('a.csv', lines[0] + '\n')]]], refuse(/no rows under its column names/)],
  ['No row of column names', [['resp', [file('a.csv', lines.slice(1).join('\n'))]]], refuse(/no row of column names/)],
  ['A PDF', [['resp', [file('report.pdf', '%PDF-1.7\n1 0 obj\n<< >>\n')]]], refuse(/is a PDF/)],
  ['A picture', [['resp', [file('photo.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 13]))]]], refuse(/is a picture/)],
  ['An old Excel 97–2003 file', [['resp', [file('old.xls', new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]))]]], refuse(/old-style Excel/)],
  ['A Word document (zip that is not a workbook)', [['resp', [file('notes.docx', zip({ 'word/document.xml': '<w:document/>' }))]]], refuse(/isn’t a spreadsheet/)],
  ['A corrupt .xlsx', [['resp', [file('bad.xlsx', new Uint8Array([0x50, 0x4b, 3, 4, 1, 2, 3, 4, 5, 6]))]]], refuse(/isn’t a spreadsheet/)],
  ['A JSON file', [['resp', [file('export.json', JSON.stringify(KR.slice(0, 30)))]]], refuse(/JSON file/)],
  ['A web page', [['resp', [file('page.csv', '<!doctype html><html><body>Survey</body></html>')]]], refuse(/web page/)],
  ['Binary rubbish named .csv', [['resp', [file('a.csv', new Uint8Array(Array.from({ length: 3000 }, (_, i) => (i * 97) % 256)))]]], refuse(/can’t be read as text|No rating questions|looks damaged|has no row/)],
  ['An unclosed quote mark in row 40', [['resp', [file('a.csv', lines.map((l, i) => (i === 40 ? l.replace(',', ',"oops') : l)).join('\n'))]]], refuse(/looks damaged/)],
  ['A quote mark left open at the very end', [['resp', [file('a.csv', KS + '\nR1,"never closed,Operations')]]], refuse(/looks damaged/)],
  ['Many rows with too many values (unquoted commas)', [['resp', [file('a.csv', lines.map((l, i) => (i && i % 9 === 0 ? l + ',extra,values' : l)).join('\n'))]]], refuse(/looks damaged/)],
  ['A few rows with an extra value', [['resp', [file('a.csv', lines.map((l, i) => (i === 7 || i === 90 ? l + ',stray' : l)).join('\n'))]]], accept(/extra values after the last column/)],
  ['Rows cut short', [['resp', [file('a.csv', lines.map((l, i) => (i && i % 13 === 0 ? l.split(',').slice(0, 14).join(',') : l)).join('\n'))]]], accept(/shorter than the header row/)],
  ['Two columns with the same name', [['resp', [file('a.csv', lines.map((l, i) => (i ? l : l.replace('F2 [Fairness & advancement] I have the same chance to advance as colleagues who perform as well as I do', 'F1 [Fairness & advancement] Promotions here go to the people who most deserve them'))).join('\n'))]]], accept(/renamed with “\(2\)”/)],
  ['Blank column names', [['resp', [file('a.csv', lines.map((l, i) => (i ? l : l.replace('Division,', ',').replace('Team,', ','))).join('\n'))]]], accept(/have no name/)],
  ['1–7 scale', [['resp', [file('a.csv', withAnswers((n) => String([1, 2, 4, 6, 7][n - 1])))]]], refuse(/uses a 1–7 scale/)],
  ['0–10 scale', [['resp', [file('a.csv', withAnswers((n) => String([0, 2, 5, 8, 10][n - 1])))]]], refuse(/uses a 0–10 scale/)],
  ['Yes/no questions', [['resp', [file('a.csv', withAnswers((n) => (n >= 4 ? 'Yes' : 'No')))]]], refuse(/yes\/no questions/)],
  ['Averages instead of answers', [['resp', [file('a.csv', withAnswers((n) => (n - 0.5 + Math.random()).toFixed(1)))]]], refuse(/averages/)],
  ['Emoji instead of answers', [['resp', [file('a.csv', withAnswers((n) => ['😡', '🙁', '😐', '🙂', '😀'][n - 1]))]]], refuse(/No rating questions/)],
  ['A few typos in the answers ("6", "Agre")', [['resp', [file('a.csv', withAnswers((n, v) => { const x = Math.random(); return x < 0.02 ? '6' : x < 0.04 ? 'Agre' : v; }))]], ['hc', [file('hc.csv', KHC)]]], accept(/couldn’t be read as a point on the scale/, (r) => /15 rating questions/.test(txt(r.check)))],
  ['One question mostly unreadable', [['resp', [file('a.csv', D.toCSV(KR.map((r, i) => ({ ...r, 'F1 [Fairness & advancement] Promotions here go to the people who most deserve them': i % 3 ? 'Agre' : r['F1 [Fairness & advancement] Promotions here go to the people who most deserve them'] }))))]]], refuse(/too many answers VoiceBridge can’t read/)],
  ['A theme nobody answered', [['resp', [file('a.csv', D.toCSV(KR.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, /\[Growth\]/.test(k) ? '' : v])))))]]], accept(/no answers at all and were left out/)],
  ['Lots of N/A and Don’t know answers', [['resp', [file('a.csv', withAnswers((n, v) => (Math.random() < 0.3 ? ['N/A', 'Don’t know', 'Prefer not to say'][n % 3] : v)))]]], accept(null)],
  ['Everyone gave the same answer', [['resp', [file('a.csv', withAnswers(() => 'Agree'))]]], accept(null, (r) => /Nothing stands out/.test(txt(r.results)))],
  ['Only one rating question', [['resp', [file('a.csv', D.toCSV(KR.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !isQ(k) || k.startsWith('F1 '))))))]]], accept(null)],
  ['Gender written "female", "FEMALE " and "Female"', [['resp', [file('a.csv', D.toCSV(KR.map((r, i) => ({ ...r, Gender: r.Gender === 'Woman' ? ['female', 'FEMALE ', 'Female'][i % 3] : r.Gender }))))]]], accept(/treated as the same group/)],
  ['Gender written "F" and "Female"', [['resp', [file('a.csv', D.toCSV(KR.map((r, i) => ({ ...r, Gender: r.Gender === 'Woman' ? (i % 2 ? 'F' : 'Female') : r.Gender }))))]]], accept(/mixes short codes \(“F”\) with full labels.*“F” may mean “Female”/)],
  ['Gender written "F" and "Woman"', [['resp', [file('a.csv', D.toCSV(KR.map((r, i) => ({ ...r, Gender: r.Gender === 'Woman' ? (i % 2 ? 'F' : 'Woman') : r.Gender }))))]]], accept(/mixes short codes \(“F”\) with full labels/)],
  ['No grouping columns at all', [['resp', [file('a.csv', D.toCSV(KR.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => isQ(k))))))]]], accept(/no columns to group people by/)],
  ['No comment columns', [['resp', [file('a.csv', D.toCSV(KR.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !/\?$/.test(k))))))]]], accept(null)],
  ['Script and HTML inside answers, comments and column names', [['resp', [file('a.csv', D.toCSV(KR.map((r, i) => { const o = {}; for (const [k, v] of Object.entries(r)) o[k === 'Team' ? 'Team<img src=x onerror=alert(1)>' : k] = k === 'Department' && i % 3 === 0 ? '<script>alert(1)</script>' : /\?$/.test(k) && i % 4 === 0 ? '<b>x</b><script>alert(2)</script>' : v; return o; })))]]], accept(null, (r) => !/<script[\s>]|<img[^>]+onerror=|<b>x<\/b>/i.test(r.final + r.results + r.check))],
  ['A 60,000-character comment', [['resp', [file('a.csv', D.toCSV(KR.map((r, i) => (i === 3 ? { ...r, 'Is there anything else you want leadership to hear?': 'The canteen is fine but '.repeat(2500) } : r))))]]], accept(null)],
  ['20,000 rows (the same people exported many times)', [['resp', [file('a.csv', [lines[0], ...Array.from({ length: 52 }, () => lines.slice(1)).flat().slice(0, 20000)].join('\n'))]]], accept(/exact duplicates?/i)],
  ['19 responses', [['resp', [file('a.csv', lines.slice(0, 20).join('\n'))]]], refuse(/only 19 responses/)],
  ['Exactly 20 responses', [['resp', [file('a.csv', lines.slice(0, 21).join('\n'))]]], accept(null)],
  ['Headcount box given the survey file (refused; the survey stays loaded without a headcount)', [['resp', [file('kumo.csv', KS)]], ['hc', [file('kumo.csv', KS)]]], (r) => /looks like a survey file, not a headcount/.test(r.error) && !/Matched to/.test(txt(r.check || ''))],
  ['Headcount with no people in it (refused)', [['resp', [file('kumo.csv', KS)]], ['hc', [file('hc.csv', Object.keys(KH[0]).join(',') + '\n')]]], (r) => /no rows under its column names|no people/.test(r.error) && !/Matched to/.test(txt(r.check || ''))],
  ['A broken survey, then a headcount: the survey’s message stays on screen', [['resp', [file('a.csv', withAnswers((n) => String([1, 2, 4, 6, 7][n - 1])))]], ['hc', [file('hc.csv', KHC)]]], refuse(/uses a 1–7 scale/)],
  ['Headcount using F and M while the survey says Woman and Man', [['resp', [file('kumo.csv', KS)]], ['hc', [file('hc.csv', D.toCSV(KH.map((h) => ({ ...h, Gender: h.Gender[0] }))))]]], refuse(/headcount doesn’t match/)],
  ['Out-of-date headcount (fewer people than responded)', [['resp', [file('kumo.csv', KS)]], ['hc', [file('hc.csv', D.toCSV(KH.slice(0, 200)))]]], refuse(/headcount doesn’t match/)],
  ['Two different surveys dropped together', [['drop', [file('a.csv', KS), file('b.csv', lines.slice(0, 120).join('\n'))]]], refuse(/More than one survey/)],
  ['Three files dropped together', [['drop', [file('a.csv', KS), file('b.csv', KHC), file('c.csv', KHC)]]], refuse(/Too many files/)],
  ['Two headcounts and no survey dropped together', [['drop', [file('b.csv', KHC), file('c.csv', KHC)]]], refuse(/None of those files has survey answers/)],
  ['Only a headcount dropped in the survey box', [['resp', [file('hc.csv', KHC)]]], refuse(/No rating questions.*headcount/)],
];
for (const [name, uploads, expect] of BROKEN) {
  let r;
  try { r = await run(uploads); } catch (e) { check(name, false, 'threw: ' + e.message); continue; }
  check(name, expect(r) && !r.crashed, `stage=${r.stage}; message=${r.error || '(none)'}`);
}

console.log('\nPart 3 – behaviour after the upload');
{
  // A blank leader response is not published.
  const a = makeApp();
  a.click({ act: 'sample' }); a.click({ act: 'analyse' }); a.click({ act: 'skip-read' });
  a.click({ go: 'release' }); a.click({ act: 'release' }); a.click({ act: 'release-now' });
  a.click({ go: 'follow' });
  const id = (a.html().match(/data-act="compose" data-id="([^"]+)"/) || [])[1];
  a.click({ act: 'compose', id });
  a.field('#r-heard').value = '   '; a.field('#r-first').value = ' \n '; a.field('#r-when').value = '';
  a.submit({ form: 'respond', id });
  check('A response made only of spaces is not published', /Write what you heard and what you’ll do first/.test(a.html()) && !/Plan shared<\/span>/.test(a.sheet()) && !JSON.stringify(a.store).includes('"status":"plan"'));
  a.field('#r-heard').value = 'We heard you.'; a.field('#r-first').value = 'We will review appointments by 30 November.';
  a.submit({ form: 'respond', id });
  check('A real response is published', JSON.stringify(a.store).includes('We will review appointments'));

  // Release locks the settings it was made with.
  a.click({ act: 'home' }); a.click({ act: 'to-check' });
  const before = (a.html().match(/id="k-out">(\d+)</) || [])[1];
  a.click({ act: 'k+' }); a.click({ act: 'k+' }); a.click({ act: 'to-check' });
  const after = (a.html().match(/id="k-out">(\d+)</) || [])[1];
  check('After release, the anonymity threshold can’t be changed', before === '5' && after === '5' && /settings locked/.test(a.html()) && /data-act="k\+"[^>]*disabled/.test(a.html()));
  a.click({ act: 'unrelease' }); a.click({ act: 'unrelease-yes' });
  a.click({ act: 'k+' }); a.click({ act: 'to-check' });
  check('“Start a new release” removes the release and unlocks the settings', !/settings locked/.test(a.html()) && (a.html().match(/id="k-out">(\d+)</) || [])[1] === '6');
}
{
  // Saved state belongs to the exact file: a different survey with the same size and name doesn't inherit a release.
  const a = makeApp();
  await a.upload('resp', [file('kumo.csv', KS)]);
  a.click({ act: 'to-check' }); a.click({ act: 'analyse' }); a.click({ act: 'skip-read' });
  a.click({ go: 'release' }); a.click({ act: 'release' }); a.click({ act: 'release-now' });
  const changed = withAnswers((n, v) => (n === 5 ? 'Agree' : v));
  await a.upload('resp', [file('kumo.csv', changed)]);
  a.click({ act: 'to-check' });
  check('A different file with the same name and size does not inherit the earlier release', !/settings locked/.test(a.html()));
  await a.upload('resp', [file('kumo.csv', KS)]);
  a.click({ act: 'to-check' });
  check('Uploading the original file again brings its release back', /settings locked/.test(a.html()));
}
{
  // The safety net: an unexpected error shows a plain message instead of a blank or frozen page.
  const a = makeApp();
  a.click({ act: 'sample' }); a.click({ act: 'analyse' }); a.click({ act: 'skip-read' });
  a.click({ act: 'drill', dim: 'trust', filter: 'not valid' });
  check('An unexpected error shows a plain message with a way back', /Something went wrong on this screen/.test(a.html()) && /data-act="home"/.test(a.html()));
  a.click({ act: 'home' });
  check('…and “Go back to the start” works, with the files still loaded', /Try it with Kumo/.test(a.html()) && /data-act="to-check"/.test(a.html()));
  a.winError(new Error('simulated'));
  check('Errors outside a click are caught too', /Something went wrong on this screen/.test(a.html()));
}
{
  // Removing a file and choosing another works without reloading the page.
  const a = makeApp();
  await a.upload('resp', [file('broken.csv', lines.slice(1).join('\n'))]);
  const refused = /no row of column names/.test(errorOf(a));
  await a.upload('resp', [file('kumo.csv', KS)]);
  check('After a refused file, a good file can be uploaded straight away', refused && !errorOf(a) && /388 responses/.test(txt(a.html())));
  a.click({ act: 'remove-file', k: 'responses' });
  check('The survey file can be removed', !/data-act="to-check"/.test(a.html()));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) console.log('Failed:\n - ' + failures.join('\n - '));
process.exit(fail ? 1 : 0);
