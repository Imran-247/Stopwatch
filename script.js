// Stopwatch functionality
let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let running = false;

// Storage keys
const THEME_KEY = 'stopwatch_theme'; // 'dark' | 'light' | undefined (system)
const LAPS_KEY = 'stopwatch_laps';

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

// Lap functionality: record lap and persist
lapBtn.addEventListener('click', () => {
	if (running) {
		const lapTime = formatTime(elapsedTime);
		laps.push(lapTime);
		renderLaps();
		saveLaps();
	}
});

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
