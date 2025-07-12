let words = [];
let practiceWords = [];
let current = 0;
let userAnswers = [];

const startBtn = document.getElementById('startBtn');
const wordCountSelect = document.getElementById('wordCountSelect');
const questionDiv = document.getElementById('question');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const resultDiv = document.getElementById('result');

// Populate the select dropdown after loading words
fetch('./words.json')
  .then(response => response.json())
  .then(data => {
    words = data;
    // Populate select options
    wordCountSelect.innerHTML = '';
    for (let i = 1; i <= words.length; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
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
  // Select random words for practice
  const count = parseInt(wordCountSelect.value, 10);
  practiceWords = shuffleArray(words).slice(0, count);
  nextWord();
}

function nextWord() {
  if (current < practiceWords.length) {
    questionDiv.textContent = `Word ${current + 1} of ${practiceWords.length}: Listen and type the word.`;
    answerInput.value = '';
    answerInput.focus();
    speakWord(practiceWords[current]);
  } else {
    showResults();
  }
}

function submitAnswer() {
  userAnswers.push(answerInput.value.trim());
  current++;
  nextWord();
}

function saveIncorrectWords(incorrectWords) {
  fetch('/api/save-incorrect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incorrectWords)
  })
    .then(response => response.json())
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
  const incorrectWords = incorrectList.map(item => item.word);
  saveIncorrectWords(incorrectWords);
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

startBtn.addEventListener('click', startExercise);
submitBtn.addEventListener('click', submitAnswer);
answerInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') submitAnswer();
});