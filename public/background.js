// Debug logging
console.log('Background script loaded');

// Check if running in Chrome
if (typeof chrome === 'undefined' || !chrome.runtime) {
  console.error('Not running in Chrome extension context');
}

// When extension is installed, set up side panel behavior
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  try {
    // Initialize storage
    chrome.storage.local.get(['sabapplier_users'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error initializing storage:', chrome.runtime.lastError);
        return;
      }
      // If no users exist, initialize with empty object
      if (!result.sabapplier_users) {
        chrome.storage.local.set({ sabapplier_users: {} }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error setting initial storage:', chrome.runtime.lastError);
          } else {
            console.log('Storage initialized successfully');
          }
        });
      }
    });

    // Set initial side panel behavior
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .then(() => {
        console.log('Side panel behavior set successfully');
        // Initialize side panel for all existing tabs
        return chrome.tabs.query({});
      })
      .then((tabs) => {
        const promises = tabs.map(tab => 
          chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: "index.html",
            enabled: true
          })
        );
        return Promise.all(promises);
      })
      .then(() => console.log('Side panel initialized for all tabs'))
      .catch(error => console.error('Error during installation:', error));
  } catch (error) {
    console.error('Error in onInstalled:', error);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
  try {
    chrome.sidePanel.open({ tabId: tab.id })
      .then(() => {
        console.log('Side panel opened for tab:', tab.id);
      })
      .catch(error => {
        console.error('Error opening side panel:', error);
      });
  } catch (error) {
    console.error('Error in action click handler:', error);
  }
});

// Enable side panel for each new tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tabId, changeInfo.status);
  if (changeInfo.status === 'complete') {
    try {
      chrome.sidePanel.setOptions({
        tabId,
        path: "index.html",
        enabled: true,
      }).then(() => console.log('Side panel enabled for new tab:', tabId))
        .catch(error => console.error('Error enabling side panel for new tab:', error));
    } catch (error) {
      console.error('Error in onUpdated:', error);
    }
  }
});

// Handle messages from the React app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  if (message.action === "close_panel") {
    console.log('Attempting to close side panel');
    try {
      // Get the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const currentTab = tabs[0];
          
          // Disable the side panel for the current tab
          chrome.sidePanel.setOptions({
            tabId: currentTab.id,
            enabled: false
          }).then(() => {
            console.log('Side panel disabled');
            if (sendResponse) {
              sendResponse({ success: true });
            }
          }).catch(error => {
            console.error('Error closing side panel:', error);
            if (sendResponse) {
              sendResponse({ success: false, error: error.message });
            }
          });
        } else {
          console.error('No active tab found');
          if (sendResponse) {
            sendResponse({ success: false, error: 'No active tab found' });
          }
        }
      });
      // Return true to indicate we will send a response asynchronously
      return true;
    } catch (error) {
      console.error('Error in close_panel handler:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
    }
  }
});
