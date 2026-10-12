// VoiceBridge server: serves the app and, when Claude credentials are available,
// themes open-text comments through the Claude API.
//
// What leaves the machine: comment text only, with names, emails and phone numbers
// removed (again, on top of the browser's own redaction). No ratings, no
// demographics, no team names. Claude returns theme labels and comment ids; the app
// takes every quote from its own records by id, so a quote can never be invented.
//
//   npm install
//   ANTHROPIC_API_KEY=... npm start        → http://localhost:8080
//   VB_MODEL=claude-sonnet-5-5 npm start   (optional: pick another model)

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const here = path.dirname(fileURLToPath(import.meta.url));
// The engine is a browser script that registers itself on globalThis.
await import('./src/engine.js');
const { redact } = globalThis.VB_ENGINE;

const PORT = Number(process.env.PORT || 8080);
const MODEL = process.env.VB_MODEL || 'claude-opus-5-5';
// The SDK reads an API key, an auth token, or an `ant auth login` profile.
const HAS_CREDENTIALS = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE
  || existsSync(path.join(os.homedir(), '.config', 'anthropic')));
const client = HAS_CREDENTIALS ? new Anthropic() : null;

const THEME_SCHEMA = {
  type: 'object',
  properties: {
    themes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Plain-language theme name, 2 to 6 words, sentence case.' },
          summary: { type: 'string', description: 'One sentence on what people say. Describe, never explain why.' },
          sentiment: { type: 'string', enum: ['concern', 'praise', 'mixed'] },
          comment_ids: { type: 'array', items: { type: 'integer' } },
        },
        required: ['label', 'summary', 'sentiment', 'comment_ids'],
        additionalProperties: false,
      },
    },
  },
  required: ['themes'],
  additionalProperties: false,
};

const SYSTEM = `You help an in-house HR or People & Culture professional read anonymous employee survey comments from a South African organisation.

Group the comments into 6 to 10 themes that a manager would recognise. A comment may belong to at most two themes. Every comment id you return must come from the list you were given. Leave out comments that are empty or meaningless.

Rules:
- Describe what people say. Do not guess causes, motives or who wrote a comment.
- Never try to identify anyone. If a comment still contains a name or detail that could identify someone, do not repeat it in a label or summary.
- Keep praise and concerns in separate themes when they are about different things.
- Write labels and summaries in plain South African English, without jargon.`;

async function themeComments(comments) {
  if (!client) throw Object.assign(new Error('Claude isn\u2019t set up on this server. Set ANTHROPIC_API_KEY and restart.'), { status: 503 });
  const list = comments.map((c) => `[${c.id}] ${redact(String(c.text).slice(0, 1200), { email: 0, phone: 0, name: 0 })}`).join('\n');
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: THEME_SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: `Here are ${comments.length} comments, each with its id:\n\n${list}` }],
  });
  if (response.stop_reason === 'refusal') throw Object.assign(new Error('Claude declined to theme these comments.'), { status: 422 });
  if (response.stop_reason === 'max_tokens') throw Object.assign(new Error('The response was cut short. Try fewer comments.'), { status: 422 });
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const parsed = JSON.parse(text);
  // Validate: keep only ids that were actually sent, drop empty themes.
  const valid = new Set(comments.map((c) => c.id));
  parsed.themes = parsed.themes
    .map((t) => ({ ...t, comment_ids: [...new Set(t.comment_ids)].filter((id) => valid.has(id)) }))
    .filter((t) => t.comment_ids.length);
  return { ...parsed, model: response.model, usage: response.usage };
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ai: HAS_CREDENTIALS, model: MODEL });
    if (url.pathname === '/api/themes' && req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 2_000_000) return send(res, 413, { error: 'Too many comments in one request.' }); }
      const { comments } = JSON.parse(raw || '{}');
      if (!Array.isArray(comments) || !comments.length) return send(res, 400, { error: 'No comments were sent.' });
      return send(res, 200, await themeComments(comments.slice(0, 1500)));
    }
    const file = url.pathname === '/' ? '/index.html' : url.pathname;
    const full = path.join(here, 'dist', path.normalize(file).replace(/^(\.\.[/\\])+/, ''));
    if (!full.startsWith(path.join(here, 'dist'))) return send(res, 403, 'Forbidden', 'text/plain');
    return send(res, 200, await readFile(full), TYPES[path.extname(full)] || 'application/octet-stream');
  } catch (err) {
    if (err.code === 'ENOENT') return send(res, 404, 'Not found', 'text/plain');
    if (err instanceof Anthropic.AuthenticationError) return send(res, 401, { error: 'No valid Claude API key. Set ANTHROPIC_API_KEY and restart.' });
    if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: 'Claude is rate-limited right now. Try again in a minute.' });
    if (err instanceof Anthropic.APIError) return send(res, 502, { error: `Claude API error (${err.status}).` });
    return send(res, err.status || 500, { error: err.message || 'Something went wrong.' });
  }
}).listen(PORT, () => console.log(`VoiceBridge on http://localhost:${PORT} (${HAS_CREDENTIALS ? `AI themes with ${MODEL}` : 'no Claude credentials: keyword themes only'})`));
