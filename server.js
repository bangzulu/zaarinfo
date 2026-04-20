const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app        = express();
const PORT       = process.env.PORT     || 3000;
const DATA_DIR   = process.env.DATA_DIR || __dirname;
const NOTES_FILE = path.join(DATA_DIR, 'notes.txt');

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

// ── Säkerhetshuvuden ────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(express.static(__dirname));

// ── Rate limiting (60 req/min per IP) ───────────────────────
const hits = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
}, 5 * 60_000);

function rateLimit(req, res, next) {
  const ip  = req.ip || 'unknown';
  const now = Date.now();
  const e   = hits.get(ip) || { n: 0, reset: now + 60_000 };
  if (now > e.reset) { e.n = 0; e.reset = now + 60_000; }
  e.n++;
  hits.set(ip, e);
  if (e.n > 60) return res.status(429).json({ error: 'Too many requests' });
  next();
}

// ── API ─────────────────────────────────────────────────────
app.get('/api/notes', rateLimit, (_req, res) => {
  try {
    const content = fs.existsSync(NOTES_FILE)
      ? fs.readFileSync(NOTES_FILE, 'utf8')
      : '';
    res.json({ content });
  } catch {
    res.status(500).json({ error: 'Read failed' });
  }
});

app.post('/api/notes', rateLimit, (req, res) => {
  try {
    // Acceptera bara strängar, strippa null-bytes
    const raw     = req.body.content ?? '';
    const content = String(raw).replaceAll('\0', '');
    fs.writeFileSync(NOTES_FILE, content, 'utf8');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Write failed' });
  }
});

app.listen(PORT, () => console.log('ZAARINFO  http://localhost:' + PORT));
