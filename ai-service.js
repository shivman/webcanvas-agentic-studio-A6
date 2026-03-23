class AIService {
  constructor() {
    this.preferences = {
      art_style: "",
      favorite_topics: "",
      skill_level: "beginner"
    };
    this.setupMessageListener();
    this.loadPreferences();
  }

  async loadPreferences() {
    try {
      const result = await chrome.storage.sync.get(['userPreferences']);
      if (result.userPreferences) {
        this.preferences = result.userPreferences;
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  async getImageFromCanvas(canvas) {
    try {
      const imageData = canvas.toDataURL('image/png');
      return imageData.split(',')[1];
    } catch (error) {
      console.error('Error converting canvas to image:', error);
      throw error;
    }
  }

  async callAgent(taskType, base64Image = null) {
    await this.loadPreferences();
    
    const payload = {
      task_type: taskType,
      image_base64: base64Image,
      preferences: this.preferences
    };

    try {
      const response = await fetch('http://localhost:8000/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errortext = await response.text();
        throw new Error(`Backend Error ${response.status}: ${errortext}`);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('Agent call failed:', error);
      throw error;
    }
  }

  async analyzeDrawing(canvas) {
    try {
      const base64Image = await this.getImageFromCanvas(canvas);
      const data = await this.callAgent('analyze', base64Image);
      
      return `Reasoning (${data.reasoning.reasoning_type}):
- Observation: ${data.reasoning.observe}
- Hypothesis: ${data.reasoning.hypothesize}
- Self Check: ${data.reasoning.self_check}
- Fallback: ${data.reasoning.fallback}

Final Result:
- Content: ${data.final_result.content}
- Style: ${data.final_result.style}
- Meaning: ${data.final_result.meaning}`;

    } catch (error) {
      return `Error analyzing drawing: ${error.message}`;
    }
  }

  async getSuggestions(canvas) {
    try {
      const base64Image = await this.getImageFromCanvas(canvas);
      const data = await this.callAgent('suggest', base64Image);
      
      return `Reasoning (${data.reasoning.reasoning_type}):
- Observation: ${data.reasoning.observe}
- Critique: ${data.reasoning.self_check}

Suggestions:
- Improvements: ${data.final_result.improvements}
- Techniques to Try: ${data.final_result.techniques}`;

    } catch (error) {
      return `Error getting suggestions: ${error.message}`;
    }
  }

  async generateDrawingPrompt() {
    try {
      const data = await this.callAgent('prompt', null);
      
      return `Reasoning (${data.reasoning.reasoning_type}):
- Brainstorming: ${data.reasoning.hypothesize}
- Check: ${data.reasoning.self_check}

Your Drawing Prompt:
"${data.final_result.prompt}"

Tips:
${data.final_result.tips}`;

    } catch (error) {
      return `Error generating prompt: ${error.message}`;
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'preferencesUpdated') {
        this.preferences = message.preferences;
        console.log('Updated agent preferences via settings');
      }
    });
  }
}

const aiService = new AIService();
export default aiService;