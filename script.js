'use strict';

/**
 * Typing Speed Test
 * Vanilla JS, no build step, no external dependencies.
 */

const STORAGE_KEY = 'typing-speed-test:personal-best';
const TIMED_DURATION_SECONDS = 60;

const state = {
  passages: null,
  difficulty: 'hard',
  mode: 'timed',
  currentPassage: '',
  started: false,
  finished: false,
  startTime: null,
  timerId: null,
  elapsedSeconds: 0,
};

const els = {
  passage: document.getElementById('passage'),
  input: document.getElementById('typing-input'),
  overlayStart: document.getElementById('overlay-start'),
  overlayComplete: document.getElementById('overlay-complete'),
  startBtn: document.getElementById('start-btn'),
  goAgainBtn: document.getElementById('go-again-btn'),
  restartBtn: document.getElementById('restart-btn'),
  statWpm: document.getElementById('stat-wpm'),
  statAccuracy: document.getElementById('stat-accuracy'),
  statTime: document.getElementById('stat-time'),
  resultWpm: document.getElementById('result-wpm'),
  resultAccuracy: document.getElementById('result-accuracy'),
  resultCharacters: document.getElementById('result-characters'),
  completeMessage: document.getElementById('complete-message'),
  personalBest: document.getElementById('personal-best'),
  personalBestValue: document.getElementById('personal-best-value'),
  personalBestIcon: document.getElementById('personal-best-icon'),
  difficultyFieldset: document.getElementById('difficulty-fieldset'),
  modeFieldset: document.getElementById('mode-fieldset'),
};

init();

async function init() {
  renderPersonalBest();
  bindEvents();

  try {
    state.passages = await loadPassages();
  } catch (error) {
    els.passage.textContent =
      'Could not load the passages. Please serve this project from a local ' +
      'web server (fetch of data.json is blocked on the file:// protocol).';
    console.error('Failed to load data.json:', error);
    return;
  }

  loadNewPassage();
}

async function loadPassages() {
  const response = await fetch('./data.json');
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

function bindEvents() {
  els.startBtn.addEventListener('click', () => els.input.focus());
  els.passage.addEventListener('click', () => els.input.focus());

  els.input.addEventListener('input', onInput);

  els.restartBtn.addEventListener('click', resetTest);
  els.goAgainBtn.addEventListener('click', resetTest);

  els.difficultyFieldset.addEventListener('change', (event) => {
    state.difficulty = event.target.value;
    if (!state.started) {
      loadNewPassage();
    }
  });

  els.modeFieldset.addEventListener('change', (event) => {
    state.mode = event.target.value;
    if (!state.started) {
      renderStatsPlaceholder();
    }
  });
}

function loadNewPassage() {
  const list = state.passages?.[state.difficulty] ?? [];
  if (list.length === 0) return;

  const random = list[Math.floor(Math.random() * list.length)];
  state.currentPassage = random.text;

  renderPassage('');
  renderStatsPlaceholder();
}

function renderStatsPlaceholder() {
  els.statWpm.textContent = '0';
  els.statAccuracy.textContent = '100%';
  els.statTime.textContent =
    state.mode === 'timed' ? `0:${TIMED_DURATION_SECONDS}` : '0:00';
}

function renderPassage(typed) {
  const target = state.currentPassage;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < target.length; i += 1) {
    const span = document.createElement('span');
    span.textContent = target[i];

    if (i < typed.length) {
      span.classList.add(
        typed[i] === target[i] ? 'char--correct' : 'char--incorrect'
      );
    } else if (i === typed.length) {
      span.classList.add('char--current');
    }

    fragment.appendChild(span);
  }

  els.passage.replaceChildren(fragment);
}

