let categories, categoryKeys;

// Fetch adjectives data once
fetch('/api/adjectives')
  .then(response => response.json())
  .then(data => {
    categories = data.year6AdjectiveWordMat;
    categoryKeys = Object.keys(categories);

    // Wait for user to click Start
    document.getElementById('startBtn').addEventListener('click', async () => {
      // Clear previous test
      document.getElementById('adjectivePool').innerHTML = '';
      document.getElementById('categories').innerHTML = '';
      const count = parseInt(document.getElementById('adjectiveCountSelect').value, 10);

      // Shuffle and pick any 5 categories
      let selectedCategories = categoryKeys.sort(() => Math.random() - 0.5).slice(0, 5);

      // Collect adjectives from these categories and shuffle
      let allAdjectives = [];
      selectedCategories.forEach(key => {
        allAdjectives = allAdjectives.concat(categories[key]);
      });
      allAdjectives = await filterOutCorrectAdjectives(allAdjectives);
      allAdjectives = allAdjectives.sort(() => Math.random() - 0.5).slice(0, count);

      // Create draggable adjectives in pool
      allAdjectives.forEach(adj => {
        const span = document.createElement('span');
        span.className = 'adjective';
        span.textContent = adj;
        span.draggable = true;
        span.id = 'adj-' + adj.replace(/\s+/g, '-');
        span.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', adj);
        });
        document.getElementById('adjectivePool').appendChild(span);
      });

      // Create empty category boxes for the selected 5 categories
      selectedCategories.forEach(key => {
        const box = document.createElement('div');
        box.className = 'category-box';
        box.dataset.category = key;
        box.innerHTML = `<div class="category-title">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>`;
        box.addEventListener('dragover', e => e.preventDefault());
        box.addEventListener('drop', function(e) {
          e.preventDefault();
          const adj = e.dataTransfer.getData('text/plain');
          if (![...box.querySelectorAll('.adjective')].some(el => el.textContent === adj)) {
            // Remove from pool if present
            const poolAdj = [...document.getElementById('adjectivePool').querySelectorAll('.adjective')].find(el => el.textContent === adj);
            if (poolAdj) document.getElementById('adjectivePool').removeChild(poolAdj);
            // Remove from other boxes
            document.querySelectorAll('.category-box .adjective').forEach(el => {
              if (el.textContent === adj) el.parentNode.removeChild(el);
            });
            // Add to this box
            const span = document.createElement('span');
            span.className = 'adjective';
            span.textContent = adj;
            span.draggable = true;
            span.id = 'adj-' + adj.replace(/\s+/g, '-');
            span.addEventListener('dragstart', e => {
              e.dataTransfer.setData('text/plain', adj);
            });
            box.appendChild(span);
          }
        });
        document.getElementById('categories').appendChild(box);
      });

      // Add "Check Answers" button
      let checkBtn = document.getElementById('checkBtn');
      if (!checkBtn) {
        checkBtn = document.createElement('button');
        checkBtn.id = 'checkBtn';
        checkBtn.textContent = 'Check Answers';
        checkBtn.style.margin = '20px 0';
        document.body.appendChild(checkBtn);
      }

      checkBtn.onclick = () => {
        let correctWords = [];
        let incorrectWords = [];
        document.querySelectorAll('.category-box').forEach(box => {
          const category = box.dataset.category;
          const correctAdjectives = new Set(categories[category]);
          const userAdjectives = [...box.querySelectorAll('.adjective')].map(el => el.textContent);

          userAdjectives.forEach(adj => {
            if (correctAdjectives.has(adj)) {
              correctWords.push(adj);
            } else {
              incorrectWords.push(adj);
            }
          });
        });

        // Show results to user
        let html = '<h2>Results</h2>';
        html += `<div><span style="color:green;">Correct: ${correctWords.join(', ') || 'None'}</span></div>`;
        html += `<div><span style="color:red;">Incorrect: ${incorrectWords.join(', ') || 'None'}</span></div>`;
        let resultDiv = document.getElementById('resultDiv');
        if (!resultDiv) {
          resultDiv = document.createElement('div');
          resultDiv.id = 'resultDiv';
          document.body.appendChild(resultDiv);
        }
        resultDiv.innerHTML = html;

        // Save results via API
        fetch('/api/save-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correctWords, incorrectWords, testType: 'adjective_sorting' })
        })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ok') {
            let fileInfo = '';
            if (data.correctFile) fileInfo += `<div>Correct answers saved in: <b>${data.correctFile}</b></div>`;
            if (data.incorrectFile) fileInfo += `<div>Incorrect answers saved in: <b>${data.incorrectFile}</b></div>`;
            resultDiv.innerHTML += `<div style="color:blue;">Results saved!</div>${fileInfo}`;
          } else {
            resultDiv.innerHTML += '<div style="color:red;">Error saving results.</div>';
          }
        })
        .catch(() => {
          resultDiv.innerHTML += '<div style="color:red;">Error saving results.</div>';
        });
      };
    });
  })
  .catch(err => {
    document.body.textContent = 'Failed to load adjectives.';
  });

async function filterOutCorrectAdjectives(allAdjectives) {
  const response = await fetch('/api/all-correct-words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testType: 'adjective_sorting' })
  });
  const data = await response.json();
  if (Array.isArray(data.words)) {
    const correctSet = new Set(data.words.map(w => w?.toLowerCase()).filter(Boolean));
    return allAdjectives.filter(w => !correctSet.has(w.toLowerCase()));
  }
  return allAdjectives; // If no correct words found, return all
}