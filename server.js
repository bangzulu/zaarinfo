const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app        = express();
const PORT       = process.env.PORT || 3000;
const NOTES_FILE = path.join(__dirname, 'notes.txt');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

app.get('/api/notes', (_req, res) => {
  try {
    const content = fs.existsSync(NOTES_FILE)
      ? fs.readFileSync(NOTES_FILE, 'utf8')
      : '';
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/notes', (req, res) => {
  try {
    const content = req.body.content ?? '';
    fs.writeFileSync(NOTES_FILE, content, 'utf8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log('ZAARINFO  http://localhost:' + PORT);
});
