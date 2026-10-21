// Bundles src/ into one self-contained HTML file.
// dist/index.html   — standalone page (open it, or host it anywhere static)
// dist/artifact.html — same page without the document skeleton
import { readFileSync, writeFileSync } from 'node:fs';
const r = (f) => readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const head = `<title>VoiceBridge</title>
<meta name="description" content="Turn employee survey results into findings people act on.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,450;0,6..72,500;1,6..72,450&display=swap">
<style>${r('styles.css')}</style>`;
const body = `<div id="app"></div>
<script>${r('data.js')}</script>
<script>${r('engine.js')}</script>
<script>${r('intake.js')}</script>
<script>${r('guidance.js')}</script>
<script>${r('app.js')}</script>`;
writeFileSync(new URL('./dist/artifact.html', import.meta.url), head + '\n' + body + '\n');
writeFileSync(new URL('./dist/index.html', import.meta.url), `<!doctype html>\n<html lang="en-ZA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head><body>\n${body}\n</body></html>\n`);
console.log('built', (readFileSync(new URL('./dist/index.html', import.meta.url)).length / 1024).toFixed(0) + ' KB');
