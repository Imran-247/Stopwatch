let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let running = false;


const stopwatch = document.getElementById('stopwatch');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('stop');
const resetBtn = document.getElementById('reset');
const lapBtn = document.getElementById('lap');
const lapsList = document.getElementById('laps');
const toggleModeBtn = document.getElementById('toggle-mode');

function formatTime(ms) {
	const centiseconds = Math.floor((ms % 1000) / 10);
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor(ms / (1000 * 60 * 60));
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function updateDisplay() {
	stopwatch.textContent = formatTime(elapsedTime);
}

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

function pauseTimer() {
	if (running) {
		running = false;
		clearInterval(timerInterval);
	}
}

function resetTimer() {
	running = false;
	clearInterval(timerInterval);
	elapsedTime = 0;
	updateDisplay();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);


// Lap functionality
lapBtn.addEventListener('click', () => {
	if (running) {
		const lapTime = formatTime(elapsedTime);
		const li = document.createElement('li');
		li.textContent = `Lap ${lapsList.children.length + 1}: ${lapTime}`;
		lapsList.appendChild(li);
	}
});

// Dark/Light mode toggle
toggleModeBtn.addEventListener('click', () => {
	document.body.classList.toggle('dark-mode');
});

// Clear laps on reset
function clearLaps() {
	lapsList.innerHTML = '';
}

// Update resetTimer to clear laps
const originalResetTimer = resetTimer;
resetBtn.removeEventListener('click', resetTimer);
resetBtn.addEventListener('click', () => {
	originalResetTimer();
	clearLaps();
});

// Initialize display
updateDisplay();
