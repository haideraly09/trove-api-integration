// Date formatting utilities
export const formatDate = (dateString) => {
  if (!dateString) return 'Date unknown';
  
  // Handle various date formats that might come from Trove
  const patterns = [
    /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /^(\d{4})/, // Just year
    /(\d{4})/  // Extract year from any string
  ];
  
  for (const pattern of patterns) {
    const match = dateString.match(pattern);
    if (match) {
      if (pattern === patterns[0]) { // YYYY-MM-DD
        const date = new Date(match[0]);
        return date.toLocaleDateString('en-AU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else if (pattern === patterns[1]) { // DD/MM/YYYY
        return `${match[1]}/${match[2]}/${match[3]}`;
      } else { // Year only
        return match[1] || match[0];
      }
    }
  }
  
  return dateString;
};

// Text truncation with smart word breaking
export const truncateText = (text, maxLength = 150) => {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

// Extract and clean article snippets
export const cleanSnippet = (snippet) => {
  if (!snippet) return '';
  
  return snippet
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/&quot;/g, '"') // Decode quotes
    .replace(/&amp;/g, '&') // Decode ampersands
    .replace(/&lt;/g, '<') // Decode less than
    .replace(/&gt;/g, '>') // Decode greater than
    .trim();
};

// Generate search query suggestions
export const generateSearchSuggestions = (query) => {
  const suggestions = [];
  
  if (!query || query.length < 2) return suggestions;
  
  const lowerQuery = query.toLowerCase();
  
  // Historical Australian topics
  const historicalTopics = [
    'gold rush', 'federation', 'world war', 'great depression',
    'anzac', 'gallipoli', 'melbourne cup', 'sydney harbour bridge',
    'aboriginal', 'convict', 'bushfire', 'drought', 'flood'
  ];
  
  historicalTopics.forEach(topic => {
    if (topic.includes(lowerQuery) || lowerQuery.includes(topic.split(' ')[0])) {
      suggestions.push(`"${topic}"`);
    }
  });
  
  // Add quotation marks for exact phrase searching
  if (!query.includes('"') && query.includes(' ')) {
    suggestions.push(`"${query}"`);
  }
  
  // Add location-based suggestions
  const locations = [
    'Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide',
    'Tasmania', 'Victoria', 'Queensland', 'New South Wales'
  ];
  
  locations.forEach(location => {
    if (location.toLowerCase().includes(lowerQuery)) {
      suggestions.push(`${query} ${location}`);
    }
  });
  
  return suggestions.slice(0, 5);
};

// Validate search query
export const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Please enter a search term' };
  }
  
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length < 2) {
    return { isValid: false, error: 'Search term must be at least 2 characters long' };
  }
  
  if (trimmedQuery.length > 200) {
    return { isValid: false, error: 'Search term is too long (maximum 200 characters)' };
  }
  
  // Check for potentially problematic characters
  const problematicChars = /[<>{}[\]\\]/;
  if (problematicChars.test(trimmedQuery)) {
    return { isValid: false, error: 'Search contains invalid characters' };
  }
  
  return { isValid: true, query: trimmedQuery };
};

// Format result counts
export const formatResultCount = (count) => {
  if (count === null || count === undefined) return 'Unknown';
  
  const num = parseInt(count);
  if (isNaN(num)) return 'Unknown';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toLocaleString();
};

