const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/save-result', async (req, res) => {
  console.log('Received data:', req.body);
  let { incorrectWords, correctWords } = req.body.incorrect || req.body;
  if (!Array.isArray(incorrectWords) || !Array.isArray(correctWords)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  // Create a timestamped filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const incorrectFilePath = path.join(
    __dirname,
    'public',
    `incorrect/incorrect-${timestamp}.json`
  );
  const correctFilePath = path.join(
    __dirname,
    'public',
    `correct/correct-${timestamp}.json`
  );

  try {
    if (incorrectFilePath.length) {
      await fs.promises.writeFile(incorrectFilePath, JSON.stringify(incorrectWords, null, 2));
    }
    if (correctFilePath.length) {
      await fs.promises.writeFile(correctFilePath, JSON.stringify(correctWords, null, 2));
    }
    res.json({ status: 'ok', message: 'Results saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save', details: err.message });
  }
});

app.get('/api/all-correct-words', async (req, res) => {
  const correctDir = path.join(__dirname, 'public', 'correct');
  try {
    const files = await fs.promises.readdir(correctDir);
    if (files.length === 0) {
      return res.json({ words: [] });
    }
    let allWords = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(correctDir, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const words = JSON.parse(content);
        // If file contains an array, merge it
        if (Array.isArray(words)) {
          allWords = allWords.concat(words);
        }
      }
    }
    res.json({ words: allWords });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch correct words', details: err.message });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});