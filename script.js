// Stopwatch functionality
let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let running = false;

// Storage keys
const THEME_KEY = 'stopwatch_theme'; // 'dark' | 'light' | undefined (system)
const LAPS_KEY = 'stopwatch_laps';
const RUNNING_KEY = 'stopwatch_running';
const START_KEY = 'stopwatch_start'; // timestamp when timer was (re)started
const ELAPSED_KEY = 'stopwatch_elapsed'; // elapsed time in ms when paused or last saved

// DOM elements
const stopwatch = document.getElementById('stopwatch');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('stop');
const resetBtn = document.getElementById('reset');
const lapBtn = document.getElementById('lap');
const lapsList = document.getElementById('laps');
const toggleModeBtn = document.getElementById('toggle-mode');

// In-memory laps array
let laps = [];

// Format time as HH:MM:SS.CSS
function formatTime(ms) {
	const centiseconds = Math.floor((ms % 1000) / 10);
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor(ms / (1000 * 60 * 60));
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

// Update stopwatch display
function updateDisplay() {
	stopwatch.textContent = formatTime(elapsedTime);
}

// Start, Pause, Reset functions
function startTimer() {
	if (!running) {
		running = true;
		startTime = Date.now() - elapsedTime;
		timerInterval = setInterval(() => {
			elapsedTime = Date.now() - startTime;
			updateDisplay();
		}, 10);
	}
}

// Pause function
function pauseTimer() {
	if (running) {
		running = false;
		clearInterval(timerInterval);
	}
}

// Reset function
function resetTimer() {
	running = false;
	clearInterval(timerInterval);
	elapsedTime = 0;
	updateDisplay();
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);

// Reset: stop timer, clear display and laps (both UI and storage)
resetBtn.addEventListener('click', () => {
	resetTimer();
	clearLaps();
	localStorage.removeItem(LAPS_KEY);
	laps = [];
});

// Persist stopwatch state helpers
function saveRunningState() {
	try {
		localStorage.setItem(RUNNING_KEY, running ? '1' : '0');
		if (running) {
			// save the absolute start timestamp so elapsed can be computed after reload
			const startTs = Date.now() - elapsedTime;
			localStorage.setItem(START_KEY, String(startTs));
			localStorage.removeItem(ELAPSED_KEY);
		} else {
			// save elapsed time when paused/stopped
			localStorage.setItem(ELAPSED_KEY, String(elapsedTime));
			localStorage.removeItem(START_KEY);
		}
	} catch (err) {
		console.warn('Could not persist stopwatch state', err);
	}
}

// Ensure state is saved when user interacts
// Save on start/pause/reset actions
const origStart = startTimer;
startBtn.removeEventListener('click', startTimer);
startBtn.addEventListener('click', () => { origStart(); saveRunningState(); });

const origPause = pauseTimer;
pauseBtn.removeEventListener('click', pauseTimer);
pauseBtn.addEventListener('click', () => { origPause(); saveRunningState(); });

const origResetHandler = () => {
	// clear persisted stopwatch state as well
	localStorage.removeItem(RUNNING_KEY);
	localStorage.removeItem(START_KEY);
	localStorage.removeItem(ELAPSED_KEY);
};
// wrap the reset listener to also clear state
resetBtn.removeEventListener('click', () => {});
resetBtn.addEventListener('click', () => { origResetHandler(); });

// Lap functionality: record lap and persist
lapBtn.addEventListener('click', () => {
	if (running) {
		const lapTime = formatTime(elapsedTime);
		laps.push(lapTime);
		renderLaps();
		saveLaps();
	}
});

// Also save state periodically (in case browser/tab closes while running)
setInterval(() => {
	if (running) {
		// only need to persist start timestamp (computed from elapsed) and running flag
		try {
			localStorage.setItem(RUNNING_KEY, '1');
			const startTs = Date.now() - elapsedTime;
			localStorage.setItem(START_KEY, String(startTs));
		} catch (err) {
			// ignore
		}
	}
}, 1000);

// Theme handling: use saved preference or system default
function applyTheme(isDark) {
	if (isDark) document.body.classList.add('dark-mode');
	else document.body.classList.remove('dark-mode');
}

function saveThemePreference(value) {
	// value: 'dark' or 'light' or null (remove preference)
	if (value === null) localStorage.removeItem(THEME_KEY);
	else localStorage.setItem(THEME_KEY, value);
}

function initTheme() {
	const saved = localStorage.getItem(THEME_KEY);
	if (saved === 'dark') {
		applyTheme(true);
		toggleModeBtn.checked = true;
	} else if (saved === 'light') {
		applyTheme(false);
		toggleModeBtn.checked = false;
	} else {
		// follow system preference
		const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyTheme(prefersDark);
		toggleModeBtn.checked = prefersDark;
	}
}

// Listen for checkbox changes (toggle via label will trigger this)
toggleModeBtn.addEventListener('change', (e) => {
	const isDark = e.target.checked;
	applyTheme(isDark);
	saveThemePreference(isDark ? 'dark' : 'light');
});

// Laps persistence
function saveLaps() {
	try {
		localStorage.setItem(LAPS_KEY, JSON.stringify(laps));
	} catch (err) {
		console.warn('Could not save laps to localStorage', err);
	}
}

function loadLaps() {
	try {
		const raw = localStorage.getItem(LAPS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (err) {
		console.warn('Could not load laps from localStorage', err);
		return [];
	}
}

function renderLaps() {
	lapsList.innerHTML = '';
	laps.forEach((time, idx) => {
		const li = document.createElement('li');
		li.textContent = `Lap ${idx + 1}: ${time}`;
		lapsList.appendChild(li);
	});
}

function clearLaps() {
	lapsList.innerHTML = '';
}

// Initialize app state
function init() {
	initTheme();
	laps = loadLaps();
	renderLaps();
	// Restore stopwatch state
	try {
		const runningRaw = localStorage.getItem(RUNNING_KEY);
		const savedStart = localStorage.getItem(START_KEY);
		const savedElapsed = localStorage.getItem(ELAPSED_KEY);

		if (runningRaw === '1' && savedStart) {
			// timer was running: compute elapsed based on saved start timestamp
			startTime = Number(savedStart);
			elapsedTime = Date.now() - startTime;
			// start the interval so the timer continues
			running = true;
			timerInterval = setInterval(() => {
				elapsedTime = Date.now() - startTime;
				updateDisplay();
			}, 10);
		} else if (savedElapsed) {
			// timer was paused/stopped: restore elapsed
			elapsedTime = Number(savedElapsed) || 0;
			running = false;
		}
	} catch (err) {
		console.warn('Could not restore stopwatch state', err);
	}

	updateDisplay();

	// If user changes system theme while page is open, respect if they haven't chosen a preference
	if (!localStorage.getItem(THEME_KEY) && window.matchMedia) {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			applyTheme(e.matches);
			toggleModeBtn.checked = e.matches;
		});
	}
}

init();
