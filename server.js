const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API endpoint to serve adjectives.json
app.get('/api/adjectives', (req, res) => {
  const filePath = path.join(__dirname, 'public', '/adjectives/adjective.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read adjectives file.' });
    }
    res.type('application/json').send(data);
  });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/save-result', async (req, res) => {
  console.log('Received data:', req.body);
  let { incorrectWords, correctWords, testType } = req.body;
  if (!Array.isArray(incorrectWords) || !Array.isArray(correctWords)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  // Create a timestamped filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const incorrectDir = path.join(__dirname, 'public', testType, 'incorrect');
  const correctDir = path.join(__dirname, 'public', testType, 'correct');
  const incorrectFilePath = path.join(incorrectDir, `incorrect-${timestamp}.json`);
  const correctFilePath = path.join(correctDir, `correct-${timestamp}.json`);


  try {
    if (incorrectFilePath.length) {
      await fs.promises.writeFile(incorrectFilePath, JSON.stringify(incorrectWords, null, 2));
    }
    if (correctFilePath.length) {
      await fs.promises.writeFile(correctFilePath, JSON.stringify(correctWords, null, 2));
    } res.json({
      status: 'ok',
      message: 'Results saved successfully',
      correctFile: `correct-${timestamp}.json`,
      incorrectFile: `incorrect-${timestamp}.json`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save', details: err.message });
  }
});

app.post('/api/all-correct-words', async (req, res) => {
  const { testType } = req.body;
  const correctDir = path.join(__dirname, 'public', testType, 'correct');
  console.log('Fetching correct words from:', correctDir);
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
    res.status(500).json({ error: 'Failed to fetch correct words on path `' + correctDir + '`', details: err.message });
  }
});

app.get('/api/all-incorrect-words', async (req, res) => {
  const { testType } = req.query;
  
  if (!testType) {
    return res.status(400).json({ error: 'testType query parameter is required' });
  }
  
  const incorrectDir = path.join(__dirname, 'public', testType, 'incorrect');
  console.log('Fetching incorrect words from:', incorrectDir);
  
  try {
    // Ensure the directory exists
    try {
      await fs.promises.access(incorrectDir, fs.constants.F_OK);
    } catch (err) {
      // Directory does not exist
      return res.json({ words: [] });
    }

    const files = await fs.promises.readdir(incorrectDir);
    if (files.length === 0) {
      return res.json({ words: [] });
    }
    
    let allWords = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(incorrectDir, file);
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
    res.status(500).json({ error: 'Failed to fetch incorrect words from path `' + incorrectDir + '`', details: err.message });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/adjectives', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'adjectives', 'adjectives.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});