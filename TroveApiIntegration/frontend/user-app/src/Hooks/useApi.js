import { useState, useCallback } from 'react';

// const API_BASE_URL = 'http://localhost:8080';
// const API_BASE_URL = import.meta.env.PROD 
//   ? 'https://trove-search-api.vercel.app' 
//   : 'http://localhost:8080';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trove-search-api.vercel.app';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search Trove API
  const searchTrove = useCallback(async (query, options = {}) => {
    const params = new URLSearchParams({
      q: query,
      n: options.resultsPerPage || 20,
      s: options.startIndex || 0,
      ...options.additionalParams
    });

    return makeRequest(`/api/trove?${params}`);
  }, [makeRequest]);

  // Advanced search with filters
  const advancedSearch = useCallback(async (filters) => {
    let query = '';
    
    // Build query from filters
    if (filters.exactPhrase) {
      query += `"${filters.exactPhrase}" `;
    }
    
    if (filters.allWords) {
      query += `${filters.allWords} `;
    }
    
    if (filters.anyWords) {
      const words = filters.anyWords.split(' ').filter(w => w.trim());
      if (words.length > 1) {
        query += `(${words.join(' OR ')}) `;
      } else if (words.length === 1) {
        query += `${words[0]} `;
      }
    }
    
    if (filters.excludeWords) {
      const excludeWords = filters.excludeWords.split(' ').filter(w => w.trim());
      excludeWords.forEach(word => {
        query += `-${word} `;
      });
    }

    query = query.trim();
    
    if (!query) {
      throw new Error('Please provide at least one search term');
    }

    const searchOptions = {
      resultsPerPage: filters.resultsPerPage || 20,
      additionalParams: {}
    };

    // Add date filters if provided
    if (filters.dateFrom || filters.dateTo) {
      // Note: Date filtering might need to be implemented on the backend
      // depending on Trove API v3 capabilities
      if (filters.dateFrom) {
        searchOptions.additionalParams.dateFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        searchOptions.additionalParams.dateTo = filters.dateTo;
      }
    }

    return searchTrove(query, searchOptions);
  }, [searchTrove]);

  // Test API key
  const testApiKey = useCallback(async () => {
    return makeRequest('/api/test-key');
  }, [makeRequest]);

  // Check Trove API status
  const checkTroveStatus = useCallback(async () => {
    return makeRequest('/api/check-trove-status');
  }, [makeRequest]);

  // Direct Trove test
  const testDirectTrove = useCallback(async (query = 'melbourne') => {
    const params = new URLSearchParams({ q: query });
    return makeRequest(`/api/test-direct-trove?${params}`);
  }, [makeRequest]);

  // Get server status
  const getServerStatus = useCallback(async () => {
    return makeRequest('/');
  }, [makeRequest]);

  return {
    // State
    loading,
    error,
    
    // Methods
    searchTrove,
    advancedSearch,
    testApiKey,
    checkTroveStatus,
    testDirectTrove,
    getServerStatus,
    
    // Generic request method
    makeRequest
  };
};

// Hook for managing search history
export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('trove-search-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addSearch = useCallback((query, resultCount = 0) => {
    const newSearch = {
      id: Date.now(),
      query,
      resultCount,
      timestamp: new Date().toISOString()
    };

    setSearchHistory(prev => {
      const updated = [newSearch, ...prev.slice(0, 99)]; // Keep last 100 searches
      try {
        sessionStorage.setItem('trove-search-history', JSON.stringify(updated));
      } catch (error) {
        console.warn('Could not save search history:', error);
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      sessionStorage.removeItem('trove-search-history');
    } catch (error) {
      console.warn('Could not clear search history:', error);
    }
  }, []);

  const removeSearch = useCallback((searchId) => {
    setSearchHistory(prev => {
      const updated = prev.filter(search => search.id !== searchId);
      try {
        sessionStorage.setItem('trove-search-history', JSON.stringify(updated));
      } catch (error) {
        console.warn('Could not update search history:', error);
      }
      return updated;
    });
  }, []);

  return {
    searchHistory,
    addSearch,
    clearHistory,
    removeSearch
  };
};

// Hook for managing user preferences
export const usePreferences = () => {
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('trove-preferences');
      return saved ? JSON.parse(saved) : {
        resultsPerPage: 20,
        defaultSort: 'relevance',
        showAdvancedFilters: false,
        autoPlayTimeline: false,
        theme: 'light'
      };
    } catch {
      return {
        resultsPerPage: 20,
        defaultSort: 'relevance',
        showAdvancedFilters: false,
        autoPlayTimeline: false,
        theme: 'light'
      };
    }
  });

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('trove-preferences', JSON.stringify(updated));
      } catch (error) {
        console.warn('Could not save preferences:', error);
      }
      return updated;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    const defaultPrefs = {
      resultsPerPage: 20,
      defaultSort: 'relevance',
      showAdvancedFilters: false,
      autoPlayTimeline: false,
      theme: 'light'
    };
    setPreferences(defaultPrefs);
    try {
      localStorage.setItem('trove-preferences', JSON.stringify(defaultPrefs));
    } catch (error) {
      console.warn('Could not reset preferences:', error);
    }
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences
  };
};


export default useApi;