function onInput(event) {
  const typed = event.target.value;

  if (!state.started) {
    startTest();
  }

  renderPassage(typed);
  updateLiveStats(typed);

  const isTimedOver = state.mode === 'timed' && state.elapsedSeconds >= TIMED_DURATION_SECONDS;
  const isPassageDone = typed.length >= state.currentPassage.length;

  if (isTimedOver || isPassageDone) {
    finishTest(typed);
  }
}

function startTest() {
  state.started = true;
  state.startTime = Date.now();
  els.overlayStart.hidden = true;
  toggleOptionInputs(true);

  state.timerId = window.setInterval(tick, 250);
}

function tick() {
  state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);

  if (state.mode === 'timed') {
    const remaining = Math.max(TIMED_DURATION_SECONDS - state.elapsedSeconds, 0);
    els.statTime.textContent = formatTime(remaining);

    if (remaining <= 0) {
      finishTest(els.input.value);
    }
  } else {
    els.statTime.textContent = formatTime(state.elapsedSeconds);
  }
}

function updateLiveStats(typed) {
  const { wpm, accuracy } = computeStats(typed);
  els.statWpm.textContent = String(wpm);
  els.statAccuracy.textContent = `${accuracy}%`;
}

function computeStats(typed) {
  const target = state.currentPassage;
  let correct = 0;

  for (let i = 0; i < typed.length; i += 1) {
    if (typed[i] === target[i]) correct += 1;
  }

  const elapsedMinutes = Math.max(state.elapsedSeconds, 1) / 60;
  const wpm = Math.round((correct / 5) / elapsedMinutes);
  const accuracy = typed.length === 0
    ? 100
    : Math.round((correct / typed.length) * 100);

  return { correct, wpm, accuracy, totalTyped: typed.length };
}

function finishTest(typed) {
  if (state.finished) return;
  state.finished = true;

  window.clearInterval(state.timerId);
  els.input.disabled = true;

  const { correct, wpm, accuracy, totalTyped } = computeStats(typed);
  const incorrect = totalTyped - correct;
  const isNewRecord = updatePersonalBest(wpm);

  els.resultWpm.textContent = String(wpm);
  els.resultAccuracy.textContent = `${accuracy}%`;
  els.resultCharacters.textContent = `${correct}/${incorrect}`;

  els.completeMessage.textContent = isNewRecord
    ? 'New personal best! Great job pushing your limits.'
    : 'Solid run. Keep pushing to beat your high score.';

  els.overlayComplete.hidden = false;
  els.overlayComplete.focus?.();
}

function updatePersonalBest(wpm) {
  const previousBest = getPersonalBest();
  const isNewRecord = wpm > previousBest;

  if (isNewRecord) {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(wpm));
    } catch (error) {
      console.warn('Could not persist personal best:', error);
    }
    renderPersonalBest(wpm, true);
  }

  return isNewRecord;
}

function getPersonalBest() {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch (error) {
    return 0;
  }
}

function renderPersonalBest(explicitValue, isNewRecord = false) {
  const best = explicitValue ?? getPersonalBest();
  els.personalBestValue.textContent = best > 0 ? `${best} WPM` : '\u2014 WPM';
  els.personalBest.classList.toggle('is-new-record', isNewRecord);
  els.personalBestIcon.src = isNewRecord
    ? './assets/images/icon-new-pb.svg'
    : './assets/images/icon-personal-best.svg';
}

function toggleOptionInputs(disabled) {
  els.difficultyFieldset.querySelectorAll('input').forEach((input) => {
    input.disabled = disabled;
  });
  els.modeFieldset.querySelectorAll('input').forEach((input) => {
    input.disabled = disabled;
  });
}

function resetTest() {
  window.clearInterval(state.timerId);

  state.started = false;
  state.finished = false;
  state.startTime = null;
  state.elapsedSeconds = 0;

  els.input.value = '';
  els.input.disabled = false;
  els.overlayComplete.hidden = true;
  els.overlayStart.hidden = false;

  toggleOptionInputs(false);
  renderPersonalBest();
  loadNewPassage();
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}