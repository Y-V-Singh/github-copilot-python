// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const DIFFICULTY_CLUES = {
  easy: 40,
  medium: 32,
  hard: 25
};
const LEADERBOARD_STORAGE_KEY = 'sudoku-leaderboard';
const THEME_STORAGE_KEY = 'sudoku-theme';
let puzzle = [];
let timerInterval = null;
let elapsedSeconds = 0;
let hintsUsed = 0;

function getCellIndex(row, col) {
  return row * SIZE + col;
}

function getCellInput(row, col) {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  return inputs[getCellIndex(row, col)];
}

function isConflict(row, col, value) {
  if (!value) {
    return false;
  }

  for (let index = 0; index < SIZE; index++) {
    if (index !== col && puzzle[row][index] === value) {
      return true;
    }
    if (index !== row && puzzle[index][col] === value) {
      return true;
    }
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
    for (let colOffset = 0; colOffset < 3; colOffset++) {
      const boxRow = startRow + rowOffset;
      const boxCol = startCol + colOffset;
      if ((boxRow !== row || boxCol !== col) && puzzle[boxRow][boxCol] === value) {
        return true;
      }
    }
  }

  return false;
}

function clearValidation() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index];
    if (input.readOnly) {
      continue;
    }
    input.className = 'sudoku-cell editable';
  }
}

function validateBoard() {
  clearValidation();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const input = inputs[getCellIndex(row, col)];
      if (input.readOnly || !input.value) {
        continue;
      }
      const value = parseInt(input.value, 10);
      if (isConflict(row, col, value)) {
        input.className = 'sudoku-cell editable invalid';
      }
    }
  }
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        if (val) {
          const row = parseInt(e.target.dataset.row, 10);
          const col = parseInt(e.target.dataset.col, 10);
          puzzle[row][col] = parseInt(val, 10);
        } else {
          const row = parseInt(e.target.dataset.row, 10);
          const col = parseInt(e.target.dataset.col, 10);
          puzzle[row][col] = 0;
        }
        validateBoard();
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.readOnly = true;
        inp.disabled = false;
        inp.className = 'sudoku-cell prefilled';
      } else {
        inp.value = '';
        inp.readOnly = false;
        inp.disabled = false;
        inp.className = 'sudoku-cell editable';
      }
    }
  }
  validateBoard();
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTimerDisplay() {
  const timerElement = document.getElementById('timer');
  timerElement.textContent = `Time: ${formatTime(elapsedSeconds)}`;
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = window.setInterval(() => {
    elapsedSeconds += 1;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
}

function getSelectedClues() {
  const difficultySelect = document.getElementById('difficulty');
  const difficulty = difficultySelect.value;
  return DIFFICULTY_CLUES[difficulty] || DIFFICULTY_CLUES.easy;
}

function getDifficultyLabel(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function applyTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalizedTheme);
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.textContent = normalizedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    toggleButton.setAttribute('aria-pressed', String(normalizedTheme === 'dark'));
  }
  window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
}

function getStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'dark' ? 'dark' : 'light';
  } catch (error) {
    return 'light';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function renderLeaderboard() {
  const leaderboardList = document.getElementById('leaderboard-list');
  if (!leaderboardList) {
    return;
  }

  let scores = [];
  try {
    scores = JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY) || '[]');
  } catch (error) {
    scores = [];
  }

  leaderboardList.innerHTML = '';
  if (!scores.length) {
    const empty = document.createElement('div');
    empty.className = 'leaderboard-empty';
    empty.textContent = 'No scores yet.';
    leaderboardList.appendChild(empty);
    return;
  }

  const header = document.createElement('div');
  header.className = 'leaderboard-row header';
  header.innerHTML = '<span>Rank</span><span>Player Name</span><span>Time</span><span>Difficulty</span><span>Hints Used</span>';
  leaderboardList.appendChild(header);

  scores.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.innerHTML = `
      <span>#${index + 1}</span>
      <span>${entry.playerName || 'Anonymous'}</span>
      <span>${entry.time}</span>
      <span>${getDifficultyLabel(entry.difficulty || 'easy')}</span>
      <span>${entry.hintsUsed ?? 0}</span>
    `;
    leaderboardList.appendChild(row);
  });
}

function saveScore(playerName, time, difficulty, hintsUsed) {
  let scores = [];
  try {
    scores = JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY) || '[]');
  } catch (error) {
    scores = [];
  }

  scores.push({
    playerName,
    time,
    difficulty,
    hintsUsed
  });

  scores.sort((first, second) => {
    const firstTime = first.time || '00:00';
    const secondTime = second.time || '00:00';
    const firstSeconds = firstTime.split(':').reduce((total, value, index) => total + (parseInt(value, 10) * Math.pow(60, 1 - index)), 0);
    const secondSeconds = secondTime.split(':').reduce((total, value, index) => total + (parseInt(value, 10) * Math.pow(60, 1 - index)), 0);
    return firstSeconds - secondSeconds;
  });

  const trimmedScores = scores.slice(0, 10);
  localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(trimmedScores));
  renderLeaderboard();
}

async function newGame() {
  const clues = getSelectedClues();
  const res = await fetch(`/new?clues=${clues}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
  hintsUsed = 0;
  startTimer();
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }

  const incorrect = new Set(data.incorrect.map((cell) => cell[0] * SIZE + cell[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.readOnly) {
      continue;
    }
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell editable incorrect';
    } else {
      inp.className = 'sudoku-cell editable';
    }
  }

  const isComplete = board.every((row) => row.every((value) => value !== 0));
  if (!isComplete) {
    msg.style.color = '#d32f2f';
    msg.innerText = '';
    return;
  }

  if (incorrect.size === 0) {
    stopTimer();
    const playerName = window.prompt('Enter your name for the leaderboard:', 'Player');
    if (playerName !== null) {
      const difficulty = document.getElementById('difficulty').value;
      saveScore(playerName.trim() || 'Player', formatTime(elapsedSeconds), difficulty, hintsUsed);
    }
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

async function useHint() {
  const res = await fetch('/hint', {method: 'POST'});
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }

  const [row, col, value] = data.revealed[0];
  const input = getCellInput(row, col);
  input.value = value;
  input.readOnly = true;
  input.className = 'sudoku-cell prefilled';
  puzzle[row][col] = value;
  hintsUsed = data.hints_used;
  validateBoard();
  msg.style.color = '#1976d2';
  msg.innerText = `Hint used (${hintsUsed}).`;
}

// Wire buttons
window.addEventListener('load', () => {
  applyTheme(getStoredTheme());
  renderLeaderboard();
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint').addEventListener('click', useHint);
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  // initialize
  newGame();
});