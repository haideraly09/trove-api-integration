import React, { useState, useEffect } from 'react';
import { Search, BarChart3, Clock, Settings, FileText, AlertCircle, CheckCircle } from 'lucide-react';

// Import components
import Header from './components/Header';
import SearchSidebar from './components/SearchSidebar';
import LoadingScreen from './components/LoadingScreen';
import ArticleModal from './components/ArticleModal';
import AdvancedSearchFilters from './components/AdvancedSearchFilters';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Timeline3D from './components/Timeline3D';

// Import hooks and utilities
import { useApi, useSearchHistory, usePreferences } from './Hooks/useApi';
import { handleApiError, formatResultCount, sortResults, filterResultsByType } from './utils/Helper';

function App() {
  // Core state
  const [currentView, setCurrentView] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [apiStatus, setApiStatus] = useState({ isHealthy: null, message: '' });

  // Modal states
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // FIXED: Updated filter states to match both components
  const [filters, setFilters] = useState({
    dateRange: { from: '', to: '' },
    contentTypes: [],
    contributors: []
  });

  // NEW: Advanced search filters state (separate from sidebar filters)
  const [advancedFilters, setAdvancedFilters] = useState({
    exactPhrase: '',
    allWords: '',
    anyWords: '',
    excludeWords: '',
    dateFrom: '',
    dateTo: '',
    categories: ['newspaper'],
    sortBy: 'relevance',
    resultsPerPage: 20
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(20);

  // Sort and display options
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('list');
  
  // NEW: Track last search type for better UX
  const [lastSearchType, setLastSearchType] = useState('basic'); // 'basic' or 'advanced'

  // Hooks
  const { loading, error, searchTrove, advancedSearch, checkTroveStatus } = useApi();
  const { searchHistory, addSearch } = useSearchHistory();
  const { preferences, updatePreference } = usePreferences();

  // Initialize app
  useEffect(() => {
    checkApiHealth();
    
    // Load preferences
    setResultsPerPage(preferences.resultsPerPage || 20);
    setSortBy(preferences.defaultSort || 'relevance');
    
    // Update advanced filters with preferences
    setAdvancedFilters(prev => ({
      ...prev,
      sortBy: preferences.defaultSort || 'relevance',
      resultsPerPage: preferences.resultsPerPage || 20
    }));
  }, [preferences]);

  // IMPROVED: Update filtered results when results or filters change
  useEffect(() => {
    let filtered = [...searchResults];
    
    // Apply content type filter
    if (filters.contentTypes.length > 0) {
      filtered = filtered.filter(result => {
        const resultType = result.category || result.type || result.format || 'unknown';
        return filters.contentTypes.some(type => 
          resultType.toLowerCase().includes(type.toLowerCase())
        );
      });
    }
    
    // Apply date filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(result => {
        if (!result.date) return false;
        
        // Extract year from various date formats
        const year = extractYearFromDate(result.date);
        if (!year) return false;
        
        const fromYear = filters.dateRange.from ? parseInt(filters.dateRange.from) : 0;
        const toYear = filters.dateRange.to ? parseInt(filters.dateRange.to) : 9999;
        
        return year >= fromYear && year <= toYear;
      });
    }
    
    // Apply contributor filter
    if (filters.contributors.length > 0) {
      filtered = filtered.filter(result => {
        const contributor = result.contributor || result.source || result.newspaper || '';
        return filters.contributors.some(filterContributor => 
          contributor.toLowerCase().includes(filterContributor.toLowerCase())
        );
      });
    }
    
    // Apply sorting
    filtered = sortResults(filtered, sortBy);
    
    setFilteredResults(filtered);
    
    // Reset to first page when filters change
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [searchResults, filters, sortBy]);

  // NEW: Helper function to extract year from various date formats
  const extractYearFromDate = (dateString) => {
    if (!dateString) return null;
    
    // Try to match 4-digit year
    const yearMatch = dateString.match(/(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      // Validate year range (reasonable historical range)
      if (year >= 1800 && year <= 2024) {
        return year;
      }
    }
    
    return null;
  };

  // Check API health
  const checkApiHealth = async () => {
    try {
      const status = await checkTroveStatus();
      setApiStatus({
        isHealthy: status.isUp,
        message: status.message || 'API is working normally'
      });
    } catch (err) {
      setApiStatus({
        isHealthy: false,
        message: 'Unable to connect to Trove API'
      });
    }
  };

  // IMPROVED: Handle basic search
  const handleSearch = async (query, options = {}) => {
    if (!query.trim()) return;
    
    try {
      setCurrentPage(1);
      setLastSearchType('basic');
      
      const searchOptions = {
        resultsPerPage: options.resultsPerPage || resultsPerPage,
        startIndex: options.startIndex || 0,
        ...options
      };
      
      console.log('Searching with query:', query, 'options:', searchOptions);
      
      const response = await searchTrove(query, searchOptions);
      
      if (response.response?.docs) {
        setSearchResults(response.response.docs);
        setTotalResults(response.response.numFound || 0);
        addSearch(query, response.response.numFound || 0);
        
        // Switch to search view if not already there
        if (currentView !== 'search') {
          setCurrentView('search');
        }
        
        console.log('Search successful, found:', response.response.numFound, 'results');
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      console.error('Search failed:', errorInfo);
    }
  };

  // IMPROVED: Handle advanced search with proper filter mapping
  const handleAdvancedSearch = async (filterOptions) => {
    console.log('Advanced search with filters:', filterOptions);
    
    try {
      setLastSearchType('advanced');
      setCurrentPage(1);
      
      // Update the advanced filters state
      setAdvancedFilters(filterOptions);
      
      // Also update results per page and sort options globally
      setResultsPerPage(filterOptions.resultsPerPage);
      setSortBy(filterOptions.sortBy);
      
      // Build search query from advanced filters
      const query = buildAdvancedQuery(filterOptions);
      
      // Prepare search options
      const searchOptions = {
        query: query,
        categories: filterOptions.categories,
        sortBy: filterOptions.sortBy,
        resultsPerPage: filterOptions.resultsPerPage,
        dateFrom: filterOptions.dateFrom,
        dateTo: filterOptions.dateTo,
        startIndex: 0
      };
      
      console.log('Advanced search query:', query, 'options:', searchOptions);
      
      const response = await advancedSearch(searchOptions);
      
      if (response.response?.docs) {
        setSearchResults(response.response.docs);
        setTotalResults(response.response.numFound || 0);
        addSearch(`Advanced: ${query || 'Custom Search'}`, response.response.numFound || 0);
        setCurrentView('search');
        
        console.log('Advanced search successful, found:', response.response.numFound, 'results');
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      console.error('Advanced search failed:', errorInfo);
    }
  };

  // NEW: Build query string from advanced filters
  const buildAdvancedQuery = (filterOptions) => {
    let query = '';
    
    if (filterOptions.exactPhrase) {
      query += `"${filterOptions.exactPhrase}" `;
    }
    
    if (filterOptions.allWords) {
      query += `${filterOptions.allWords} `;
    }
    
    if (filterOptions.anyWords) {
      const words = filterOptions.anyWords.split(' ').filter(w => w.trim());
      if (words.length > 1) {
        query += `(${words.join(' OR ')}) `;
      } else if (words.length === 1) {
        query += `${words[0]} `;
      }
    }
    
    if (filterOptions.excludeWords) {
      const excludeWords = filterOptions.excludeWords.split(' ').filter(w => w.trim());
      excludeWords.forEach(word => {
        query += `-${word} `;
      });
    }
    
    return query.trim() || '*'; // Default to wildcard if no query
  };

  // IMPROVED: Handle filters change from sidebar
  const handleFiltersChange = (newFilters) => {
    console.log('Sidebar filters changed:', newFilters);
    setFilters(newFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    
    if (lastSearchType === 'advanced') {
      // For advanced search, we might need to re-run the search with new startIndex
      const startIndex = (newPage - 1) * resultsPerPage;
      handleAdvancedSearch({ ...advancedFilters, startIndex });
    } else {
      // For basic search
      const startIndex = (newPage - 1) * resultsPerPage;
      handleSearch(searchQuery, { startIndex });
    }
  };

  // Handle article selection
  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  // Get current page results
  const getCurrentPageResults = () => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

  // IMPROVED: Navigation component with better Advanced button
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('search')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'search'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </button>
            
            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'analytics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </button>
            
            <button
              onClick={() => setCurrentView('timeline')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'timeline'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* API Status Indicator */}
            <div className="flex items-center text-sm">
              {apiStatus.isHealthy === true ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : apiStatus.isHealthy === false ? (
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
              ) : null}
              <span className={`text-xs ${
                apiStatus.isHealthy === true ? 'text-green-600' : 
                apiStatus.isHealthy === false ? 'text-red-600' : 'text-gray-500'
              }`}>
                {apiStatus.isHealthy === true ? 'API Online' : 
                 apiStatus.isHealthy === false ? 'API Offline' : 'Checking...'}
              </span>
            </div>
            
            {/* IMPROVED: More prominent Advanced Search button */}
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              title="Open Advanced Search"
            >
              <Settings className="h-4 w-4 mr-2" />
              Advanced Search
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // IMPROVED: Search Results Component with better feedback
  const SearchResults = () => (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filteredResults.length > 0 && (
            <span>
              Showing {((currentPage - 1) * resultsPerPage) + 1}-{Math.min(currentPage * resultsPerPage, filteredResults.length)} of {formatResultCount(filteredResults.length)} results
              {filteredResults.length !== searchResults.length && (
                <span className="text-blue-600"> (filtered from {formatResultCount(searchResults.length)})</span>
              )}
              {lastSearchType === 'advanced' && (
                <span className="text-purple-600 ml-2">[Advanced Search]</span>
              )}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="title">Title A-Z</option>
          </select>
          
          <select
            value={resultsPerPage}
            onChange={(e) => {
              const newCount = parseInt(e.target.value);
              setResultsPerPage(newCount);
              updatePreference('resultsPerPage', newCount);
              setCurrentPage(1); // Reset to first page
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {getCurrentPageResults().map((article, index) => (
          <div
            key={article.id || index}
            className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => handleArticleSelect(article)}
          >
            <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2">
              {article.title || 'Untitled'}
            </h3>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              {article.date && (
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {article.date}
                </span>
              )}
              {(article.type || article.category) && (
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">
                  {article.type || article.category}
                </span>
              )}
              {(article.contributor || article.newspaper || article.source) && (
                <span className="text-gray-500">
                  {article.contributor || article.newspaper || article.source}
                </span>
              )}
            </div>
            
            {(article.snippet || article.teaser) && (
              <p className="text-gray-700 leading-relaxed">
                {((article.snippet || article.teaser) + '').substring(0, 300)}
                {((article.snippet || article.teaser) + '').length > 300 && '...'}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let page;
            if (totalPages <= 7) {
              page = i + 1;
            } else if (currentPage <= 4) {
              page = i + 1;
            } else if (currentPage >= totalPages - 3) {
              page = totalPages - 6 + i;
            } else {
              page = currentPage - 3 + i;
            }
            
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        onSearch={handleSearch}
        isSearching={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults} 
      />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* FIXED: Sidebar - Only show on search view, pass searchResults */}
          {currentView === 'search' && (
            <aside className="lg:w-80 lg:flex-shrink-0 w-full">
              <SearchSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                resultCount={filteredResults.length}
                searchResults={searchResults} // FIXED: Pass searchResults for analytics
              />
            </aside>
          )}

          {/* Main Content Area */}
          <div className={`flex-1 ${currentView === 'search' ? '' : 'max-w-none'}`}>
            {loading && <LoadingScreen />}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Content Views */}
            {!loading && (
              <>
                {currentView === 'search' && (
                  <>
                    {filteredResults.length > 0 ? (
                      <SearchResults />
                    ) : searchQuery && !error ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-600 mb-4">
                          Try adjusting your search terms or filters
                        </p>
                        <button
                          onClick={() => setShowAdvancedFilters(true)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Try Advanced Search
                        </button>
                      </div>
                    ) : !searchQuery && (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
                        <p className="text-gray-600 mb-4">
                          Enter a search term above to explore Trove's archives
                        </p>
                        <button
                          onClick={() => setShowAdvancedFilters(true)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Try Advanced Search
                        </button>
                      </div>
                    )}
                  </>
                )}

                {currentView === 'analytics' && (
                  <AnalyticsDashboard
                    searchHistory={searchHistory}
                    results={searchResults}
                  />
                )}

                {currentView === 'timeline' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Timeline</h2>
                      <p className="text-gray-600">
                        Explore your search results across time in an interactive 3D timeline
                      </p>
                    </div>
                    <Timeline3D
                      results={searchResults}
                      onArticleSelect={handleArticleSelect}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ArticleModal
        article={selectedArticle}
        isOpen={showArticleModal}
        onClose={() => {
          setShowArticleModal(false);
          setSelectedArticle(null);
        }}
      />

      {/* FIXED: Pass current advanced filters to the modal */}
      <AdvancedSearchFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleAdvancedSearch}
        currentFilters={advancedFilters}
      />
    </div>
  );
}

export default App;