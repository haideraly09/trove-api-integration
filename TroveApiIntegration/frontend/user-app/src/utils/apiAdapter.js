// Groq API Adapter - Makes Groq work with existing Gemini code
// Save this file as: src/utils/apiAdapter.js

export class GoogleGenerativeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.groq.com/openai/v1';
  }

  getGenerativeModel(config) {
    return new GroqModel(this.apiKey, config);
  }
}

class GroqModel {
  constructor(apiKey, config) {
    this.apiKey = apiKey;
    this.model = config.model || 'llama-3.1-70b-versatile'; // Default Groq model
  }

  async generateContent(prompt) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: typeof prompt === 'string' ? prompt : prompt.text || JSON.stringify(prompt)
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Return in Gemini-compatible format
      return {
        response: {
          text: () => data.choices[0]?.message?.content || 'No response generated'
        }
      };
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  // Alternative method name that some Gemini code might use
  async generateContentStream(prompt) {
    return this.generateContent(prompt);
  }
}
