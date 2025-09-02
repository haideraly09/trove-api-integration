export class GoogleGenerativeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.groq.com/openai/v1';
    
    // Validate API key format
    if (!apiKey) {
      throw new Error('Groq API key is required');
    }
    if (!apiKey.startsWith('gsk_')) {
      throw new Error('Invalid Groq API key format. Should start with "gsk_"');
    }
    
    console.log('🔑 Groq API initialized with key:', `${apiKey.substring(0, 10)}...`);
  }

  getGenerativeModel(config) {
    return new GroqModel(this.apiKey, config);
  }
}

class GroqModel {
  constructor(apiKey, config) {
    this.apiKey = apiKey;
    // Fix: Use valid Groq model names
    this.model = this.mapToGroqModel(config.model);
    this.config = config;
    
    console.log('🤖 Using Groq model:', this.model);
  }

  // Map old/decommissioned model names to current Groq models (September 2025)
  mapToGroqModel(modelName) {
    const modelMap = {
      // Map old decommissioned models to new working ones
      'llama3-70b-8192': 'llama-3.3-70b-versatile',
      'llama3-8b-8192': 'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile': 'llama-3.3-70b-versatile', // Old 3.1 → New 3.3
      'gemini-pro': 'llama-3.3-70b-versatile', // Fallback for Gemini requests
      
      // Current working models (as of Sep 2025)
      'llama-3.3-70b-versatile': 'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
      'gemma2-9b-it': 'gemma2-9b-it',
      'qwen/qwen3-32b': 'qwen/qwen3-32b',
      'moonshotai/kimi-k2-instruct': 'moonshotai/kimi-k2-instruct',
    };
    
    // Return mapped model or default to reliable working model
    return modelMap[modelName] || 'llama-3.1-8b-instant';
  }

  async generateContent(prompt) {
    try {
      console.log('🚀 Making request to api.groq.com');
      console.log('📝 Prompt length:', typeof prompt === 'string' ? prompt.length : JSON.stringify(prompt).length);
      
      const response = await fetch(`${this.baseURL || 'https://api.groq.com/openai/v1'}/chat/completions`, {
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
          max_tokens: this.config?.generationConfig?.maxOutputTokens || 1500,
          temperature: this.config?.generationConfig?.temperature || 0.7
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Groq API Error Details:', errorText);
        
        // Provide specific error messages
        if (response.status === 401) {
          throw new Error('Invalid Groq API key. Please check your VITE_GROQ_API_KEY environment variable.');
        } else if (response.status === 429) {
          throw new Error('Groq API rate limit exceeded. Please try again in a moment.');
        } else {
          throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Groq API Response received successfully');
      
      // Return in Gemini-compatible format
      return {
        response: {
          text: () => data.choices[0]?.message?.content || 'No response generated'
        }
      };
    } catch (error) {
      console.error('❌ Groq API Error:', error);
      throw error;
    }
  }

  async generateContentStream(prompt) {
    return this.generateContent(prompt);
  }
}
