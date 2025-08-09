import React, { useState, useEffect } from 'react';
import { Settings, X, Search, RefreshCw } from 'lucide-react';

const AdvancedSearchFilters = ({ isOpen, onClose, onApplyFilters, currentFilters }) => {
  // Initialize state with current filters or default values
  const [filters, setFilters] = useState({
    exactPhrase: currentFilters?.exactPhrase || '',
    allWords: currentFilters?.allWords || '',
    anyWords: currentFilters?.anyWords || '',
    excludeWords: currentFilters?.excludeWords || '',
    dateFrom: currentFilters?.dateFrom || '',
    dateTo: currentFilters?.dateTo || '',
    categories: currentFilters?.categories || ['newspaper'],
    sortBy: currentFilters?.sortBy || 'relevance',
    resultsPerPage: currentFilters?.resultsPerPage || 20
  });

  // State for the live query preview string
  const [queryPreview, setQueryPreview] = useState('');

  // Update filters when currentFilters prop changes
  useEffect(() => {
    if (currentFilters) {
      setFilters({
        exactPhrase: currentFilters.exactPhrase || '',
        allWords: currentFilters.allWords || '',
        anyWords: currentFilters.anyWords || '',
        excludeWords: currentFilters.excludeWords || '',
        dateFrom: currentFilters.dateFrom || '',
        dateTo: currentFilters.dateTo || '',
        categories: currentFilters.categories || ['newspaper'],
        sortBy: currentFilters.sortBy || 'relevance',
        resultsPerPage: currentFilters.resultsPerPage || 20
      });
    }
  }, [currentFilters]);

  // Update query preview whenever filters change
  useEffect(() => {
    setQueryPreview(buildQueryPreview(filters));
  }, [filters]);

  // Static data for categories and sort options
  const categories = [
    { id: 'newspaper', label: 'Newspapers', description: 'Historical newspaper articles' },
    { id: 'book', label: 'Books', description: 'Books and monographs' },
    { id: 'picture', label: 'Pictures', description: 'Photographs and images' }, // Fixed syntax error
    { id: 'map', label: 'Maps', description: 'Historical maps and plans' },
    { id: 'music', label: 'Music', description: 'Sheet music and recordings' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date_asc', label: 'Date (Oldest first)' },
    { value: 'date_desc', label: 'Date (Newest first)' },
    { value: 'title', label: 'Title A-Z' }
  ];

  // Helper function to dynamically build the search query preview string
  function buildQueryPreview(currentFilters) {
    let query = '';
    
    if (currentFilters.exactPhrase) {
      query += `"${currentFilters.exactPhrase}" `;
    }
    
    if (currentFilters.allWords) {
      query += `${currentFilters.allWords} `;
    }
    
    if (currentFilters.anyWords) {
      const words = currentFilters.anyWords.split(' ').filter(w => w.trim());
      if (words.length > 1) {
        query += `(${words.join(' OR ')}) `;
      } else if (words.length === 1) {
        query += `${words[0]} `;
      }
    }
    
    if (currentFilters.excludeWords) {
      const excludeWords = currentFilters.excludeWords.split(' ').filter(w => w.trim());
      excludeWords.forEach(word => {
        query += `-${word} `;
      });
    }
    
    return query.trim();
  }

  // Generic handler to update a single filter field
  const updateFilters = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handler for checkbox toggles for content categories
  const handleCategoryToggle = (categoryId) => {
    setFilters(prev => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories: newCategories };
    });
  };

  // Handler for the "Apply Filters" button
  const handleApply = () => {
    console.log('Applying filters:', filters); // Debug log
    onApplyFilters(filters);
    onClose();
  };

  // Handler for the "Reset All" button
  const handleReset = () => {
    const resetFilters = {
      exactPhrase: '',
      allWords: '',
      anyWords: '',
      excludeWords: '',
      dateFrom: '',
      dateTo: '',
      categories: ['newspaper'],
      sortBy: 'relevance',
      resultsPerPage: 20
    };
    setFilters(resetFilters);
  };

  // Handler to close the modal if the backdrop is clicked
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render the component if it's not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70] overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-lg lg:max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl transition-all duration-300 transform scale-100 opacity-100">
        {/* Header Section */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Advanced Search</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close advanced search"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content Area - Scrollable on small screens */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-160px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Search Terms */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Search Terms</h3>
              
              {/* Exact Phrase Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exact Phrase
                </label>
                <input
                  type="text"
                  value={filters.exactPhrase}
                  onChange={(e) => updateFilters('exactPhrase', e.target.value)}
                  placeholder='e.g., "World War Two"'
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Search for this exact phrase</p>
              </div>

              {/* All Words Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  All of these words
                </label>
                <input
                  type="text"
                  value={filters.allWords}
                  onChange={(e) => updateFilters('allWords', e.target.value)}
                  placeholder="e.g., Melbourne cricket match"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">All of these words must appear</p>
              </div>

              {/* Any Words Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any of these words
                </label>
                <input
                  type="text"
                  value={filters.anyWords}
                  onChange={(e) => updateFilters('anyWords', e.target.value)}
                  placeholder="e.g., football rugby soccer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Any of these words can appear</p>
              </div>

              {/* Exclude Words Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude these words
                </label>
                <input
                  type="text"
                  value={filters.excludeWords}
                  onChange={(e) => updateFilters('excludeWords', e.target.value)}
                  placeholder="e.g., advertisement classified"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Exclude results containing these words</p>
              </div>

              {/* Query Preview Section */}
              {queryPreview && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Query Preview:
                  </label>
                  <code className="text-sm text-blue-800 break-all">{queryPreview}</code>
                </div>
              )}
            </div>

            {/* Right Column - Filters & Options */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Filters & Options</h3>
              
              {/* Date Range Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      value={filters.dateFrom}
                      onChange={(e) => updateFilters('dateFrom', e.target.value)}
                      placeholder="From year"
                      min="1800"
                      max="2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={filters.dateTo}
                      onChange={(e) => updateFilters('dateTo', e.target.value)}
                      placeholder="To year"
                      min="1800"
                      max="2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Categories Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Content Categories
                </label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-700">{category.label}</span>
                        <p className="text-xs text-gray-500">{category.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Results By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilters('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Results Per Page Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Results Per Page
                </label>
                <select
                  value={filters.resultsPerPage}
                  onChange={(e) => updateFilters('resultsPerPage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value={10}>10 results</option>
                  <option value={20}>20 results</option>
                  <option value={50}>50 results</option>
                  <option value={100}>100 results</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section with action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </button>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-1/2 sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="w-1/2 sm:w-auto flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchFilters;