/* VoiceBridge intake: turns whatever file someone uploads into a clean table, or a clear explanation.
 *
 * Added 21 October 2026 after an edge-case sweep: 75 deliberately awkward files were run through the app.
 * The app never crashed, but 12 files produced a believable report from data it had misread, without
 * saying so (e.g. one unclosed quote mark made it read 39 people instead of 388). The rule now is:
 *
 *   1. If a change to the file is safe and unambiguous, make it and list it on the Check screen.
 *   2. If the file can't be read correctly, stop and say exactly what to change, naming the row or column.
 *   3. Never drop or reinterpret data without saying so.
 *
 * Everything here runs in the browser; nothing is uploaded. The statistics in engine.js are unchanged:
 * intake only hands them a clean table.
 */
(function (root) {
  // ---------------------------------------------------------------- Errors
  // Every refusal is { title, detail, fix }: what happened, why it matters, and what to do.
  function fail(title, detail, fix, code) { return { ok: false, error: { title, detail, fix, code } }; }

  // ---------------------------------------------------------------- File type
  function startsWith(b, sig) { return sig.every((x, i) => b[i] === x); }
  function sniff(b) {
    if (b.length === 0) return 'empty';
    if (startsWith(b, [0x50, 0x4b, 0x03, 0x04])) return 'zip';
    if (startsWith(b, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
    if (startsWith(b, [0xd0, 0xcf, 0x11, 0xe0])) return 'ole';   // Excel 97–2003 (.xls) or old Word
    if (startsWith(b, [0x89, 0x50, 0x4e, 0x47]) || startsWith(b, [0xff, 0xd8, 0xff]) || startsWith(b, [0x47, 0x49, 0x46])) return 'image';
    return 'text';
  }

  // ---------------------------------------------------------------- Text encoding
  // Excel on Windows saves "CSV" in Windows-1252 and "Unicode text" in UTF-16; most tools use UTF-8.
  function decode(b) {
    if (startsWith(b, [0xef, 0xbb, 0xbf])) return { text: new TextDecoder('utf-8').decode(b.subarray(3)), encoding: 'utf-8' };
    if (startsWith(b, [0xff, 0xfe])) return { text: new TextDecoder('utf-16le').decode(b.subarray(2)), encoding: 'utf-16' };
    if (startsWith(b, [0xfe, 0xff])) return { text: new TextDecoder('utf-16be').decode(b.subarray(2)), encoding: 'utf-16' };
    const n = Math.min(b.length, 4000);
    let odd = 0, even = 0;
    for (let i = 0; i < n; i++) if (b[i] === 0) (i % 2 ? odd++ : even++);
    if (odd > n * 0.2) return { text: new TextDecoder('utf-16le').decode(b), encoding: 'utf-16' };
    if (even > n * 0.2) return { text: new TextDecoder('utf-16be').decode(b), encoding: 'utf-16' };
    try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(b), encoding: 'utf-8' }; }
    catch (e) { return { text: new TextDecoder('windows-1252').decode(b), encoding: 'windows-1252' }; }
  }

  // ---------------------------------------------------------------- Delimited text (CSV, semicolons, tabs, pipes)
  function chooseDelimiter(text) {
    const lines = []; let q = false, cur = '';
    for (let i = 0; i < text.length && lines.length < 12; i++) {
      const c = text[i];
      if (c === '"') q = !q;
      if (!q && (c === '\n' || c === '\r')) { if (cur.trim()) lines.push(cur); cur = ''; } else cur += c;
    }
    if (cur.trim() && lines.length < 12) lines.push(cur);
    const count = (l, d) => { let n = 0, qq = false; for (const c of l) { if (c === '"') qq = !qq; else if (!qq && c === d) n++; } return n; };
    let best = ',', bestScore = -1;
    for (const d of [',', ';', '\t', '|']) {
      const counts = lines.map((l) => count(l, d)).sort((a, b) => a - b);
      const median = counts.length ? counts[Math.floor(counts.length / 2)] : 0;
      if (median > bestScore) { best = d; bestScore = median; }
    }
    return best;
  }

  // Quotes only open a cell when they are its first character (as in Excel); a quote inside a cell is kept as text.
  function parseDelimited(text) {
    text = text.replace(/^﻿/, '');
    const delim = chooseDelimiter(text);
    const rows = []; const lineOf = [];
    let row = [], cell = '', q = false, cellStart = true, line = 1, rowLine = 1, quoteLine = 0;
    const multiline = []; // quoted cells that contain line breaks: { line, maxDelims }
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else {
            q = false;
            if (cell.includes('\n')) multiline.push({ line: quoteLine, maxDelims: Math.max(...cell.split('\n').map((l) => l.split(delim).length - 1)) });
          }
        }
        else { if (c === '\n') line++; cell += c; }
        continue;
      }
      if (c === '"' && cellStart) { q = true; quoteLine = line; cellStart = false; continue; }
      if (c === delim) { row.push(cell); cell = ''; cellStart = true; continue; }
      if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = ''; cellStart = true;
        if (row.length > 1 || row[0] !== '') { rows.push(row); lineOf.push(rowLine); }
        row = []; line++; rowLine = line;
        continue;
      }
      cell += c; cellStart = false;
    }
    if (q) return { unclosedQuoteLine: quoteLine };
    if (cell !== '' || row.length) { row.push(cell); if (row.length > 1 || row[0] !== '') { rows.push(row); lineOf.push(rowLine); } }
    return { rows, lineOf, delim, multiline };
  }

  // ---------------------------------------------------------------- Excel (.xlsx), read without any library
  // An .xlsx file is a zip of XML files. The browser's built-in DecompressionStream does the unzipping.
  async function inflate(data) {
    const ds = new DecompressionStream('deflate-raw');
    const out = await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(out);
  }
  async function unzip(b) {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let eocd = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('not a zip');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = {};
    const utf8 = new TextDecoder('utf-8');
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('bad zip directory');
      const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true);
      const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), commentLen = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const name = utf8.decode(b.subarray(p + 46, p + 46 + nameLen));
      const lNameLen = dv.getUint16(local + 26, true), lExtraLen = dv.getUint16(local + 28, true);
      const start = local + 30 + lNameLen + lExtraLen;
      files[name] = { method, data: b.subarray(start, start + size) };
      p += 46 + nameLen + extraLen + commentLen;
    }
    return {
      names: Object.keys(files),
      async text(name) {
        const f = files[name]; if (!f) return null;
        const raw = f.method === 0 ? f.data : f.method === 8 ? await inflate(f.data) : null;
        if (!raw) throw new Error('unsupported compression');
        return utf8.decode(raw);
      },
    };
  }
  const XML_ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const unxml = (s) => s.replace(/&(amp|lt|gt|quot|apos|#x[0-9a-f]+|#\d+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : XML_ENT[e.toLowerCase()]));
  const textOf = (xml) => unxml((xml.match(/<t(?:\s[^>]*)?>[\s\S]*?<\/t>|<t\s*\/>/g) || []).map((t) => t.replace(/<t(?:\s[^>]*)?>|<\/t>|<t\s*\/>/g, '')).join(''));
  const colIndex = (ref) => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

  async function readXlsx(b) {
    const z = await unzip(b);
    const wb = await z.text('xl/workbook.xml');
    if (!wb) return null;
    const rels = (await z.text('xl/_rels/workbook.xml.rels')) || '';
    const target = {};
    (rels.match(/<Relationship\b[^>]*>/g) || []).forEach((r) => { const id = (r.match(/\bId="([^"]+)"/) || [])[1], t = (r.match(/\bTarget="([^"]+)"/) || [])[1]; if (id && t) target[id] = t.replace(/^\/?xl\//, '').replace(/^\//, ''); });
    const sst = await z.text('xl/sharedStrings.xml');
    const shared = sst ? (sst.match(/<si>[\s\S]*?<\/si>|<si\/>/g) || []).map(textOf) : [];
    const sheets = [];
    for (const s of wb.match(/<sheet\b[^>]*>/g) || []) {
      const name = unxml((s.match(/\bname="([^"]*)"/) || [])[1] || 'Sheet');
      const rid = (s.match(/\br:id="([^"]+)"/) || s.match(/\bid="([^"]+)"/) || [])[1];
      const path = 'xl/' + (target[rid] || '');
      const xml = await z.text(path);
      if (!xml) continue;
      const rows = [];
      for (const r of xml.match(/<row\b[^>]*>[\s\S]*?<\/row>|<row\b[^>]*\/>/g) || []) {
        const cells = [];
        let next = 0;
        for (const c of r.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || []) {
          const ref = (c.match(/\br="([A-Z]+\d+)"/) || [])[1];
          const idx = ref ? colIndex(ref) : next;
          next = idx + 1;
          const t = (c.match(/\bt="([^"]+)"/) || [])[1];
          const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
          let val = '';
          if (t === 's') val = shared[+v] ?? '';
          else if (t === 'inlineStr') val = textOf((c.match(/<is>[\s\S]*?<\/is>/) || [''])[0]);
          else if (t === 'b') val = v === '1' ? 'TRUE' : 'FALSE';
          else if (v != null) val = unxml(v);
          if (/^-?\d+\.\d{9,}$/.test(val)) val = String(Math.round(+val * 1e6) / 1e6); // Excel float noise, e.g. 3.0000000001
          cells[idx] = val;
        }
        rows.push(Array.from(cells, (x) => x ?? ''));
      }
      sheets.push({ name, rows });
    }
    return sheets;
  }

  // ---------------------------------------------------------------- Answer reading
  // The same five points in the wordings real survey tools use. Applied before the engine sees the data.
  const WORDS = [
    [1, /^(strongly disagree|disagree strongly|totally disagree|completely disagree|very dissatisfied|stem glad nie saam nie|stem hoegenaamd nie saam nie|stem sterk nie saam nie)$/],
    [2, /^(disagree|somewhat disagree|mostly disagree|slightly disagree|tend to disagree|dissatisfied|stem nie saam nie)$/],
    [3, /^(neither agree nor disagree|neither agree or disagree|neither disagree nor agree|neutral|neither|unsure|undecided|not sure|neutraal|neither satisfied nor dissatisfied)$/],
    [4, /^(agree|somewhat agree|mostly agree|slightly agree|tend to agree|satisfied|stem saam)$/],
    [5, /^(strongly agree|agree strongly|totally agree|completely agree|very satisfied|stem volkome saam|stem sterk saam)$/],
  ];
  const NOT_ANSWERED = /^(n\/?a|not applicable|don['’]?t know|do not know|prefer not to (answer|say)|no answer|no opinion|-|–|—|\.|na|n\.a\.)$/i;
  // Returns { n } for a scale answer (n may be 0–10 at this point), { blank } for no answer, { decimal } for 3.5, or null if unreadable.
  function readAnswer(raw) {
    const v = String(raw ?? '').trim();
    if (!v) return { blank: true };
    if (NOT_ANSWERED.test(v)) return { blank: true };
    const low = v.toLowerCase().replace(/\s+/g, ' ').replace(/[.!]+$/, '');
    for (const [n, re] of WORDS) if (re.test(low)) return { n, word: true };
    const num = low.replace(',', '.');
    if (/^-?\d+(\.0+)?$/.test(num)) return { n: Math.round(+num) };
    if (/^\d+\.\d+$/.test(num)) return +num <= 10 ? { decimal: +num } : null;
    // "5 - Strongly agree", "5. Strongly agree", "(5) Strongly agree": only when the words are a scale answer,
    // so that "1–3 years" is not read as the answer 1.
    const isWord = (t) => WORDS.some(([, re]) => re.test(t.trim()));
    let m = low.match(/^\(?(\d{1,2})\)?\s*[-–:.)=]\s*(.+)$/);
    if (m && isWord(m[2])) return { n: +m[1], labelled: true };
    // "Strongly agree (5)", "Strongly agree - 5"
    m = low.match(/^(.+?)\s*[(\-–:=]\s*(\d{1,2})\)?$/);
    if (m && isWord(m[1])) return { n: +m[2], labelled: true };
    return null;
  }
  const YESNO = /^(yes|no|y|n|true|false|ja|nee)$/i;
  const PREFER = /prefer not|rather not|not to say|decline/i;

  // A short column name that describes people ("Gender", "Occupational level") is never a rating question,
  // even if it holds the numbers 1–4. A long question that happens to contain "team" still can be.
  const FIELD_NAME = /\b(gender|sex|race|ethnic|population group|age|level|grade|band|tenure|service|years|team|unit|shift|division|region|department|dept|site|branch|disab|id|number|no\.?|code|year|month|date|time|timestamp|start|end|completion|completed|submitted|duration|email|name)\b/i;
  const looksLikeField = (h) => FIELD_NAME.test(h) && h.trim().split(/\s+/).length <= 4 && !/\[[^\]]+\]/.test(h);
  const looksLikeQuestion = (h) => /\[[^\]]+\]/.test(h) || /\?$/.test(h.trim()) || h.trim().split(/\s+/).length >= 4;

  // ---------------------------------------------------------------- Table shape
  // Finds the header row (skipping titles above it), fixes blank and duplicate column names,
  // removes Qualtrics' and SurveyMonkey's extra heading rows, and reports rows of the wrong length.
  function shape(rows, lineOf, label) {
    const notes = [];
    const filled = (r) => r.filter((c) => String(c).trim() !== '').length;
    const top = rows.slice(0, 20);
    const maxW = Math.max(0, ...top.map(filled));
    if (!rows.length || maxW === 0) return fail(`${label} is empty`, 'There are no rows with any values in it.', 'Export the results again, with one row per person and the column names in the first row.');
    let h = top.findIndex((r) => filled(r) >= Math.max(2, Math.ceil(maxW * 0.6)));
    if (h < 0) h = 0;
    if (h > 0) notes.push(`Skipped ${h} line${h === 1 ? '' : 's'} above the column names (a title or notes).`);

    let header = rows[h].map((c) => String(c).trim());
    // Qualtrics: row 1 has short codes (Q1, Q2_1), row 2 the question wording, row 3 {"ImportId":...}.
    const importRow = rows[h + 2] && rows[h + 2].filter((c) => /^\{"?ImportId/i.test(String(c).trim())).length >= filled(rows[h + 2]) * 0.5 && filled(rows[h + 2]) > 0;
    let dataStart = h + 1;
    if (importRow) {
      header = rows[h + 1].map((c, i) => String(c).trim() || header[i]);
      dataStart = h + 3;
      notes.push('This is a Qualtrics export: the question wording in its second row was used as the column names, and its two extra heading rows were skipped.');
    } else if (rows[h + 1]) {
      // SurveyMonkey: a second heading row of labels such as "Response" or "Open-Ended Response".
      const r2 = rows[h + 1].map((c) => String(c).trim()).filter(Boolean);
      const labels = r2.filter((c) => /^(response|open-ended response|other \(please specify\)|answer)$/i.test(c));
      if (r2.length && labels.length >= r2.length * 0.5 && !r2.some((c) => readAnswer(c) && readAnswer(c).n)) {
        dataStart = h + 2;
        notes.push('Skipped a second heading row (as SurveyMonkey exports have).');
      }
    }

    // The first row should be names, not answers. If most of its cells look like answers, there is no header row.
    const headCells = header.filter(Boolean);
    const answerLike = headCells.filter((c) => { const a = readAnswer(c); return a && (a.word || a.labelled || a.decimal != null) || /^\d+(\.\d+)?$/.test(c); });
    if (headCells.length >= 3 && answerLike.length >= headCells.length * 0.5) {
      return fail(`${label} has no row of column names`, `The first row contains answers (${answerLike.slice(0, 3).map((x) => `“${x}”`).join(', ')}), so VoiceBridge can’t tell which column is which question.`, 'Add a first row with a name for every column (for example the question wording), then upload it again. The templates on the start page show the layout.');
    }

    // Blank and repeated column names.
    const blanks = [], dups = [];
    const seen = {};
    header = header.map((name, i) => {
      let n = name;
      if (!n) { n = `Column ${colName(i)}`; blanks.push(n); }
      const key = n.toLowerCase();
      if (seen[key]) { seen[key]++; const renamed = `${n} (${seen[key]})`; dups.push(`“${n}”`); return renamed; }
      seen[key] = 1;
      return n;
    });

    const body = rows.slice(dataStart).filter((r) => filled(r) > 0);
    if (!body.length) return fail(`${label} has no rows under its column names`, 'It has a row of column names but nothing under it.', 'Export the file again with one row per person, then upload it.');
    const lines = lineOf ? lineOf.slice(dataStart) : body.map((_, i) => i + dataStart + 1);
    const width = header.length;
    let short = 0;
    const long = [];
    body.forEach((r, i) => {
      if (r.length < width && filled(r) > 0) short++;
      if (r.length > width && r.slice(width).some((c) => String(c).trim() !== '')) long.push(lines[i]);
    });
    const used = header.map((_, i) => body.some((r) => String(r[i] ?? '').trim() !== ''));
    if (blanks.length) {
      const usedBlanks = header.filter((n, i) => blanks.includes(n) && used[i]);
      if (usedBlanks.length) notes.push(`${usedBlanks.length} column${usedBlanks.length === 1 ? ' has' : 's have'} no name, so ${usedBlanks.length === 1 ? 'it was' : 'they were'} called ${usedBlanks.map((n) => `“${n}”`).join(', ')}.`);
    }
    if (dups.length) notes.push(`Two columns share the name ${[...new Set(dups)].join(', ')}; the second was renamed with “(2)” so neither is lost.`);
    if (long.length > Math.max(2, body.length * 0.05)) {
      return fail(`${label} looks damaged`, `${long.length} rows have more values than there are column names, starting at line ${long[0]}. This usually means an answer containing a comma or a line break was saved without quote marks, so the answers have shifted into the wrong columns.`, 'Export the file again from your survey tool rather than copying and pasting it. If you edited it, save it from Excel as “CSV UTF-8”.');
    }
    if (long.length) notes.push(`${long.length} row${long.length === 1 ? '' : 's'} (line${long.length === 1 ? '' : 's'} ${long.slice(0, 5).join(', ')}) had extra values after the last column; those extra values were ignored.`);
    if (short && short < body.length) notes.push(`${short} row${short === 1 ? ' was' : 's were'} shorter than the header row; the missing cells at the end were treated as unanswered.`);

    const objects = body.map((r) => Object.fromEntries(header.map((name, i) => [name, String(r[i] ?? '').trim()])));
    return { ok: true, headers: header, rows: objects, notes };
  }
  function colName(i) { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

  // ---------------------------------------------------------------- Reading a file
  // Returns { ok, sheets: [{ name, headers, rows, notes }], format } or { ok: false, error }.
  async function read(input, name = 'This file') {
    const label = `“${name}”`;
    let bytes;
    if (typeof input === 'string') bytes = null;
    else bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const kind = bytes ? sniff(bytes) : input.length ? 'text' : 'empty';
    if (kind === 'empty') return fail(`${label} is empty`, 'The file has nothing in it.', 'Export the results again from your survey tool.');
    if (kind === 'pdf') return fail(`${label} is a PDF`, 'A PDF is a printed report. VoiceBridge needs the individual answers, one row per person, to work out its own figures.', 'In your survey tool, look for “Export responses” or “Download data” and choose CSV or Excel.');
    if (kind === 'image') return fail(`${label} is a picture`, 'VoiceBridge can only read survey answers from a CSV or Excel file.', 'Export the responses from your survey tool as CSV or Excel.');
    if (kind === 'ole') return fail(`${label} is an old-style Excel or Word file`, 'Files saved in the Excel 97–2003 format (.xls) can’t be read in the browser.', 'Open it in Excel and choose File → Save As → “Excel Workbook (.xlsx)” or “CSV UTF-8”, then upload that.');
    if (kind === 'zip') {
      let sheets;
      try { sheets = await readXlsx(bytes); } catch (e) { sheets = null; }
      if (!sheets) return fail(`${label} isn’t a spreadsheet VoiceBridge can read`, 'It is a compressed file (such as a Word document or a .zip), not an Excel workbook or CSV.', 'Upload the survey export itself, as CSV or Excel (.xlsx).');
      const out = [];
      for (const s of sheets) {
        if (!s.rows.some((r) => r.some((c) => String(c).trim()))) continue;
        const t = shape(s.rows, null, sheets.length > 1 ? `The “${s.name}” sheet` : label);
        if (t.ok) out.push({ name: s.name, headers: t.headers, rows: t.rows, notes: t.notes });
        else if (sheets.length === 1) return t;
      }
      if (!out.length) return fail(`${label} has no data`, 'Every sheet in the workbook is empty.', 'Check you saved the file after pasting in the responses.');
      return { ok: true, format: 'xlsx', sheets: out };
    }
    const dec = bytes ? decode(bytes) : { text: input, encoding: 'text' };
    const text = dec.text.replace(/^﻿/, '');
    const trimmed = text.trim();
    if (!trimmed) return fail(`${label} is empty`, 'The file only contains blank lines.', 'Export the results again from your survey tool.');
    if (/^[[{]/.test(trimmed)) { try { JSON.parse(trimmed); return fail(`${label} is a JSON file`, 'VoiceBridge reads survey exports in CSV or Excel format.', 'Export the responses from your survey tool as CSV or Excel instead.'); } catch (e) { /* not JSON, carry on */ } }
    if (/^<(\?xml|!doctype|html)/i.test(trimmed)) return fail(`${label} is a web page or XML file`, 'VoiceBridge reads survey exports in CSV or Excel format.', 'Export the responses from your survey tool as CSV or Excel instead.');
    if (/^\{\\rtf/.test(trimmed)) return fail(`${label} is a Word-style text document`, 'VoiceBridge reads survey exports in CSV or Excel format.', 'Export the responses from your survey tool as CSV or Excel instead.');
    if ((text.match(/�/g) || []).length > Math.max(20, text.length * 0.02)) return fail(`${label} can’t be read as text`, 'Most of it is unreadable characters, so it is probably not a CSV file even if its name ends in .csv.', 'Export the responses from your survey tool as CSV or Excel.');
    const p = parseDelimited(text);
    if (p.unclosedQuoteLine) return fail(`${label} looks damaged`, `A quote mark on line ${p.unclosedQuoteLine} is never closed, so everything after it would be read as one long answer.`, `Open the file, find line ${p.unclosedQuoteLine}, and remove the stray " or add the closing one. Exporting the file again from your survey tool usually fixes it.`);
    // A stray quote mark can swallow the following rows into one long "answer". A real multi-line comment
    // doesn't contain a whole row's worth of column separators on one of its lines.
    const width = p.rows.length ? Math.max(...p.rows.slice(0, 5).map((r) => r.length)) : 0;
    const swallowed = (p.multiline || []).find((m) => m.maxDelims >= Math.max(3, (width - 1) * 0.5));
    if (swallowed) return fail(`${label} looks damaged`, `A quote mark on line ${swallowed.line} is not closed where it should be, so the rows after it run together into one answer.`, `Open the file, find line ${swallowed.line}, and remove the stray " or add the closing one. Exporting the file again from your survey tool usually fixes it.`);
    const t = shape(p.rows, p.lineOf, label);
    if (!t.ok) return t;
    if (dec.encoding === 'utf-16') t.notes.unshift('The file was saved as “Unicode text” (UTF-16); it was read correctly.');
    if (dec.encoding === 'windows-1252') t.notes.unshift('The file was saved in an older Windows text format; accented letters were read correctly.');
    if (p.delim !== ',' && p.delim !== ';' && p.delim !== '\t') t.notes.unshift('Columns are separated by “|” rather than commas; that was handled.');
    return { ok: true, format: 'csv', sheets: [{ name, headers: t.headers, rows: t.rows, notes: t.notes }] };
  }

  // ---------------------------------------------------------------- Preparing a survey
  // Finds the rating questions, puts every answer on the same 1–5 scale, and tidies group labels.
  // Returns { ok, headers, rows, notes, warnings } or { ok: false, error }.
  function prepareSurvey(sheet, label = 'This file') {
    const { headers } = sheet;
    let rows = sheet.rows.map((r) => ({ ...r }));
    const notes = [...(sheet.notes || [])];
    const warnings = [];
    const stats = headers.map((h) => {
      const vals = rows.map((r) => r[h]).filter((v) => v !== '' && v != null);
      const reads = vals.map(readAnswer);
      const nums = reads.filter((x) => x && x.n != null);
      const answered = reads.filter((x) => !(x && x.blank)); // everything that isn't an explicit non-answer, readable or not
      return {
        h, vals, reads,
        filled: vals.length,
        answered: answered.length,
        readable: nums.length + reads.filter((x) => x && x.blank).length,
        nums: nums.map((x) => x.n),
        words: nums.filter((x) => x.word).length,
        labelled: nums.filter((x) => x.labelled).length,
        decimals: reads.filter((x) => x && x.decimal != null).length,
        yesno: vals.filter((v) => YESNO.test(String(v).trim())).length,
      };
    });
    // A rating question: most answers readable, numbers (if any) within 0–10, and not a column that describes people.
    const COUNT_Q = /\b(how many|number of|how old)\b/i;
    const isCandidate = (s) => s.filled > 0 && !looksLikeField(s.h) && !COUNT_Q.test(s.h)
      && (s.readable + s.decimals) / s.filled >= 0.5 && s.nums.length + s.decimals > 0
      && s.nums.filter((n) => n >= 0 && n <= 10).length >= s.nums.length * 0.95;
    const cands = stats.filter(isCandidate);
    // A column tagged with a theme ("[Growth] ...") is certainly a rating question. If most of its answers can't be
    // read it would otherwise be dropped without a word, so it is refused instead.
    const lost = stats.find((s) => !cands.includes(s) && /\[[^\]]+\]/.test(s.h) && s.answered >= 5 && s.nums.length >= s.answered * 0.1 && s.nums.length + s.decimals < s.answered * 0.8);
    if (lost) {
      const examples = [...new Set(lost.vals.filter((v, i) => !(lost.reads[i] && (lost.reads[i].n != null || lost.reads[i].blank))))].slice(0, 4);
      return fail(`A question in ${label} has too many answers VoiceBridge can’t read`, `“${short(lost.h)}” has ${lost.answered - lost.nums.length} of ${lost.answered} answers that aren’t on a 1–5 agreement scale, for example ${examples.map((v) => `“${v}”`).join(', ')}.`, 'Correct those answers in the file, or delete the column if it isn’t a rating question, then upload it again.', 'unreadable');
    }

    // Averages instead of individual answers.
    const averaged = cands.filter((s) => s.decimals >= Math.max(3, s.filled * 0.2));
    if (averaged.length) {
      const s = averaged[0];
      return fail(`${label} seems to contain averages, not individual answers`, `The question “${short(s.h)}” has answers like ${s.vals.filter((v) => /\d[.,]\d/.test(v)).slice(0, 3).map((v) => `“${v}”`).join(', ')}. One person can’t answer 3.5 on a 1–5 scale, so these look like averages of several answers.`, 'Upload the raw export, with each person’s own answer to each question.', 'averages');
    }

    // Which scale? Only columns answered mainly with numbers count. 1–5 is used as is; 0–4 is shifted up by one;
    // a wider scale is refused, naming it. A few stray 0s or 6s in a 1–5 survey are typos, not a different scale.
    const numeric = cands.filter((s) => s.nums.length && s.words < s.nums.length / 2);
    const allNums = numeric.flatMap((s) => s.nums).filter((n) => n >= 0 && n <= 10);
    const share = (f) => (allNums.length ? allNums.filter(f).length / allNums.length : 0);
    if (allNums.length && share((n) => n > 5) >= 0.05) {
      const top = Math.max(...allNums) <= 7 ? 7 : 10;
      const low = share((n) => n === 0) > 0 ? 0 : 1;
      return fail(`${label} uses a ${low}–${top} scale`, `VoiceBridge’s rules (what counts as “positive”, the silence test) are set for a five-point agreement scale, and converting a ${top}-point scale would change what the answers mean.`, 'Upload a survey that used a five-point scale (Strongly disagree to Strongly agree, or 1–5). The start page describes the format.', 'scale');
    }
    const shift = share((n) => n === 0) >= 0.02 && share((n) => n === 5) === 0;
    if (shift) notes.push('Answers were coded 0–4. They were read as 1–5 (0 = Strongly disagree … 4 = Strongly agree).');

    // Convert every candidate column, counting answers that can't be read.
    const ratingCols = [];
    const unreadable = [];
    for (const s of cands) {
      const bad = s.reads.filter((x) => x === null || (x && x.decimal != null) || (x && x.n != null && (shift ? x.n > 4 : x.n < 1 || x.n > 5)));
      if (s.answered && bad.length > s.answered * 0.2) {
        if ((s.answered - bad.length) / s.answered < 0.5) continue; // mostly not answers: not a rating question
        const examples = [...new Set(s.vals.filter((v, i) => bad.includes(s.reads[i])))].slice(0, 4);
        return fail(`A question in ${label} has too many answers VoiceBridge can’t read`, `“${s.h}” has ${bad.length} of ${s.answered} answers that aren’t on a 1–5 agreement scale, for example ${examples.map((v) => `“${v}”`).join(', ')}.`, 'Correct those answers in the file, or delete the column if it isn’t a rating question, then upload it again.', 'unreadable');
      }
      ratingCols.push(s.h);
      let badHere = 0; const examples = new Set();
      rows.forEach((r) => {
        const a = readAnswer(r[s.h]);
        if (!a || (a.n == null && !a.blank)) { if (String(r[s.h]).trim()) { badHere++; examples.add(r[s.h]); } r[s.h] = ''; return; }
        if (a.blank) { r[s.h] = ''; return; }
        const n = shift ? a.n + 1 : a.n;
        if (n < 1 || n > 5) { badHere++; examples.add(r[s.h]); r[s.h] = ''; return; }
        r[s.h] = String(n);
      });
      if (badHere) unreadable.push({ h: s.h, n: badHere, examples: [...examples].slice(0, 3) });
    }
    if (unreadable.length) {
      const total = unreadable.reduce((a, u) => a + u.n, 0);
      notes.push(`${total} answer${total === 1 ? '' : 's'} couldn’t be read as a point on the scale and ${total === 1 ? 'was' : 'were'} treated as unanswered: ${unreadable.slice(0, 4).map((u) => `${u.examples.map((e) => `“${e}”`).join(', ')} in “${short(u.h)}”`).join('; ')}${unreadable.length > 4 ? '; …' : ''}.`);
    }
    const labelled = cands.filter((s) => s.labelled > 0 && ratingCols.includes(s.h));
    if (labelled.length) notes.push('Answers written with their number (such as “5 - Strongly agree”) were read by their number.');

    if (!ratingCols.length) {
      const yesno = stats.filter((s) => s.filled && s.yesno >= s.filled * 0.9 && looksLikeQuestion(s.h));
      if (yesno.length) return fail(`${label} has yes/no questions, not an agreement scale`, `Questions such as “${short(yesno[0].h)}” were answered yes or no. VoiceBridge’s findings rest on a five-point agreement scale (Strongly disagree to Strongly agree).`, 'Use a survey whose rating questions have five answer options. The start page has a template.', 'yesno');
      return fail(`No rating questions were found in ${label}`, `VoiceBridge looked at all ${headers.length} columns and none of them holds answers on a five-point agreement scale (Strongly disagree to Strongly agree, or 1–5).`, 'Check this is the survey responses file (not the headcount or a summary), then use the templates on the start page as a guide to the layout.', 'norating');
    }

    // Questions with no answers at all are left out, and listed.
    const empty = stats.filter((s) => s.filled === 0 && looksLikeQuestion(s.h));
    if (empty.length) notes.push(`${empty.length} question${empty.length === 1 ? ' has' : 's have'} no answers at all and ${empty.length === 1 ? 'was' : 'were'} left out: ${empty.slice(0, 4).map((s) => `“${short(s.h)}”`).join(', ')}${empty.length > 4 ? ' …' : ''}.`);

    // Group labels: spelling variants that differ only in capitals or spaces are the same group.
    const merged = tidyLabels(rows, headers.filter((h) => !ratingCols.includes(h)), notes, warnings);
    rows = merged;
    return { ok: true, headers, rows, notes, warnings, ratingCols };
  }

  function short(h) { const s = String(h).replace(/^\s*[A-Z]{1,3}\d{1,3}\s*/, '').replace(/^\[[^\]]+\]\s*/, ''); return s.length > 60 ? s.slice(0, 57) + '…' : s; }

  function tidyLabels(rows, cols, notes, warnings) {
    for (const h of cols) {
      const vals = rows.map((r) => r[h]).filter((v) => v !== '' && v != null);
      const distinct = [...new Set(vals)];
      if (distinct.length < 2 || distinct.length > 30 || distinct.some((v) => v.length > 45) || distinct.length > vals.length * 0.5) continue;
      const key = (v) => v.trim().replace(/\s+/g, ' ').toLowerCase();
      const groups = new Map();
      vals.forEach((v) => { const k = key(v); if (!groups.has(k)) groups.set(k, new Map()); const g = groups.get(k); g.set(v, (g.get(v) || 0) + 1); });
      const changes = [];
      const pick = new Map();
      groups.forEach((variants, k) => {
        const best = [...variants.entries()].sort((a, b) => b[1] - a[1])[0][0].trim().replace(/\s+/g, ' ');
        pick.set(k, best);
        const others = [...variants.keys()].filter((v) => v !== best);
        if (others.length) changes.push(`${others.map((v) => `“${v}”`).join(', ')} → “${best}”`);
      });
      if (changes.length) {
        rows.forEach((r) => { if (r[h]) r[h] = pick.get(key(r[h])) || r[h]; });
        notes.push(`In “${h}”, labels that differ only in capitals or spaces were treated as the same group: ${changes.slice(0, 4).join('; ')}${changes.length > 4 ? ' …' : ''}.`);
      }
      // Likely the same group written two ways, such as "F" and "Female". Not merged: the user decides.
      // A column mixing one-letter codes ("F") with full words ("Woman", "Female") probably names the same group twice.
      const finals = [...new Set(pick.values())];
      const codes = finals.filter((v) => /^[a-z]$/i.test(v)), words = finals.filter((v) => v.length > 2 && !PREFER.test(v));
      if (codes.length && words.length) {
        const like = codes.map((c) => [c, words.find((w) => w[0].toLowerCase() === c.toLowerCase())]).find(([, w]) => w);
        warnings.push(`“${h}” mixes short codes (${codes.slice(0, 3).map((c) => `“${c}”`).join(', ')}) with full labels (${words.slice(0, 3).map((w) => `“${w}”`).join(', ')}).${like ? ` For example, “${like[0]}” may mean “${like[1]}”.` : ''} If a code means the same group as a label, make them match in your file and upload it again; until then they are counted as different groups.`);
      }
    }
    return rows;
  }

  // ---------------------------------------------------------------- Preparing a headcount
  function prepareHeadcount(sheet, label = 'The headcount file') {
    const notes = [...(sheet.notes || [])];
    const rows = sheet.rows.map((r) => ({ ...r })).filter((r) => {
      const vals = Object.values(r).filter((v) => v !== '');
      return vals.length && !/^(total|totals|grand total|sum|count)$/i.test(vals[0]);
    });
    if (!rows.length) return fail(`${label} has no people in it`, 'It has column names but no rows of people.', 'Export the headcount again with one row for every person who was invited.');
    // A headcount lists people; if it has rating answers in it, it is a survey file.
    const ratingLike = sheet.headers.filter((h) => {
      if (looksLikeField(h)) return false;
      const vals = rows.map((r) => r[h]).filter(Boolean);
      return vals.length >= 5 && vals.filter((v) => { const a = readAnswer(v); return a && a.n >= 1 && a.n <= 5 && (a.word || looksLikeQuestion(h)); }).length >= vals.length * 0.8;
    });
    if (ratingLike.length >= 2) return fail(`${label} looks like a survey file, not a headcount`, `It has answers to questions such as “${short(ratingLike[0])}”. A headcount lists everyone who was invited, with their department, gender and so on, and no answers.`, 'Upload the survey export in the survey box, and a headcount (or nothing) in the headcount box.');
    const warnings = [];
    tidyLabels(rows, sheet.headers, notes, warnings);
    return { ok: true, headers: sheet.headers, rows, notes, warnings };
  }

  // Is this sheet a survey (has rating questions) or something else?
  // A file that fails only because of its scale or answers is still a survey (the user gets the survey's message).
  function isSurvey(sheet) { const p = prepareSurvey(sheet); return p.ok || p.error.code !== 'norating'; }

  const api = { read, prepareSurvey, prepareHeadcount, isSurvey, readAnswer, parseDelimited };
  root.VB_INTAKE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
