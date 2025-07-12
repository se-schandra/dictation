const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/save-incorrect', async (req, res) => {
  let incorrect = req.body.incorrect || req.body;
  if (!Array.isArray(incorrect)) return res.status(400).json({ error: 'Invalid data' });

  // Create a timestamped filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(
    __dirname,
    'public',
    `incorrect-${timestamp}.json`
  );

  try {
    await fs.promises.writeFile(filePath, JSON.stringify(incorrect, null, 2));
    res.json({ status: 'ok', file: `incorrect-${timestamp}.json` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save', details: err.message });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});