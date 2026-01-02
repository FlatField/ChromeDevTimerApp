// Timer floating window management
let timerWindowId = null;

chrome.action.onClicked.addListener(async () => {
  // Check if timer window already exists
  if (timerWindowId !== null) {
    try {
      const window = await chrome.windows.get(timerWindowId);
      if (window) {
        // Focus existing window
        await chrome.windows.update(timerWindowId, { focused: true });
        return;
      }
    } catch (e) {
      // Window doesn't exist anymore
      timerWindowId = null;
    }
  }

  // Get current window to position the timer near the top
  const currentWindow = await chrome.windows.getCurrent();
  
  // Create floating timer window
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

// Clean up when window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === timerWindowId) {
    timerWindowId = null;
  }
});

