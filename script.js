'use strict';

/**
 * Typing Speed Test
 * Vanilla JS, no build step, no external dependencies.
 */

const state = {
  passages: null,
  difficulty: 'hard',
  mode: 'timed',
  currentPassage: '',
  started: false,
  finished: false,
};

const els = {
  passage: document.getElementById('passage'),
  input: document.getElementById('typing-input'),
  statWpm: document.getElementById('stat-wpm'),
  statAccuracy: document.getElementById('stat-accuracy'),
  statTime: document.getElementById('stat-time'),
  difficultyFieldset: document.getElementById('difficulty-fieldset'),
  modeFieldset: document.getElementById('mode-fieldset'),
  overlayStart: document.getElementById('overlay-start'),
  startBtn: document.getElementById('start-btn'),
};

init();

async function init() {
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

  els.difficultyFieldset.addEventListener('change', (event) => {
    state.difficulty = event.target.value;
    if (!state.started) loadNewPassage();
  });

  els.modeFieldset.addEventListener('change', (event) => {
    state.mode = event.target.value;
  });
}

function loadNewPassage() {
  const list = state.passages?.[state.difficulty] ?? [];
  if (list.length === 0) return;

  const random = list[Math.floor(Math.random() * list.length)];
  state.currentPassage = random.text;

  renderPassage('');
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

function computeStats(typed, elapsedSeconds) {
  const target = state.currentPassage;
  let correct = 0;

  for (let i = 0; i < typed.length; i += 1) {
    if (typed[i] === target[i]) correct += 1;
  }

  const elapsedMinutes = Math.max(elapsedSeconds, 1) / 60;
  const wpm = Math.round((correct / 5) / elapsedMinutes);
  const accuracy = typed.length === 0
    ? 100
    : Math.round((correct / typed.length) * 100);

  return { correct, wpm, accuracy, totalTyped: typed.length };
}

function onInput(event) {
  const typed = event.target.value;
  renderPassage(typed);
  // Timer, live stats update and finish handling arrive in the next commit.
}