const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const quizArea = document.getElementById('quizArea');
const emptyState = document.getElementById('emptyState');
const nicknamePrompt = document.getElementById('nicknamePrompt');
const optionsEl = document.getElementById('options');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const nextBtn = document.getElementById('nextBtn');
const resetBtn = document.getElementById('resetBtn');
const useSampleBtn = document.getElementById('useSampleBtn');
const defaultDataFile = 'US_States_License_Plate_Nicknames.xlsx';

let entries = [];
let currentQuestion = null;
let score = 0;
let total = 0;
let answered = false;

const sampleData = [
  { state: 'Alaska', nickname: 'The Last Frontier' },
  { state: 'California', nickname: 'The Golden State' },
  { state: 'Florida', nickname: 'The Sunshine State' },
  { state: 'Hawaii', nickname: 'The Aloha State' },
  { state: 'Maine', nickname: 'The Pine Tree State' },
  { state: 'Nevada', nickname: 'The Silver State' },
  { state: 'New York', nickname: 'The Empire State' },
  { state: 'Texas', nickname: 'The Lone Star State' }
];

fileInput.addEventListener('change', handleFileUpload);
nextBtn.addEventListener('click', buildQuestion);
resetBtn.onclick = (event) => {
  event.preventDefault();
  restartGame();
};
useSampleBtn.addEventListener('click', () => {
  entries = [...sampleData];
  uploadStatus.textContent = `Loaded ${entries.length} sample rows.`;
  restartGame();
});
loadDefaultDataset();

function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  uploadStatus.textContent = 'Reading file...';
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const parsed = parseWorkbookData(e.target?.result);
      entries = parsed;
      uploadStatus.textContent = `Loaded ${entries.length} rows from ${file.name}.`;
      restartGame();
    } catch (error) {
      uploadStatus.textContent = `Upload failed: ${error.message}`;
    }
  };

  reader.onerror = () => {
    uploadStatus.textContent = 'Could not read file.';
  };

  reader.readAsArrayBuffer(file);
}

async function loadDefaultDataset() {
  uploadStatus.textContent = `Loading bundled dataset (${defaultDataFile})...`;
  try {
    const response = await fetch(defaultDataFile);
    if (!response.ok) {
      throw new Error(`Could not load ${defaultDataFile}`);
    }
    const buffer = await response.arrayBuffer();
    const parsed = parseWorkbookData(buffer);
    entries = parsed;
    uploadStatus.textContent = `Loaded ${entries.length} rows from bundled dataset.`;
    restartGame();
  } catch (error) {
    uploadStatus.textContent = `Bundled dataset unavailable. Upload a file to start. (${error.message})`;
  }
}

function parseWorkbookData(dataBuffer) {
  const workbook = XLSX.read(dataBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const parsed = normalizeRows(rows);

  if (parsed.length < 4) {
    throw new Error('Need at least 4 valid rows with state + nickname.');
  }
  return parsed;
}

function normalizeRows(rows) {
  const findKey = (obj, candidates) => {
    const keys = Object.keys(obj);
    return keys.find((k) => candidates.some((c) => k.toLowerCase().includes(c)));
  };

  const parsed = [];

  for (const row of rows) {
    const stateKey = findKey(row, ['state']);
    const nicknameKey = findKey(row, ['nickname', 'nick name', 'plate', 'slogan']);

    if (!stateKey || !nicknameKey) continue;

    const state = String(row[stateKey]).trim();
    const nickname = String(row[nicknameKey]).trim();

    if (!state || !nickname) continue;
    parsed.push({ state, nickname });
  }

  const dedupeMap = new Map();
  for (const item of parsed) {
    const key = `${item.state.toLowerCase()}|${item.nickname.toLowerCase()}`;
    dedupeMap.set(key, item);
  }

  return [...dedupeMap.values()];
}

function resetGame() {
  score = 0;
  total = 0;
  answered = false;
  currentQuestion = null;
  updateScore();
  feedbackEl.textContent = '';
  feedbackEl.style.color = 'var(--muted)';
  nextBtn.classList.add('hidden');
  quizArea.classList.remove('hidden');
  emptyState.classList.add('hidden');
}

function restartGame() {
  if (entries.length < 4) return;
  const previousState = currentQuestion?.correctState ?? null;
  resetGame();
  buildQuestion(previousState);
}

function buildQuestion(excludeState = null) {
  if (entries.length < 4) return;

  answered = false;
  feedbackEl.textContent = '';
  nextBtn.classList.add('hidden');

  const pool =
    excludeState && entries.some((e) => e.state !== excludeState)
      ? entries.filter((e) => e.state !== excludeState)
      : entries;
  let correct = pool[Math.floor(Math.random() * pool.length)];
  // Try a few times to avoid showing the same nickname twice in a row.
  if (currentQuestion && pool.length > 1) {
    for (let i = 0; i < 8 && correct.nickname === currentQuestion.nickname; i += 1) {
      correct = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  const wrongOptions = shuffleArray(
    entries.filter((e) => e.state !== correct.state).map((e) => e.state)
  ).slice(0, 3);

  const options = shuffleArray([correct.state, ...wrongOptions]);

  currentQuestion = {
    nickname: correct.nickname,
    correctState: correct.state,
    options
  };

  nicknamePrompt.textContent = `“${currentQuestion.nickname}”`;
  renderOptions();
}

function renderOptions() {
  optionsEl.innerHTML = '';

  for (const option of currentQuestion.options) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'answer-btn';
    btn.textContent = option;
    btn.addEventListener('click', () => answer(option, btn));
    optionsEl.appendChild(btn);
  }
}

function answer(selected, button) {
  if (answered) return;
  answered = true;
  total += 1;

  const isCorrect = selected === currentQuestion.correctState;
  if (isCorrect) {
    score += 1;
    button.classList.add('correct');
    feedbackEl.textContent = 'Correct!';
    feedbackEl.style.color = 'var(--ok)';
    playHappyTune();
  } else {
    button.classList.add('wrong');
    feedbackEl.textContent = `Wrong. Correct answer: ${currentQuestion.correctState}`;
    feedbackEl.style.color = 'var(--bad)';
    playSadTune();

    const buttons = [...optionsEl.querySelectorAll('button')];
    const correctBtn = buttons.find((btn) => btn.textContent === currentQuestion.correctState);
    if (correctBtn) correctBtn.classList.add('correct');
  }

  for (const btn of optionsEl.querySelectorAll('button')) {
    btn.disabled = true;
  }

  updateScore();
  nextBtn.classList.remove('hidden');
}

function updateScore() {
  scoreEl.textContent = String(score);
  totalEl.textContent = String(total);
}

function shuffleArray(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function playHappyTune() {
  playSequence([
    { f: 523.25, d: 0.11 },
    { f: 659.25, d: 0.11 },
    { f: 783.99, d: 0.16 }
  ]);
}

function playSadTune() {
  playSequence([
    { f: 392.0, d: 0.15 },
    { f: 349.23, d: 0.2 },
    { f: 293.66, d: 0.24 }
  ]);
}

function playSequence(notes) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  let now = ctx.currentTime;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = note.f;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.d);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + note.d + 0.02);
    now += note.d;
  }

  const tailMs = Math.ceil(notes.reduce((acc, n) => acc + n.d, 0) * 1000) + 100;
  setTimeout(() => ctx.close(), tailMs);
}
