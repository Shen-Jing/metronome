class Metronome {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.current16thNote = 0; // Current subdivision index
    this.nextNoteTime = 0.0;  // When the next note is due.
    this.timerWorker = null;  // For lookahead
    this.lookahead = 25.0;    // How frequently to call scheduling function (in milliseconds)
    this.scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

    // Settings
    this.bpm = 100;
    this.patternLength = 4;      // Total steps in the pattern loop
    this.stepsPerBeat = 4;       // How many steps make up 1 Beat Unit
    this.pattern = [true, false, false, false];
    this.accentFirstBeat = true;

    // UI Callbacks
    this.onBeatCallback = null;
  }

  init() {
    // We initialize AudioContext on user interaction
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    // Total time per beat / stepsPerBeat = time per step
    const secondsPerStep = secondsPerBeat / this.stepsPerBeat;

    this.nextNoteTime += secondsPerStep;

    this.current16thNote++;
    if (this.current16thNote >= this.patternLength) {
      this.current16thNote = 0;
    }
  }

  scheduleNote(beatNumber, time) {
    // Play sound if the pattern at this index is active
    if (this.pattern[beatNumber]) {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Distinct sound for the "1" if needed, but per requirement, it's custom pattern.
      // Check if we should accent the first beat (index 0)

      if (this.accentFirstBeat && beatNumber === 0) {
        osc.frequency.value = 880.0;
      } else {
        osc.frequency.value = 440.0;
      }

      // Envelope to make it clicky
      gainNode.gain.setValueAtTime(1, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      osc.start(time);
      osc.stop(time + 0.1);
    }

    // Visual Sync
    // We use a draw callback to update UI. 
    // Note: Audio time is precise, Visuals might lag. 
    // We can't update UI *exactly* here from the thread, but we can schedule/request it.
    // For simplicity in main thread JS, we can just call the callback.
    // To be precise visually, strictly we'd compare audioContext.currentTime in a requestAnimationFrame loop.
    // But for this simple app, simply setting a timeout to match the audio time is "good enough" for visual indicators usually.
    // Better: store the valid scheduled notes in a queue and have rAF check them.
  }

  scheduler() {
    // while there are notes that will need to be played before the next interval, schedule them and advance the pointer.
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);

      // Queue visual update
      if (this.onBeatCallback) {
        // Calculate delay until this note plays
        const delay = (this.nextNoteTime - this.audioContext.currentTime) * 1000;
        // Capture index
        const noteIndex = this.current16thNote;
        setTimeout(() => {
          this.onBeatCallback(noteIndex);
        }, Math.max(0, delay));
      }

      this.nextNote();
    }

    if (this.isPlaying) {
      this.timerID = window.setTimeout(this.scheduler.bind(this), this.lookahead);
    }
  }

  start() {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      this.init();
    }
    // Unlock mobile audio
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.1;
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    window.clearTimeout(this.timerID);
  }

  setPatternLength(count) {
    if (count < 1) count = 1;
    if (count > 128) count = 128; // Max limit

    const newPattern = [];
    for (let i = 0; i < count; i++) {
      if (i < this.pattern.length) {
        newPattern.push(this.pattern[i]);
      } else {
        newPattern.push(false);
      }
    }

    this.patternLength = count;
    this.pattern = newPattern;
  }

  setStepsPerBeat(count) {
    if (count < 1) count = 1;
    if (count > 32) count = 32;
    this.stepsPerBeat = count;
  }

  togglePatternIndex(index) {
    if (index >= 0 && index < this.pattern.length) {
      this.pattern[index] = !this.pattern[index];
    }
  }
}

// --- App Logic ---

const metronome = new Metronome();

// Elements
const playBtn = document.getElementById('play-btn');
const playIcon = playBtn.querySelector('.play-icon');
const stopIcon = playBtn.querySelector('.stop-icon');
const bpmInput = document.getElementById('bpm-input');
const bpmSlider = document.getElementById('bpm-slider');
const bpmIncrease = document.getElementById('bpm-increase');
const bpmDecrease = document.getElementById('bpm-decrease');
const subBpmInput = document.getElementById('sub-bpm-input');

// Pattern Length Inputs
const patLengthInput = document.getElementById('pattern-length-input');
const patIncrease = document.getElementById('pat-increase');
const patDecrease = document.getElementById('pat-decrease');

// Steps Per Beat Inputs
const spbInput = document.getElementById('steps-per-beat-input');
const spbIncrease = document.getElementById('spb-increase');
const spbDecrease = document.getElementById('spb-decrease');

const patternGrid = document.getElementById('pattern-grid');
const accentToggle = document.getElementById('accent-toggle');

