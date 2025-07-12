
let words = [];
let practiceWords = [];
let current = 0;
let userAnswers = [];
const dictationLength = [2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

const startBtn = document.getElementById('startBtn');
const wordCountSelect = document.getElementById('wordCountSelect');
const questionDiv = document.getElementById('question');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const resultDiv = document.getElementById('result');
const repeatBtn = document.getElementById('repeatBtn');

repeatBtn.addEventListener('click', function () {
  if (current < practiceWords.length) {
    speakWord(practiceWords[current]);
  }
});

// Populate the select dropdown after loading words
fetch('./words.json')
  .then(response => response.json())
  .then(data => {
    filterOutCorrectWords(data);
    // Populate select options
    wordCountSelect.innerHTML = '';
    for (let i = 0; i <= dictationLength.length; i++) {
      const opt = document.createElement('option');
      opt.value = dictationLength[i] || i;
      opt.textContent = dictationLength[i] || i;
      wordCountSelect.appendChild(opt);
    }
    startBtn.disabled = false;
  })
  .catch(err => {
    resultDiv.innerHTML = '<span style="color:red;">Failed to load words list.</span>';
    startBtn.disabled = true;
  });

function speakWord(word) {
  const utter = new window.SpeechSynthesisUtterance(word);
  window.speechSynthesis.speak(utter);
}

function startExercise() {
  current = 0;
  userAnswers = [];
  resultDiv.textContent = '';
  startBtn.style.display = 'none';
  answerInput.style.display = 'inline';
  submitBtn.style.display = 'inline';
  repeatBtn.style.display = 'inline';
  // Select random words for practice
  const count = parseInt(wordCountSelect.value, 10);
  practiceWords = shuffleArray(words).slice(0, count); // <-- random selection
  nextWord();
}

function nextWord() {
  if (current < practiceWords.length) {
    questionDiv.textContent = `Word ${current + 1} of ${practiceWords.length}: Listen and type the word.`;
    answerInput.value = '';
    answerInput.focus();
    speakWord(practiceWords[current]);
    repeatBtn.style.display = 'inline';
  } else {
    showResults();
  }
}

function submitAnswer() {
  userAnswers.push(answerInput.value.trim());
  current++;
  nextWord();
}


function saveResult({ correctWords, incorrectWords }) {
  const body = JSON.stringify({ correctWords, incorrectWords });

  fetch('/api/save-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  })
    .then(response => {
      if (!response.ok) {
        alert('Error saving incorrect words: ' + response.statusText);
      } else {
        return response.json();
      }
    }
    )
    .then(data => {
      if (data.status !== 'ok') {
        alert('Failed to save incorrect words.' + (data.error ? ': ' + data.error : data.status));
      }
    })
    .catch(err => {
      alert('Error saving incorrect words: ' + err.message);
    });
}

function showResults() {
  answerInput.style.display = 'none';
  submitBtn.style.display = 'none';
  repeatBtn.style.display = 'none';

  let correctList = [];
  let incorrectList = [];

  for (let i = 0; i < practiceWords.length; i++) {
    const user = userAnswers[i] || '';
    const isCorrect = user.toLowerCase() === practiceWords[i].toLowerCase();
    if (isCorrect) {
      correctList.push(practiceWords[i]);
    } else {
      incorrectList.push({
        word: practiceWords[i],
        user: user
      });
    }
  }

  let html = '<h2>Results</h2>';
  html += `<p><b>Score: ${correctList.length} / ${practiceWords.length}</b></p>`;

  html += '<h3>Correctly Spelled Words</h3><ul>';
  correctList.forEach(word => {
    html += `<li>${word}</li>`;
  });
  html += '</ul>';

  html += '<h3>Incorrectly Spelled Words</h3><ul>';
  incorrectList.forEach(item => {
    html += `<li><b>Word:</b> ${item.word} <br><b>Your answer:</b> ${item.user || '(blank)'}</li>`;
  });
  html += '</ul>';

  resultDiv.innerHTML = html;
  startBtn.textContent = 'Restart';
  startBtn.style.display = 'inline';
  const incorrectWords = incorrectList.map(item => item.word) || [];
  saveResult({ correctWords:correctList, incorrectWords });
}

// Utility to shuffle an array
function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function filterOutCorrectWords(allWords) {
  const response = await fetch('/api/all-correct-words');
  const data = await response.json();
  if (Array.isArray(data.words)) {
    console.log('Correct words fetched:', data.words);
    // Remove correct words from the main words list
    const correctSet = new Set(data.words.map(w => w?.toLowerCase()).filter(Boolean));
    words = allWords.filter(w => !correctSet.has(w.toLowerCase()));
    return;
  }
  words = allWords; // If no correct words found, return all
  return;
}


startBtn.addEventListener('click', startExercise);
submitBtn.addEventListener('click', submitAnswer);
answerInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') submitAnswer();
});
