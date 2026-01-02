// Timer state
let timerInterval = null;
let remainingSeconds = 0;
let isRunning = false;
let isPaused = false;

// DOM elements
const timeDisplay = document.getElementById('time-display');
const minutesInput = document.getElementById('minutes-input');
const secondsInput = document.getElementById('seconds-input');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const timerContainer = document.querySelector('.timer-container');
const normalControls = document.getElementById('normal-controls');
const alarmControls = document.getElementById('alarm-controls');
const dismissBtn = document.getElementById('dismiss-btn');

// Audio context for alarm sound
let audioContext = null;

// Format time display (converts 60+ minutes to hours:minutes)
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update display
function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
}

// Get total seconds from inputs
function getTotalSecondsFromInputs() {
  const minutes = parseInt(minutesInput.value) || 0;
  const seconds = parseInt(secondsInput.value) || 0;
  return minutes * 60 + seconds;
}

// Start timer
function startTimer() {
  // Stop any existing alarm
  stopAlarm();
  
  if (isPaused) {
    // Resume from pause
    isPaused = false;
  } else {
    // Start fresh
    remainingSeconds = getTotalSecondsFromInputs();
    if (remainingSeconds <= 0) {
      remainingSeconds = 5; // Default to 5 seconds if nothing set
    }
  }
  
  isRunning = true;
  timeDisplay.className = 'running';
  timerContainer.classList.remove('finished');
  startBtn.textContent = 'Start';
  startBtn.disabled = true;
  stopBtn.disabled = false;
  stopBtn.textContent = 'Stop';
  stopBtn.className = 'btn btn-secondary';
  minutesInput.disabled = true;
  secondsInput.disabled = true;
  
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateDisplay();
    
    if (remainingSeconds <= 0) {
      timerFinished();
    }
  }, 1000);
  
  updateDisplay();
}

// Stop/Pause timer
function stopTimer() {
  if (stopBtn.textContent === 'End Timer') {
    // End Timer pressed - reset everything
    endTimer();
    return;
  }
  
  // Pause timer
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused = true;
  
  timeDisplay.className = 'paused';
  startBtn.disabled = false;
  startBtn.textContent = 'Resume';
  stopBtn.textContent = 'End Timer';
  stopBtn.className = 'btn btn-end';
}

// End timer completely
function endTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused = false;
  
  remainingSeconds = getTotalSecondsFromInputs();
  
  timeDisplay.className = '';
  updateDisplay();
  
  startBtn.disabled = false;
  startBtn.textContent = 'Start';
  stopBtn.disabled = true;
  stopBtn.textContent = 'Stop';
  stopBtn.className = 'btn btn-secondary';
  minutesInput.disabled = false;
  secondsInput.disabled = false;
}

// Timer finished
function timerFinished() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused = false;
  remainingSeconds = 0;
  
  timeDisplay.className = 'finished';
  timerContainer.classList.add('finished');
  updateDisplay();
  
  // Show alarm controls, hide normal controls
  normalControls.style.display = 'none';
  alarmControls.style.display = 'flex';
  minutesInput.disabled = true;
  
  // Show Chrome notification
  showNotification();
  
  // Set badge on extension icon
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF453A' });
  
  // Play alarm sound repeatedly
  playAlarmSound();
}

// Show desktop notification
function showNotification() {
  chrome.notifications.create('timer-finished', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '⏰ タイマー終了！',
    message: 'タイマーが終了しました',
    priority: 2,
    requireInteraction: true
  });
}

// Play alarm sound using Web Audio API
let alarmInterval = null;
let isAlarmPlaying = false;

function playBeep(frequency = 880, duration = 200) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (e) {
    console.log('Audio error:', e);
  }
}

function playAlarmSound() {
  isAlarmPlaying = true;
  let count = 0;
  const maxCount = 10; // Play 10 times
  
  function playPattern() {
    if (!isAlarmPlaying) return;
    
    // Play a pattern: beep-beep-beep
    playBeep(880, 150);
    setTimeout(() => playBeep(880, 150), 200);
    setTimeout(() => playBeep(1100, 300), 400);
  }
  
  playPattern();
  alarmInterval = setInterval(() => {
    count++;
    if (count >= maxCount || !isAlarmPlaying) {
      clearInterval(alarmInterval);
      alarmInterval = null;
      isAlarmPlaying = false;
      return;
    }
    playPattern();
  }, 1000);
}

// Stop alarm when user interacts
function stopAlarm() {
  isAlarmPlaying = false;
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  timerContainer.classList.remove('finished');
  chrome.action.setBadgeText({ text: '' });
  chrome.notifications.clear('timer-finished');
}

// Dismiss alarm and return to normal input screen
function dismissAlarm() {
  stopAlarm();
  
  // Reset to initial state
  remainingSeconds = getTotalSecondsFromInputs();
  
  timeDisplay.className = '';
  updateDisplay();
  
  // Show normal controls, hide alarm controls
  normalControls.style.display = 'flex';
  alarmControls.style.display = 'none';
  
  startBtn.disabled = false;
  startBtn.textContent = 'Start';
  stopBtn.disabled = true;
  stopBtn.textContent = 'Stop';
  stopBtn.className = 'btn btn-secondary';
  minutesInput.disabled = false;
  secondsInput.disabled = false;
}

// Save state to storage
function saveState() {
  chrome.storage.local.set({
    timerState: {
      remainingSeconds,
      isRunning,
      isPaused,
      inputMinutes: minutesInput.value,
      inputSeconds: secondsInput.value
    }
  });
}

// Load state from storage
async function loadState() {
  try {
    const result = await chrome.storage.local.get('timerState');
    if (result.timerState) {
      const state = result.timerState;
      minutesInput.value = state.inputMinutes || 0;
      secondsInput.value = state.inputSeconds || 5;
      if (state.isPaused) {
        remainingSeconds = state.remainingSeconds;
        isPaused = true;
        timeDisplay.className = 'paused';
        updateDisplay();
        startBtn.textContent = 'Resume';
        stopBtn.disabled = false;
        stopBtn.textContent = 'End Timer';
        stopBtn.className = 'btn btn-end';
        minutesInput.disabled = true;
        secondsInput.disabled = true;
      } else {
        remainingSeconds = getTotalSecondsFromInputs();
        updateDisplay();
      }
    } else {
      remainingSeconds = getTotalSecondsFromInputs();
      updateDisplay();
    }
  } catch (e) {
    remainingSeconds = getTotalSecondsFromInputs();
    updateDisplay();
  }
}

// Event listeners
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
dismissBtn.addEventListener('click', dismissAlarm);

function onInputChange() {
  if (!isRunning && !isPaused) {
    remainingSeconds = getTotalSecondsFromInputs();
    updateDisplay();
  }
}

minutesInput.addEventListener('input', onInputChange);
secondsInput.addEventListener('input', onInputChange);

minutesInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !isRunning) {
    startTimer();
  }
});

secondsInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !isRunning) {
    startTimer();
  }
});

// Save state periodically and before unload
setInterval(saveState, 5000);
window.addEventListener('beforeunload', saveState);

// Initialize
loadState();