// Presets
const presetNameInput = document.getElementById('preset-name-input');
const savePresetBtn = document.getElementById('save-preset-btn');
const presetList = document.getElementById('preset-list');
const PRESETS_KEY = 'metronomePresetsMap';

// State
let currentPatternLength = 4;
let currentStepsPerBeat = 4;

// Init
metronome.setPatternLength(currentPatternLength);
metronome.setStepsPerBeat(currentStepsPerBeat);

loadSettings();
renderPresetList();

// Sync UI toggle with default state
accentToggle.checked = metronome.accentFirstBeat;
renderGrid();

function saveSettings() {
  const settings = {
    bpm: metronome.bpm,
    patternLength: currentPatternLength,
    stepsPerBeat: currentStepsPerBeat,
    pattern: metronome.pattern,
    accent: metronome.accentFirstBeat
  };
  localStorage.setItem('metronomeSettings', JSON.stringify(settings));
}

function loadSettings() {
  const saved = localStorage.getItem('metronomeSettings');
  if (!saved) return;

  try {
    const settings = JSON.parse(saved);

    // Restore BPM
    if (settings.bpm) {
      updateBPM(settings.bpm);
    }

    // Restore Global Counts
    if (settings.patternLength) {
      currentPatternLength = settings.patternLength;
      patLengthInput.value = currentPatternLength;
      metronome.setPatternLength(currentPatternLength);
    }

    if (settings.stepsPerBeat) {
      currentStepsPerBeat = settings.stepsPerBeat;
      spbInput.value = currentStepsPerBeat;
      metronome.setStepsPerBeat(currentStepsPerBeat);
    }

    // Restore Pattern Layout
    // We override whatever default resizing logic did if we have a saved pattern of correct length
    if (settings.pattern && Array.isArray(settings.pattern)) {
      if (settings.pattern.length === currentPatternLength) {
        metronome.pattern = settings.pattern;
      }
    }

    // Restore Accent
    if (typeof settings.accent === 'boolean') {
      metronome.accentFirstBeat = settings.accent;
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

// --- Presets Logic ---

function getPresets() {
  const saved = localStorage.getItem(PRESETS_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

function savePreset() {
  const name = presetNameInput.value.trim();
  if (!name) return;

  const presets = getPresets();
  const settings = {
    bpm: metronome.bpm,
    patternLength: currentPatternLength,
    stepsPerBeat: currentStepsPerBeat,
    pattern: metronome.pattern,
    accent: metronome.accentFirstBeat
  };

  presets[name] = settings;
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));

  presetNameInput.value = ''; // Clear input
  renderPresetList();
}

function loadPreset(name) {
  const presets = getPresets();
  const settings = presets[name];
  if (!settings) return;

  // Utilize existing logic from loadSettings, but apply immediately
  if (settings.bpm) updateBPM(settings.bpm);

  if (settings.patternLength) {
    updatePatternLength(0, settings.patternLength);
  }

  if (settings.stepsPerBeat) {
    updateStepsPerBeat(0, settings.stepsPerBeat);
  }

  if (settings.pattern && Array.isArray(settings.pattern)) {
    // Ensure length matches current (which we just set)
    if (settings.pattern.length === currentPatternLength) {
      metronome.pattern = settings.pattern;
    }
  }

  if (typeof settings.accent === 'boolean') {
    metronome.accentFirstBeat = settings.accent;
    accentToggle.checked = settings.accent;
  }

  renderGrid();
  saveSettings(); // Save as "last used" immediately
}

function deletePreset(name) {
  const presets = getPresets();
  delete presets[name];
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  renderPresetList();
}

function renderPresetList() {
  const presets = getPresets();
  const names = Object.keys(presets).sort();

  presetList.innerHTML = '';

  names.forEach(name => {
    const li = document.createElement('li');
    li.className = 'preset-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'preset-name';
    nameSpan.textContent = name;
    nameSpan.onclick = () => loadPreset(name);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.innerHTML = '×'; // or icon
    deleteBtn.title = 'Delete Preset';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete preset "${name}"?`)) {
        deletePreset(name);
      }
    };

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    presetList.appendChild(li);
  });
}

function updatePlayButton() {
  if (metronome.isPlaying) {
    playIcon.style.display = 'none';
    stopIcon.style.display = 'inline';
    playBtn.classList.add('playing');
  } else {
    playIcon.style.display = 'inline';
    stopIcon.style.display = 'none';
    playBtn.classList.remove('playing');
  }
}

function updateBPM(val) {
  let bpm = parseFloat(val);
  if (isNaN(bpm)) bpm = 100;

  if (bpm < 1) bpm = 1;
  if (bpm > 300) bpm = 300;

  metronome.bpm = bpm;

  // Update inputs
  bpmInput.value = Number.isInteger(bpm) ? bpm : bpm.toFixed(2);
  bpmSlider.value = bpm;

  // Update Sub BPM Display
  // SubBPM = MainBPM * StepsPerBeat
  subBpmInput.value = Math.round(bpm * currentStepsPerBeat);
  saveSettings();
}

function updateSubBPM(val) {
  let subBpm = parseFloat(val);
  if (isNaN(subBpm)) subBpm = metronome.bpm * currentStepsPerBeat;

  // Calculate Main BPM
  // Main = Sub / StepsPerBeat
  let newMainBpm = subBpm / currentStepsPerBeat;

  if (newMainBpm < 1) newMainBpm = 1;
  if (newMainBpm > 300) newMainBpm = 300;

  updateBPM(newMainBpm);
}

function updatePatternLength(delta, exactVal = null) {
  let newVal;
  if (exactVal !== null) {
    newVal = parseInt(exactVal);
  } else {
    newVal = currentPatternLength + delta;
  }

  if (isNaN(newVal)) newVal = 4;
  if (newVal < 1) newVal = 1;
  if (newVal > 128) newVal = 128;

  currentPatternLength = newVal;
  patLengthInput.value = currentPatternLength;
  metronome.setPatternLength(currentPatternLength);

  renderGrid();
  saveSettings();
}

function updateStepsPerBeat(delta, exactVal = null) {
  let newVal;
  if (exactVal !== null) {
    newVal = parseInt(exactVal);
  } else {
    newVal = currentStepsPerBeat + delta;
  }

  if (isNaN(newVal)) newVal = 4;
  if (newVal < 1) newVal = 1;
  if (newVal > 32) newVal = 32;

  currentStepsPerBeat = newVal;
  spbInput.value = currentStepsPerBeat;
  metronome.setStepsPerBeat(currentStepsPerBeat);

  // Refresh Sub BPM Display since ratio changed
  subBpmInput.value = Math.round(metronome.bpm * currentStepsPerBeat);
  saveSettings();
}

function renderGrid() {
  patternGrid.innerHTML = '';
  metronome.pattern.forEach((isActive, index) => {
    const cell = document.createElement('div');
    cell.className = `grid-cell ${isActive ? 'active' : ''}`;
    cell.dataset.index = index;

    // Add number label? Maybe too crowded. Let's just rely on position.
    // Actually, user said "1, 3, 4, 7", so numbers helps.
    cell.innerText = index + 1;
    cell.style.color = isActive ? '#0f172a' : '#64748b';
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.justifyContent = 'center';
    cell.style.fontSize = '0.9rem';
    cell.style.fontWeight = 'bold';

    cell.addEventListener('click', () => {
      metronome.togglePatternIndex(index);
      renderGrid(); // Re-render to show active state
      saveSettings();
    });
    patternGrid.appendChild(cell);
  });
}

// Visual Callback from Engine
metronome.onBeatCallback = (index) => {
  // Clear previous playing
  const cells = patternGrid.querySelectorAll('.grid-cell');
  cells.forEach(c => c.classList.remove('playing'));

  // Highlight current
  if (cells[index]) {
    cells[index].classList.add('playing');
  }
};

// Event Listeners
playBtn.addEventListener('click', () => {
  if (metronome.isPlaying) {
    metronome.stop();
  } else {
    metronome.start();
  }
  updatePlayButton();
});

bpmSlider.addEventListener('input', (e) => updateBPM(e.target.value));
bpmInput.addEventListener('change', (e) => updateBPM(e.target.value));

bpmIncrease.addEventListener('click', () => updateBPM(metronome.bpm + 1));
bpmDecrease.addEventListener('click', () => updateBPM(metronome.bpm - 1));
subBpmInput.addEventListener('change', (e) => updateSubBPM(e.target.value));

patIncrease.addEventListener('click', () => updatePatternLength(1));
patDecrease.addEventListener('click', () => updatePatternLength(-1));
patLengthInput.addEventListener('change', (e) => updatePatternLength(0, e.target.value));

spbIncrease.addEventListener('click', () => updateStepsPerBeat(1));
spbDecrease.addEventListener('click', () => updateStepsPerBeat(-1));
spbInput.addEventListener('change', (e) => updateStepsPerBeat(0, e.target.value));

accentToggle.addEventListener('change', (e) => {
  metronome.accentFirstBeat = e.target.checked;
  saveSettings();
});

savePresetBtn.addEventListener('click', savePreset);
presetNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') savePreset();
});
