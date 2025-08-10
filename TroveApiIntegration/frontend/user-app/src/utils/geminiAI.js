// 🚀 GEMINI AI INTEGRATION FOR YOUR TROVE PROJECT
// Add this to your src/utils/ folder as 'geminiAI.js'

import { GoogleGenerativeAI } from '@google/generative-ai';

// 🔑 STEP 1: Add your Gemini API key here
// const API_KEY = ''; // Replace with your actual API key



const API_KEY = import.meta.env.VITE_REACT_APP_GEMINI_API_KEY;



// Add these console logs at the top of your geminiAI.js file
// console.log('All env variables:', process.env);
// console.log('Gemini API Key:', process.env.REACT_APP_GEMINI_API_KEY);
// console.log('API Key exists:', !!process.env.REACT_APP_GEMINI_API_KEY);

// const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// console.log('API Key loaded:', API_KEY ? 'YES' : 'NO');







const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize the model
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",  // Fast and free tier
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

// 🧠 AI FEATURE 1: Smart Query Enhancement
export const enhanceSearchQuery = async (originalQuery) => {
  try {
    const prompt = `
You are an expert in Australian historical research and the Trove digital archive system. 
Your job is to enhance search queries to find the most relevant historical documents.

Original query: "${originalQuery}"

Please enhance this query by:
1. Adding relevant historical context and synonyms
2. Including important dates, places, and people related to the topic
3. Adding terms that historians would use
4. Including alternative spellings and historical terminology
5. Keep it concise but comprehensive for Trove search

Enhanced query should be optimized for finding Australian historical records, newspapers, government documents, and archives.

Return only the enhanced query terms, separated by spaces. No explanations.

Examples:
- "eureka" → "Eureka Stockade 1854 Ballarat gold miners rebellion Peter Lalor colonial government democratic reform"
- "bushrangers" → "bushrangers outlaws Ned Kelly Dan Morgan Ben Hall colonial police New South Wales Victoria"
- "federation" → "Australian Federation 1901 Commonwealth Constitution colonies union Henry Parkes Edmund Barton"

Enhanced query:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedQuery = response.text().trim();
    
    // Fallback if AI doesn't respond properly
    if (!enhancedQuery || enhancedQuery.length < originalQuery.length) {
      return `${originalQuery} Australian historical records colonial period archives`;
    }
    
    return enhancedQuery;
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fallback enhancement
    return `${originalQuery} Australian historical context colonial period archives records`;
  }
};

// 📄 AI FEATURE 2: Summarize Search Results
export const summarizeResults = async (searchResults) => {
  try {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    const resultsText = searchResults.slice(0, 10).map((result, index) => 
      `${index + 1}. Title: ${result.title || 'Untitled'}
      Date: ${result.date || 'Unknown date'}
      Source: ${result.source || 'Unknown source'}
      Snippet: ${result.snippet || result.text || 'No content available'}`
    ).join('\n\n');

    const prompt = `
You are an expert Australian historian analyzing search results from the Trove digital archive.

Please analyze these search results and provide:
1. A brief 2-3 sentence summary of what these documents are about
2. Key historical themes and topics covered
3. Important dates, people, and places mentioned
4. Historical significance and context

Search Results:
${resultsText}

Please provide a concise but informative summary that helps users understand the historical significance of these documents.

Format your response as:
SUMMARY: [2-3 sentence overview]
KEY THEMES: [main historical themes]
IMPORTANT DETAILS: [key dates, people, places]
HISTORICAL SIGNIFICANCE: [why this matters in Australian history]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();
    
    return [{
      type: 'summary',
      content: summary,
      timestamp: new Date().toISOString()
    }];
  } catch (error) {
    console.error('Gemini Summarization Error:', error);
    return [{
      type: 'summary',
      content: 'AI summarization temporarily unavailable. Please review the search results manually.',
      timestamp: new Date().toISOString()
    }];
  }
};

