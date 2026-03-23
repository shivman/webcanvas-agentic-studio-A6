document.addEventListener('DOMContentLoaded', async () => {
  const artStyleInput = document.getElementById('artStyle');
  const topicsInput = document.getElementById('topics');
  const skillLevelInput = document.getElementById('skillLevel');
  const saveButton = document.getElementById('savePreferences');
  const backButton = document.getElementById('backToMain');
  const statusDiv = document.getElementById('status');

  // Load saved preferences
  try {
    const result = await chrome.storage.sync.get(['userPreferences']);
    if (result.userPreferences) {
      artStyleInput.value = result.userPreferences.art_style || '';
      topicsInput.value = result.userPreferences.favorite_topics || '';
      skillLevelInput.value = result.userPreferences.skill_level || 'beginner';
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }

  // Save logic
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const prefs = {
        art_style: artStyleInput.value.trim(),
        favorite_topics: topicsInput.value.trim(),
        skill_level: skillLevelInput.value
      };
      
      try {
        await chrome.storage.sync.set({ userPreferences: prefs });
        showStatus('✅ Preferences saved! The agent will now use these.', 'success');
        
        chrome.runtime.sendMessage({ 
          action: 'preferencesUpdated',
          preferences: prefs 
        });
      } catch (error) {
        showStatus('Error saving preferences: ' + error.message, 'error');
      }
    });
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'popup.html';
    });
  }

  function showStatus(message, type) {
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = type;
      statusDiv.style.display = 'block';
    }
  }
});