// Timer floating window management
let timerWindowId = null;

// Timer state
const TIMER_ALARM_NAME = 'countdown-timer';
const TICK_ALARM_NAME = 'timer-tick';

// Initialize timer state in storage
async function initTimerState() {
  const result = await chrome.storage.local.get('timerState');
  if (!result.timerState) {
    await chrome.storage.local.set({
      timerState: {
        remainingSeconds: 5,
        isRunning: false,
        isPaused: false,
        isFinished: false,
        inputMinutes: 0,
        inputSeconds: 5,
        endTime: null
      }
    });
  }
}

// Get timer state
async function getTimerState() {
  const result = await chrome.storage.local.get('timerState');
  return result.timerState || {
    remainingSeconds: 5,
    isRunning: false,
    isPaused: false,
    isFinished: false,
    inputMinutes: 0,
    inputSeconds: 5,
    endTime: null
  };
}

// Update timer state
async function updateTimerState(updates) {
  const state = await getTimerState();
  const newState = { ...state, ...updates };
  await chrome.storage.local.set({ timerState: newState });
  return newState;
}

// Start timer
async function startTimer(totalSeconds) {
  const endTime = Date.now() + totalSeconds * 1000;
  
  await updateTimerState({
    remainingSeconds: totalSeconds,
    isRunning: true,
    isPaused: false,
    isFinished: false,
    endTime: endTime
  });
  
  // Create alarm for when timer ends
  await chrome.alarms.create(TIMER_ALARM_NAME, {
    when: endTime
  });
  
  // Create tick alarm for updating display every second
  await chrome.alarms.create(TICK_ALARM_NAME, {
    periodInMinutes: 1 / 60 // Every 1 second
  });
  
  // Clear any existing badge
  await chrome.action.setBadgeText({ text: '' });
}

// Pause timer
async function pauseTimer() {
  const state = await getTimerState();
  
  if (state.isRunning && state.endTime) {
    const remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
    
    await chrome.alarms.clear(TIMER_ALARM_NAME);
    await chrome.alarms.clear(TICK_ALARM_NAME);
    
    await updateTimerState({
      remainingSeconds: remaining,
      isRunning: false,
      isPaused: true,
      endTime: null
    });
  }
}

// Resume timer
async function resumeTimer() {
  const state = await getTimerState();
  
  if (state.isPaused && state.remainingSeconds > 0) {
    await startTimer(state.remainingSeconds);
  }
}

// Stop/End timer
async function stopTimer() {
  await chrome.alarms.clear(TIMER_ALARM_NAME);
  await chrome.alarms.clear(TICK_ALARM_NAME);
  
  const state = await getTimerState();
  const totalSeconds = (parseInt(state.inputMinutes) || 0) * 60 + (parseInt(state.inputSeconds) || 5);
  
  await updateTimerState({
    remainingSeconds: totalSeconds,
    isRunning: false,
    isPaused: false,
    isFinished: false,
    endTime: null
  });
  
  await chrome.action.setBadgeText({ text: '' });
}

// Timer finished
async function timerFinished() {
  await chrome.alarms.clear(TIMER_ALARM_NAME);
  await chrome.alarms.clear(TICK_ALARM_NAME);
  
  await updateTimerState({
    remainingSeconds: 0,
    isRunning: false,
    isPaused: false,
    isFinished: true,
    endTime: null
  });
  
  // Show notification
  chrome.notifications.create('timer-finished', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '⏰ タイマー終了！',
    message: 'タイマーが終了しました',
    priority: 2,
    requireInteraction: true
  });
  
  // Set badge
  await chrome.action.setBadgeText({ text: '!' });
  await chrome.action.setBadgeBackgroundColor({ color: '#FF453A' });
}

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TIMER_ALARM_NAME) {
    await timerFinished();
  } else if (alarm.name === TICK_ALARM_NAME) {
    // Update remaining seconds based on end time
    const state = await getTimerState();
    if (state.isRunning && state.endTime) {
      const remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
      await updateTimerState({ remainingSeconds: remaining });
    }
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.action) {
      case 'getState':
        const state = await getTimerState();
        // Recalculate remaining if running
        if (state.isRunning && state.endTime) {
          state.remainingSeconds = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
        }
        sendResponse(state);
        break;
        
      case 'start':
        await startTimer(message.seconds);
        sendResponse({ success: true });
        break;
        
      case 'pause':
        await pauseTimer();
        sendResponse({ success: true });
        break;
        
      case 'resume':
        await resumeTimer();
        sendResponse({ success: true });
        break;
        
      case 'stop':
        await stopTimer();
        sendResponse({ success: true });
        break;
        
      case 'dismiss':
        await stopTimer();
        sendResponse({ success: true });
        break;
        
      case 'updateInputs':
        await updateTimerState({
          inputMinutes: message.minutes,
          inputSeconds: message.seconds
        });
        sendResponse({ success: true });
        break;
    }
  })();
  return true; // Keep channel open for async response
});

// Window management
chrome.action.onClicked.addListener(async () => {
  if (timerWindowId !== null) {
    try {
      const window = await chrome.windows.get(timerWindowId);
      if (window) {
        await chrome.windows.update(timerWindowId, { focused: true });
        return;
      }
    } catch (e) {
      timerWindowId = null;
    }
  }

  const currentWindow = await chrome.windows.getCurrent();
  
  const timerWindow = await chrome.windows.create({
    url: 'timer.html',
    type: 'popup',
    width: 320,
    height: 260,
    left: currentWindow.left + Math.round((currentWindow.width - 320) / 2),
    top: currentWindow.top + 50,
    focused: true
  });

  timerWindowId = timerWindow.id;
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === timerWindowId) {
    timerWindowId = null;
  }
});

// Initialize on install/startup
chrome.runtime.onInstalled.addListener(initTimerState);
chrome.runtime.onStartup.addListener(initTimerState);