// Generate URL for Trove search
export const generateTroveUrl = (query, filters = {}) => {
  const baseUrl = 'https://trove.nla.gov.au/search';
  const params = new URLSearchParams();
  
  params.append('q', query);
  
  if (filters.category) {
    params.append('category', filters.category);
  }
  
  if (filters.dateFrom || filters.dateTo) {
    const dateFilter = `${filters.dateFrom || '*'}-${filters.dateTo || '*'}`;
    params.append('l-date', dateFilter);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

// Extract meaningful keywords from text
export const extractKeywords = (text, maxKeywords = 10) => {
  if (!text) return [];
  
  // Common stop words to exclude
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'would', 'said', 'mr', 'mrs', 'can',
    'could', 'should', 'may', 'might', 'must', 'shall', 'will', 'would'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
};

// Debounce function for search input
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Group results by decade for timeline visualization
export const groupResultsByDecade = (results) => {
  if (!results || !Array.isArray(results)) return {};
  
  const decades = {};
  
  results.forEach(result => {
    if (result.date) {
      const yearMatch = result.date.match(/(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const decade = Math.floor(year / 10) * 10;
        const decadeLabel = `${decade}s`;
        
        if (!decades[decadeLabel]) {
          decades[decadeLabel] = [];
        }
        decades[decadeLabel].push(result);
      }
    }
  });
  
  return decades;
};

// Sort results by various criteria
export const sortResults = (results, sortBy = 'relevance') => {
  if (!results || !Array.isArray(results)) return [];
  
  const sortedResults = [...results];
  
  switch (sortBy) {
    case 'date_asc':
      return sortedResults.sort((a, b) => {
        const dateA = extractYear(a.date) || 0;
        const dateB = extractYear(b.date) || 0;
        return dateA - dateB;
      });
      
    case 'date_desc':
      return sortedResults.sort((a, b) => {
        const dateA = extractYear(a.date) || 0;
        const dateB = extractYear(b.date) || 0;
        return dateB - dateA;
      });
      
    case 'title':
      return sortedResults.sort((a, b) => {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
      
    case 'relevance':
    default:
      return sortedResults; // Assume results come pre-sorted by relevance
  }
};

// Helper function to extract year from date string
const extractYear = (dateString) => {
  if (!dateString) return null;
  const match = dateString.match(/(\d{4})/);
  return match ? parseInt(match[1]) : null;
};

// Filter results by content type
export const filterResultsByType = (results, contentTypes) => {
  if (!results || !Array.isArray(results) || !contentTypes || contentTypes.length === 0) {
    return results;
  }
  
  return results.filter(result => {
    const resultType = result.type || 'newspaper';
    return contentTypes.includes(resultType);
  });
};

// Calculate search analytics
export const calculateSearchAnalytics = (searchHistory) => {
  if (!searchHistory || searchHistory.length === 0) {
    return {
      totalSearches: 0,
      averageResults: 0,
      mostSearchedTerms: [],
      searchFrequency: {}
    };
  }
  
  const totalSearches = searchHistory.length;
  const totalResults = searchHistory.reduce((sum, search) => sum + (search.resultCount || 0), 0);
  const averageResults = Math.round(totalResults / totalSearches);
  
  // Count search term frequency
  const termFrequency = {};
  searchHistory.forEach(search => {
    const terms = search.query.toLowerCase().split(' ').filter(term => term.length > 2);
    terms.forEach(term => {
      termFrequency[term] = (termFrequency[term] || 0) + 1;
    });
  });
  
  // Get most searched terms
  const mostSearchedTerms = Object.entries(termFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));
  
  // Calculate search frequency by day/week
  const searchFrequency = {};
  searchHistory.forEach(search => {
    const date = new Date(search.timestamp);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    searchFrequency[dateKey] = (searchFrequency[dateKey] || 0) + 1;
  });
  
  return {
    totalSearches,
    averageResults,
    mostSearchedTerms,
    searchFrequency
  };
};

// Error handling utilities
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('Failed to fetch')) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
      type: 'connection'
    };
  }
  
  if (error.message.includes('503')) {
    return {
      message: 'Trove API is temporarily unavailable. Please try again in a few minutes.',
      type: 'service'
    };
  }
  
  if (error.message.includes('API key')) {
    return {
      message: 'API authentication error. Please check the server configuration.',
      type: 'auth'
    };
  }
  
  if (error.message.includes('400')) {
    return {
      message: 'Invalid search query. Please check your search terms.',
      type: 'validation'
    };
  }
  
  return {
    message: error.message || 'An unexpected error occurred.',
    type: 'unknown'
  };
};

// Local storage utilities with error handling
export const safeLocalStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }
};

// Session storage utilities
export const safeSessionStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from sessionStorage (${key}):`, error);
      return defaultValue;
    }
  },
  
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to sessionStorage (${key}):`, error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from sessionStorage (${key}):`, error);
      return false;
    }
  }
};

// URL parameter utilities
export const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
};

export const updateUrlParams = (params) => {
  const url = new URL(window.location);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  
  window.history.replaceState({}, '', url);
};

// Accessibility utilities
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Performance utilities
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  
  return result;
};

// Async performance measurement
export const measureAsyncPerformance = async (name, fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  
  return result;
};

// Theme utilities
export const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Export utility for results
export const exportSearchResults = (results, format = 'json') => {
  if (!results || results.length === 0) {
    throw new Error('No results to export');
  }
  
  let content;
  let mimeType;
  let filename;
  
  switch (format) {
    case 'json':
      content = JSON.stringify(results, null, 2);
      mimeType = 'application/json';
      filename = `trove-search-results-${new Date().toISOString().split('T')[0]}.json`;
      break;
      
    case 'csv':
      const headers = ['Title', 'Date', 'Type', 'Contributor', 'Snippet', 'URL'];
      const csvRows = [headers.join(',')];
      
      results.forEach(result => {
        const row = [
          `"${(result.title || '').replace(/"/g, '""')}"`,
          `"${result.date || ''}"`,
          `"${result.type || ''}"`,
          `"${(result.contributor || '').replace(/"/g, '""')}"`,
          `"${(result.snippet || '').replace(/"/g, '""').substring(0, 100)}"`,
          `"${result.troveUrl || ''}"`
        ];
        csvRows.push(row.join(','));
      });
      
      content = csvRows.join('\n');
      mimeType = 'text/csv';
      filename = `trove-search-results-${new Date().toISOString().split('T')[0]}.csv`;
      break;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  // Create and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};