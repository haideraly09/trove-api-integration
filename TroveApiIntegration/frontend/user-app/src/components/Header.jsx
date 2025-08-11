// 🚀 FIXED HEADER - Simple Search with AI Connected Issue Resolved
import React, { useState, useEffect } from 'react';
import { Search, Database, Info, Brain, FileText, Tag, Languages, Sparkles, ChevronDown, ChevronUp, Loader, Zap, Bot, Star, AlertCircle } from 'lucide-react';
import {    
    enhanceSearchQuery,    
    summarizeResults,    
    categorizeResults,    
    translateHistoricalLanguage,   
    getSmartSuggestions,   
    checkGroqConnection  // ← Changed to checkGroqConnection
} from '../utils/geminiAI';

const Header = ({ onSearch, isSearching, searchQuery, setSearchQuery, searchResults = [] }) => {
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [aiFeatures, setAiFeatures] = useState({
    queryEnhancement: false,
    summarization: false,
    categorization: false,
    translation: false
  });
  const [enhancedQuery, setEnhancedQuery] = useState('');
  const [originalQuery, setOriginalQuery] = useState('');
  const [aiEnabled, setAiEnabled] = useState({
    enhanceQuery: false,  // Default to enabled for better UX
    autoSummarize: false,
    autoCategorize: false,
    languageHelp: false
  });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [geminiConnected, setGeminiConnected] = useState(null);

  // Check Gemini connection on mount
  useEffect(() => {
    checkGroqConnection().then(setGrokConnected);
  }, []);

  // Get real AI suggestions as user types
  useEffect(() => {
    const getSuggestions = async () => {
      if (searchQuery.length > 2 && grokConnected) {
        try {
          const suggestions = await getSmartSuggestions(searchQuery);
          setAiSuggestions(suggestions);
        } catch (error) {
          console.error('Error getting AI suggestions:', error);
          setAiSuggestions([]);
        }
      } else {
        setAiSuggestions([]);
      }
    };

    const timeoutId = setTimeout(getSuggestions, 300); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [searchQuery, grokConnected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setOriginalQuery(searchQuery.trim());
      
      // If AI query enhancement is enabled and Gemini is connected
      if (aiEnabled.enhanceQuery && grokConnected) {
        try {
          setAiFeatures(prev => ({ ...prev, queryEnhancement: true }));
          const enhanced = await enhanceSearchQuery(searchQuery.trim());
          setEnhancedQuery(enhanced);
          setAiFeatures(prev => ({ ...prev, queryEnhancement: false }));
          
          // Call search with enhanced query
          onSearch(enhanced);
          
          // Clear suggestions and query AFTER search is initiated
          setAiSuggestions([]);
          // Optional: Keep the original query visible or clear it
          // setSearchQuery(''); // Uncomment if you want to clear after AI search
          
        } catch (error) {
          console.error('Error enhancing query:', error);
          setAiFeatures(prev => ({ ...prev, queryEnhancement: false }));
          
          // Fallback to original query
          onSearch(searchQuery.trim());
          
          // Clear suggestions but keep the query visible for fallback
          setAiSuggestions([]);
        }
      } else {
        // FIXED: Simple search - don't clear searchQuery immediately
        // This was causing the display issue when AI is connected but enhancement is disabled
        onSearch(searchQuery.trim());
        
        // Only clear suggestions, keep the search query visible
        setAiSuggestions([]);
        
        // Optional: Clear search query after a delay to let the search complete
        // setTimeout(() => setSearchQuery(''), 500);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    // Create a proper event object for handleSubmit
    const mockEvent = { preventDefault: () => {} };
    handleSubmit(mockEvent);
  };

  // AI Feature: Smart Summarization
  const handleAISummarization = async () => {
    if (!grokConnected) {
      alert('AI features require Gemini API connection');
      return;
    }

    if (!searchResults || searchResults.length === 0) {
      alert('No search results to summarize. Please perform a search first.');
      return;
    }

    setAiFeatures(prev => ({ ...prev, summarization: true }));
    try {
      const summaries = await summarizeResults(searchResults);
      setAiFeatures(prev => ({ ...prev, summarization: false }));
      
      // Trigger callback to parent component to display summaries
      if (window.onAISummarize) {
        window.onAISummarize(summaries);
      }
    } catch (error) {
      console.error('Error summarizing results:', error);
      setAiFeatures(prev => ({ ...prev, summarization: false }));
      alert('Error summarizing results. Please try again.');
    }
  };

  // AI Feature: Smart Categorization
  const handleAICategorization = async () => {
    if (!grokConnected) {
      alert('AI features require Gemini API connection');
      return;
    }

    if (!searchResults || searchResults.length === 0) {
      alert('No search results to categorize. Please perform a search first.');
      return;
    }

    setAiFeatures(prev => ({ ...prev, categorization: true }));
    try {
      const categories = await categorizeResults(searchResults);
      setAiFeatures(prev => ({ ...prev, categorization: false }));
      
      // Trigger callback to parent component to display categories
      if (window.onAICategorize) {
        window.onAICategorize(categories);
      }
    } catch (error) {
      console.error('Error categorizing results:', error);
      setAiFeatures(prev => ({ ...prev, categorization: false }));
      alert('Error categorizing results. Please try again.');
    }
  };

  // AI Feature: Historical Language Help
  const handleAITranslation = async () => {
    if (!grokConnected) {
      alert('AI features require Gemini API connection');
      return;
    }

    if (!searchResults || searchResults.length === 0) {
      alert('No search results to translate. Please perform a search first.');
      return;
    }

    setAiFeatures(prev => ({ ...prev, translation: true }));
    try {
      const translations = await translateHistoricalLanguage(searchResults);
      setAiFeatures(prev => ({ ...prev, translation: false }));
      
      // Trigger callback to parent component to display translations
      if (window.onAITranslate) {
        window.onAITranslate(translations);
      }
    } catch (error) {
      console.error('Error translating historical terms:', error);
      setAiFeatures(prev => ({ ...prev, translation: false }));
      alert('Error processing historical language. Please try again.');
    }
  };

  return (
    <header className="bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 shadow-xl relative overflow-hidden">
      {/* Animated background elements - responsive positioning */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-purple-400 rounded-full filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-12 h-12 sm:w-18 sm:h-18 lg:w-24 lg:h-24 bg-pink-400 rounded-full filter blur-xl animate-pulse delay-700"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
        <div className="py-3 sm:py-4 lg:py-6">
          {/* Logo and Title - improved mobile layout */}
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <Database className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-200 mr-2" />
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">Trove Search</h1>
            <div className={`ml-2 sm:ml-3 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold flex items-center animate-pulse ${
              geminiConnected === true 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : geminiConnected === false 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}>
              {geminiConnected === true ? (
                <>
                  <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden xs:inline">AI POWERED</span>
                  <span className="xs:hidden">AI</span>
                </>
              ) : geminiConnected === false ? (
                <>
                  <AlertCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden xs:inline">AI OFFLINE</span>
                  <span className="xs:hidden">OFF</span>
                </>
              ) : (
                <>
                  <Loader className="h-2 w-2 sm:h-3 sm:w-3 mr-1 animate-spin" />
                  <span className="hidden xs:inline">CONNECTING</span>
                  <span className="xs:hidden">...</span>
                </>
              )}
            </div>
          </div>

          {/* AI Status Banner - responsive text */}
          <div className="max-w-full sm:max-w-2xl mx-auto mb-3 sm:mb-4">
            <div className={`backdrop-blur-sm border rounded-lg p-2 sm:p-3 ${
              grokConnected === true 
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-300/30'
                : grokConnected === false
                  ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-300/30'
                  : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-300/30'
            }`}>
              <div className="flex items-center justify-center text-center">
                <Bot className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 ${grokConnected ? 'animate-bounce text-green-300' : 'text-red-300'}`} />
                <span className={`text-xs sm:text-sm font-medium ${
                  grokConnected === true 
                    ? 'text-green-200' 
                    : grokConnected === false 
                      ? 'text-red-200'
                      : 'text-purple-200'
                }`}>
                  <span className="hidden sm:inline">
                    {grokConnected === true 
                      ? '🚀 Gemini AI Connected • Enhanced Historical Search • Smart Suggestions Active'
                      : grokConnected === false
                        ? '⚠️ AI Offline • Check API Key • Basic Search Available'
                        : '🔄 Connecting to Gemini AI...'
                    }
                  </span>
                  <span className="sm:hidden">
                    {grokConnected === true 
                      ? '🚀 AI Active'
                      : grokConnected === false
                        ? '⚠️ AI Offline'
                        : '🔄 Connecting...'
                    }
                  </span>
                </span>
                <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ml-2 flex-shrink-0 ${grokConnected ? 'animate-pulse text-green-300' : 'text-red-300'}`} />
              </div>
            </div>
          </div>

          {/* Search Section - improved responsive layout */}
          <div className="max-w-full sm:max-w-xl lg:max-w-2xl mx-auto">
            {/* Enhanced Query Display - responsive */}
            {enhancedQuery && enhancedQuery !== originalQuery && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg border border-green-300/50">
                <div className="flex items-center mb-2">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 mr-2 animate-pulse flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-green-200">🎯 Grok AI Enhanced:</span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="text-gray-300">
                    <span className="font-medium text-red-300">Original:</span> 
                    <span className="line-through opacity-75 ml-2 break-words">{originalQuery}</span>
                  </div>
                  <div className="text-white">
                    <span className="font-medium text-green-300">Enhanced:</span> 
                    <span className="ml-2 bg-green-500/20 px-2 py-1 rounded break-words">{enhancedQuery}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search Input - fully responsive */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={grokConnected 
                  ? "🤖 Ask about Australian history..." 
                  : "🔍 Search historical records..."
                }
                className="block w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 lg:py-4 border-2 border-purple-300/50 rounded-xl leading-5 bg-white/95 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-sm sm:text-base lg:text-lg shadow-lg"
                disabled={isSearching || aiFeatures.queryEnhancement}
              />
              {aiFeatures.queryEnhancement && (
                <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                  <div className="flex items-center">
                    <Loader className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 animate-spin mr-1 sm:mr-2" />
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Real AI Suggestions Dropdown - responsive */}
            {aiSuggestions.length > 0 && (
              <div className="mt-2 bg-white rounded-lg shadow-xl border border-green-200 z-50 relative max-h-48 sm:max-h-60 overflow-y-auto">
                <div className="p-2 border-b bg-green-50 sticky top-0">
                  <div className="flex items-center text-xs text-green-700 font-medium">
                    <Bot className="h-3 w-3 mr-1 animate-bounce" />
                    <span className="hidden sm:inline">Grok AI Suggestions</span>
                    <span className="sm:hidden">AI Suggestions</span>
                  </div>
                </div>
                <div className="max-h-40 sm:max-h-48 overflow-y-auto">
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 sm:px-4 py-2 hover:bg-green-50 text-gray-800 text-xs sm:text-sm border-b border-gray-100 last:border-b-0 flex items-start transition-colors"
                    >
                      <Sparkles className="h-3 w-3 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Toggle Options - responsive grid */}
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <Bot className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${grokConnected ? 'text-green-300' : 'text-red-300'}`} />
                <span className="text-white text-xs sm:text-sm font-medium">
                  <span className="hidden sm:inline">
                    {grokConnected ? 'Gemini AI Features' : 'AI Features (Offline)'}
                  </span>
                  <span className="sm:hidden">
                    {grokConnected ? 'AI Features' : 'AI (Offline)'}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <label className={`flex items-center text-white text-xs cursor-pointer hover:text-purple-200 bg-white/10 p-2 rounded-lg transition-colors ${!geminiConnected ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={aiEnabled.enhanceQuery}
                    onChange={(e) => setAiEnabled(prev => ({ ...prev, enhanceQuery: e.target.checked }))}
                    className="mr-1 sm:mr-2 rounded accent-purple-500 w-3 h-3 sm:w-4 sm:h-4"
                    disabled={!geminiConnected}
                  />
                  <Brain className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Smart Query</span>
                  <span className="sm:hidden">Query</span>
                </label>
                
                <label className={`flex items-center text-white text-xs cursor-pointer hover:text-purple-200 bg-white/10 p-2 rounded-lg transition-colors ${!geminiConnected ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={aiEnabled.autoSummarize}
                    onChange={(e) => setAiEnabled(prev => ({ ...prev, autoSummarize: e.target.checked }))}
                    className="mr-1 sm:mr-2 rounded accent-blue-500 w-3 h-3 sm:w-4 sm:h-4"
                    disabled={!grokConnected}
                  />
                  <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Auto-Summarize</span>
                  <span className="sm:hidden">Summary</span>
                </label>
                
                <label className={`flex items-center text-white text-xs cursor-pointer hover:text-purple-200 bg-white/10 p-2 rounded-lg transition-colors ${!geminiConnected ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={aiEnabled.autoCategorize}
                    onChange={(e) => setAiEnabled(prev => ({ ...prev, autoCategorize: e.target.checked }))}
                    className="mr-1 sm:mr-2 rounded accent-green-500 w-3 h-3 sm:w-4 sm:h-4"
                    disabled={!grokConnected}
                  />
                  <Tag className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Categorize</span>
                  <span className="sm:hidden">Tags</span>
                </label>
                
                <label className={`flex items-center text-white text-xs cursor-pointer hover:text-purple-200 bg-white/10 p-2 rounded-lg transition-colors ${!geminiConnected ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={aiEnabled.languageHelp}
                    onChange={(e) => setAiEnabled(prev => ({ ...prev, languageHelp: e.target.checked }))}
                    className="mr-1 sm:mr-2 rounded accent-orange-500 w-3 h-3 sm:w-4 sm:h-4"
                    disabled={!grokConnected}
                  />
                  <Languages className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">Language Help</span>
                  <span className="sm:hidden">Lang</span>
                </label>
              </div>
            </div>

            {/* Search Button - responsive */}
            <button
              onClick={handleSubmit}
              disabled={isSearching || aiFeatures.queryEnhancement || !searchQuery.trim()}
              className="mt-3 sm:mt-4 w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white py-2.5 sm:py-3 lg:py-4 px-4 sm:px-6 rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-sm sm:text-base lg:text-lg flex items-center justify-center shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSearching ? (
                <>
                  <Loader className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  <span className="hidden sm:inline">🔍 Searching Trove...</span>
                  <span className="sm:hidden">🔍 Searching...</span>
                </>
              ) : aiFeatures.queryEnhancement ? (
                <>
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-pulse" />
                  <span className="hidden sm:inline">🤖 Grok AI Processing...</span>
                  <span className="sm:hidden">🤖 Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="hidden sm:inline">
                    {grokConnected ? '🚀 Search with AI Power' : '🔍 Search Trove'}
                  </span>
                  <span className="sm:hidden">
                    {grokConnected ? '🚀 AI Search' : '🔍 Search'}
                  </span>
                </>
              )}
            </button>

            {/* Advanced AI Features Panel - responsive layout */}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <button
                  onClick={() => setShowAIFeatures(!showAIFeatures)}
                  disabled={!grokConnected}
                  className={`w-full backdrop-blur-sm text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center border text-sm sm:text-base ${
                    grokConnected 
                      ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 border-green-300/30'
                      : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-400/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Bot className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${grokConnected ? 'animate-bounce' : ''}`} />
                  <span className="hidden sm:inline">🤖 {grokConnected ? 'AI Result Processing Tools' : 'AI Tools (Offline)'}</span>
                  <span className="sm:hidden">🤖 {grokConnected ? 'AI Tools' : 'AI (Off)'}</span>
                  {showAIFeatures ? (
                    <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                  )}
                </button>

                {showAIFeatures && grokConnected && (
                  <div className="mt-3 bg-gradient-to-r from-gray-900/50 to-blue-900/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-300/30">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      <button
                        onClick={handleAISummarization}
                        disabled={aiFeatures.summarization}
                        className="flex items-center justify-center p-2.5 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 shadow-lg text-xs sm:text-sm"
                      >
                        {aiFeatures.summarization ? (
                          <Loader className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        )}
                        <span className="hidden sm:inline">📄 AI Summarize</span>
                        <span className="sm:hidden">📄 Summary</span>
                      </button>

                      <button
                        onClick={handleAICategorization}
                        disabled={aiFeatures.categorization}
                        className="flex items-center justify-center p-2.5 sm:p-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50 shadow-lg text-xs sm:text-sm"
                      >
                        {aiFeatures.categorization ? (
                          <Loader className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                        ) : (
                          <Tag className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        )}
                        <span className="hidden sm:inline">🏷️ AI Categorize</span>
                        <span className="sm:hidden">🏷️ Tags</span>
                      </button>

                      <button
                        onClick={handleAITranslation}
                        disabled={aiFeatures.translation}
                        className="flex items-center justify-center p-2.5 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 shadow-lg text-xs sm:text-sm sm:col-span-1 col-span-1"
                      >
                        {aiFeatures.translation ? (
                          <Loader className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                        ) : (
                          <Languages className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        )}
                        <span className="hidden sm:inline">🌐 Language Help</span>
                        <span className="sm:hidden">🌐 Lang</span>
                      </button>
                    </div>

                    <div className="mt-3 text-center text-xs text-blue-200">
                      <span className="hidden sm:inline">⚡ Powered by Grok AI • Process your search results with advanced assistance</span>
                      <span className="sm:hidden">⚡ Powered by Grok AI</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Info Section - responsive */}
          <div className="mt-4 sm:mt-6 text-center px-2">
            <div className="inline-flex items-center text-purple-200 text-xs sm:text-sm bg-white/10 px-3 sm:px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
              <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="break-words">
                <span className="hidden sm:inline">
                  {grokConnected 
                    ? '🤖 AI-powered search of millions of Australian historical records'
                    : '📚 Search millions of Australian historical records'
                  }
                </span>
                <span className="sm:hidden">
                  {grokConnected 
                    ? '🤖 AI-powered historical search'
                    : '📚 Historical records search'
                  }
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


export default Header;