// 🏷️ AI FEATURE 3: Categorize Results
export const categorizeResults = async (searchResults) => {
  try {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    const resultsText = searchResults.slice(0, 10).map(result => 
      `${result.title || 'Untitled'} - ${result.snippet || result.text || ''}`
    ).join('\n');

    const prompt = `
You are categorizing Australian historical documents from Trove. 
Analyze these search results and organize them into relevant categories.

Common Australian history categories include:
- Colonial Period (1788-1901)
- Federation & Early Commonwealth (1901-1920s)
- Gold Rush Era (1850s-1860s)  
- Indigenous History & Culture
- Military History (Wars, ANZAC, etc.)
- Social History (Immigration, Women, Labor)
- Political History (Government, Laws, Elections)
- Economic History (Trade, Industry, Agriculture)
- Cultural History (Arts, Literature, Religion)
- Legal History (Courts, Crime, Justice)
- Regional History (State-specific events)
- Biographical (Notable People)

Search Results:
${resultsText}

Return a JSON array of categories with counts:
[
  {"category": "Category Name", "count": number, "description": "brief description"},
  ...
]

Only include categories that actually appear in the results. Maximum 8 categories.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let categoriesText = response.text().trim();
    
    // Extract JSON from response
    const jsonMatch = categoriesText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const categories = JSON.parse(jsonMatch[0]);
      return categories;
    }
    
    // Fallback categories
    return [
      {"category": "Historical Records", "count": searchResults.length, "description": "Australian historical documents"}
    ];
  } catch (error) {
    console.error('Gemini Categorization Error:', error);
    return [
      {"category": "Historical Records", "count": searchResults.length, "description": "Australian historical documents"}
    ];
  }
};

// 🌐 AI FEATURE 4: Historical Language Translation/Context
export const translateHistoricalLanguage = async (searchResults) => {
  try {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    // Extract text that might contain historical terminology
    const historicalText = searchResults.slice(0, 5).map(result => 
      result.snippet || result.text || result.title || ''
    ).join(' ');

    const prompt = `
You are an expert in Australian historical terminology and 19th-20th century language.
Analyze this text from historical Australian documents and identify:

1. Archaic or historical terms that modern readers might not understand
2. Colonial-era terminology and its modern equivalents  
3. Historical context for specific phrases
4. Currency, measurements, or legal terms that have changed

Historical Text:
${historicalText}

Return explanations in this format:
HISTORICAL TERM: "original term" 
MODERN MEANING: explanation in simple modern language
HISTORICAL CONTEXT: why this term was used in that period

Focus on terms that would genuinely help modern users understand historical documents.
Only include terms that actually appear in the provided text.
Maximum 8 explanations.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translations = response.text().trim();
    
    return [{
      type: 'translation',
      content: translations,
      timestamp: new Date().toISOString()
    }];
  } catch (error) {
    console.error('Gemini Translation Error:', error);
    return [{
      type: 'translation',
      content: 'Historical language assistance temporarily unavailable.',
      timestamp: new Date().toISOString()
    }];
  }
};

// 💡 AI FEATURE 5: Smart Search Suggestions  
export const getSmartSuggestions = async (partialQuery) => {
  try {
    if (partialQuery.length < 2) return [];

    const prompt = `
You are an expert in Australian history and the Trove digital archive.
A user is typing: "${partialQuery}"

Suggest 3-5 specific, historically accurate search queries that would find interesting documents in Trove.
Focus on:
- Australian historical events, people, and places
- Specific dates and periods that would yield good results
- Terms that historians and researchers would use
- Combinations that would find primary sources

Return only the suggested search queries, one per line. No explanations.
Each suggestion should be a complete, searchable phrase.

Examples for "gold":
Gold rush Victoria 1850s Ballarat
Gold license fees miners protests
Gold discovery Edward Hargraves 1851

Suggestions for "${partialQuery}":`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text().trim().split('\n').filter(s => s.trim());
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  } catch (error) {
    console.error('Gemini Suggestions Error:', error);
    return [];
  }
};

// 🔧 Utility function to check API key
export const checkGeminiConnection = async () => {
  try {
    const result = await model.generateContent("Test connection. Respond with 'Connected'");
    const response = await result.response;
    return response.text().includes('Connected');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }

};
