// WebCanvas 3.0 LLM - Popup Script
// Simple, direct communication with content script

document.addEventListener('DOMContentLoaded', async function () {

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const openSettingsBtn= document.getElementById('openSettingsBtn');
  const statusIndicator= document.getElementById('statusIndicator');
  const statusText     = document.getElementById('statusText');
  const errorMessage   = document.getElementById('errorMessage');
  const activateBtn    = document.getElementById('activateBtn');
  const deactivateBtn  = document.getElementById('deactivateBtn');
  const clearBtn       = document.getElementById('clearBtn');
  const refreshBtn     = document.getElementById('refreshBtn');
  const analyzeBtn     = document.getElementById('analyzeBtn');
  const suggestBtn     = document.getElementById('suggestBtn');
  const promptBtn      = document.getElementById('promptBtn');
  const aiResponse     = document.getElementById('aiResponse');

  // ── Helpers ───────────────────────────────────────────────────────────────

  function setDrawingUI(active) {
    if (statusIndicator) statusIndicator.className = 'status ' + (active ? 'status-active' : 'status-inactive');
    if (statusText)       statusText.textContent    = active ? 'Active' : 'Inactive';
    if (activateBtn)      activateBtn.classList.toggle('hidden', active);
    if (deactivateBtn)    deactivateBtn.classList.toggle('hidden', !active);
    if (errorMessage)     errorMessage.classList.add('hidden');
  }

  function showError(msg) {
    if (errorMessage) {
      errorMessage.textContent = msg;
      errorMessage.classList.remove('hidden');
    }
  }

  function showAIResult(msg) {
    if (aiResponse) {
      aiResponse.textContent = msg;
      aiResponse.classList.remove('hidden');
    }
  }

  // Get active tab info
  async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return (tabs && tabs[0]) ? tabs[0] : null;
  }

  // Inject content script into a tab if not already present
  async function ensureContentScript(tabId) {
    try {
      // First try to inject the CSS
      await chrome.scripting.insertCSS({ target: { tabId }, files: ['dist/content.css'] });
    } catch (e) { /* CSS may already be injected */ }
    try {
      // Then inject the JS
      await chrome.scripting.executeScript({ target: { tabId }, files: ['dist/content.js'] });
      // Wait a moment for initialization
      await new Promise(r => setTimeout(r, 500));
      return true;
    } catch (e) {
      console.error('Failed to inject content script:', e);
      return false;
    }
  }

  // Send a message to the active tab — auto-injects content script if needed
  async function msgTab(action, callback) {
    const tab = await getActiveTab();
    if (!tab) { callback && callback(null); return; }

    // Check if it's a special page we can't inject into
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
      showError('Cannot draw on this page. Open a regular website first.');
      callback && callback(null);
      return;
    }

    // Try sending message
    chrome.tabs.sendMessage(tab.id, { action }, async function (resp) {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready, injecting...', chrome.runtime.lastError.message);
        // Content script not loaded — inject it
        const injected = await ensureContentScript(tab.id);
        if (injected) {
          // Retry the message after injection
          chrome.tabs.sendMessage(tab.id, { action }, function (resp2) {
            if (chrome.runtime.lastError) {
              console.warn('Still failed after injection:', chrome.runtime.lastError.message);
              callback && callback(null);
            } else {
              callback && callback(resp2);
            }
          });
        } else {
          callback && callback(null);
        }
      } else {
        callback && callback(resp);
      }
    });
  }

  // Send a message to the extension background service worker.
  // This is required for actions like activation where background.js handles
  // special cases (e.g. `about:blank` -> open drawing tab).
  async function msgBackground(action, callback) {
    chrome.runtime.sendMessage({ action }, function(resp) {
      callback && callback(resp);
    });
  }

  // ── Open Settings ─────────────────────────────────────────────────────────
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      // Open settings in the same extension popup view.
      window.location.href = 'settings.html';
    });
  }

  // ── Activate Drawing ──────────────────────────────────────────────────────
  if (activateBtn) {
    activateBtn.addEventListener('click', async function () {
      showError(''); // Clear previous error
      msgBackground('activateDrawing', function (resp) {
        if (resp && resp.success) {
          setDrawingUI(true);
        } else {
          // Fallback: try toggleDrawing
          msgBackground('toggleDrawing', function (r) {
            if (r && r.success) {
              setDrawingUI(true);
            } else {
              showError('Could not activate. Please refresh the page (⌘+R) and try again.');
            }
          });
        }
      });
    });
  }

  // ── Deactivate Drawing ────────────────────────────────────────────────────
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', function () {
      msgBackground('deactivateDrawing', function () {
        setDrawingUI(false);
      });
    });
  }

  // ── Clear Canvas ──────────────────────────────────────────────────────────
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      msgTab('clearCanvas', null);
    });
  }

  // ── Refresh Tab ─────────────────────────────────────────────────────
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async function () {
      const tab = await getActiveTab();
      if (tab) {
        chrome.tabs.reload(tab.id);
      }
      window.close();
    });
  }

  // ── AI: Analyze Drawing ───────────────────────────────────────────────────
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', function () {
      showAIResult('🔍 Analyzing…');
      msgTab('analyzeDrawing', function (resp) {
        if (resp && resp.result)      showAIResult(resp.result);
        else if (resp && resp.error)  showAIResult('❌ ' + resp.error);
        else                          showAIResult('❌ No response — activate drawing first (⌥+D).');
      });
    });
  }

  // ── AI: Get Suggestions ───────────────────────────────────────────────────
  if (suggestBtn) {
    suggestBtn.addEventListener('click', function () {
      showAIResult('💡 Getting suggestions…');
      msgTab('getSuggestions', function (resp) {
        if (resp && resp.result)      showAIResult(resp.result);
        else if (resp && resp.error)  showAIResult('❌ ' + resp.error);
        else                          showAIResult('❌ No response — activate drawing first (⌥+D).');
      });
    });
  }

  // ── AI: Generate Prompt ───────────────────────────────────────────────────
  if (promptBtn) {
    promptBtn.addEventListener('click', function () {
      showAIResult('✨ Generating prompt…');
      msgTab('generatePrompt', function (resp) {
        if (resp && resp.result)      showAIResult(resp.result);
        else if (resp && resp.error)  showAIResult('❌ ' + resp.error);
        else                          showAIResult('❌ No response.');
      });
    });
  }

  // ── Check drawing state on open ───────────────────────────────────────────
  setDrawingUI(false);

});
