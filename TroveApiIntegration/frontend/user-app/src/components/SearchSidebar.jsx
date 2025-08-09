import React, { useState, useEffect } from 'react';
import { Filter, Calendar, FileText, Users, ChevronDown, ChevronUp, X, Menu, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SearchSidebar = ({ filters, onFiltersChange, resultCount, searchResults = [] }) => {
  // State to manage which filter sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    dateRange: false,
    contentType: true,
    contributor: false,
    analytics: false // Added analytics section
  });
  
  // State for mobile sidebar visibility and to detect if the screen is mobile-sized
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // useEffect to check and update the mobile state on window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Matches Tailwind's 'lg' breakpoint
    };
    
    checkMobile(); // Initial check on component mount
    window.addEventListener('resize', checkMobile);
    // Cleanup function to remove the event listener on unmount
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // useEffect to close the mobile sidebar when a user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the sidebar container and the toggle button
      if (isMobileOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.sidebar-toggle')) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileOpen]);

  // useEffect to prevent body scrolling when the mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen, isMobile]);

  // Toggle the expanded state of a filter section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handler for changes to the date range filter
  const handleDateChange = (field, value) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  // Handler for changes to the content type filter
  const handleContentTypeChange = (type) => {
    const newTypes = filters.contentTypes.includes(type)
      ? filters.contentTypes.filter(t => t !== type)
      : [...filters.contentTypes, type];
    
    onFiltersChange({
      ...filters,
      contentTypes: newTypes
    });
  };

  // Handler for changes to the contributor filter
  const handleContributorChange = (contributor) => {
    const newContributors = filters.contributors.includes(contributor)
      ? filters.contributors.filter(c => c !== contributor)
      : [...filters.contributors, contributor];
    
    onFiltersChange({
      ...filters,
      contributors: newContributors
    });
  };

  // Resets all filters to their default state
  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: { from: '', to: '' },
      contentTypes: [],
      contributors: []
    });
  };

  // Checks if any filters are currently active
  const hasActiveFilters = filters.dateRange.from || filters.dateRange.to || 
                           filters.contentTypes.length > 0 || filters.contributors.length > 0;

  // Calculates the total number of active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    count += filters.contentTypes.length;
    count += filters.contributors.length;
    return count;
  };

  // NEW: Generate chart data from search results
  const generateChartData = () => {
    if (!searchResults || searchResults.length === 0) {
      return {
        contentTypeData: [],
        yearData: [],
        contributorData: []
      };
    }

    // Content type distribution
    const contentTypeCounts = {};
    const yearCounts = {};
    const contributorCounts = {};

    searchResults.forEach(result => {
      // Count content types
      const contentType = result.contentType || result.category || 'unknown';
      contentTypeCounts[contentType] = (contentTypeCounts[contentType] || 0) + 1;

      // Count years (extract from date)
      if (result.date) {
        const year = new Date(result.date).getFullYear();
        if (!isNaN(year)) {
          const decade = Math.floor(year / 10) * 10;
          const decadeLabel = `${decade}s`;
          yearCounts[decadeLabel] = (yearCounts[decadeLabel] || 0) + 1;
        }
      }

      // Count contributors
      const contributor = result.contributor || result.source || 'unknown';
      contributorCounts[contributor] = (contributorCounts[contributor] || 0) + 1;
    });

    return {
      contentTypeData: Object.entries(contentTypeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      
      yearData: Object.entries(yearCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 10),
      
      contributorData: Object.entries(contributorCounts)
        .map(([name, value]) => ({ name: name.substring(0, 20) + (name.length > 20 ? '...' : ''), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    };
  };

  const chartData = generateChartData();
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  // Handle chart click to filter results
  const handleChartClick = (data, type) => {
    if (!data || !data.activePayload || !data.activePayload[0]) return;
    
    const clickedItem = data.activePayload[0].payload.name;
    
    if (type === 'contentType') {
      handleContentTypeChange(clickedItem.toLowerCase());
    } else if (type === 'contributor') {
      // Find full contributor name
      const fullName = searchResults.find(r => 
        (r.contributor || r.source || '').startsWith(clickedItem.replace('...', ''))
      )?.contributor || clickedItem;
      handleContributorChange(fullName);
    }
  };

  // Mobile Toggle Button to open/close the sidebar on small screens
  const MobileToggle = () => (
    <button
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="sidebar-toggle lg:hidden fixed top-20 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
      aria-label="Toggle filters"
    >
      <div className="flex items-center justify-center">
        <Menu className="h-5 w-5" />
        {hasActiveFilters && (
          <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center -top-2 -right-2 absolute animate-pulse">
            {getActiveFiltersCount()}
          </span>
        )}
      </div>
    </button>
  );

  // The main content of the sidebar, extracted into a component for reuse
  const SidebarContent = () => (
    <div className="sidebar-container h-full flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 lg:sticky lg:top-4">
      {/* Mobile-only Header with Close Button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Close filters"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Results Count Display */}
        {resultCount !== null && (
          <div className="mb-4 lg:mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-base text-blue-800 font-medium">
              <span className="font-bold">{resultCount.toLocaleString()}</span> results found
            </p>
          </div>
        )}

        {/* NEW: Analytics Charts Section */}
        {searchResults && searchResults.length > 0 && (
          <div className="mb-6 border-b border-gray-200 pb-4">
            <button
              onClick={() => toggleSection('analytics')}
              className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-gray-500 mr-3" />
                <span className="font-medium text-gray-900">Analytics</span>
              </div>
              {expandedSections.analytics ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.analytics && (
              <div className="mt-4 space-y-6 px-2">
                {/* Content Type Chart */}
                {chartData.contentTypeData.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Content Types</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart onClick={(data) => handleChartClick(data, 'contentType')}>
                        <Pie
                          data={chartData.contentTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          className="cursor-pointer"
                        >
                          {chartData.contentTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Time Distribution Chart */}
                {chartData.yearData.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Time Distribution</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={chartData.yearData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Contributors Chart */}
                {chartData.contributorData.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Top Contributors</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart 
                        data={chartData.contributorData} 
                        layout="horizontal"
                        onClick={(data) => handleChartClick(data, 'contributor')}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={10} />
                        <YAxis dataKey="name" type="category" width={80} fontSize={9} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10B981" className="cursor-pointer" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Date Range Filter Section */}
        <div className="mb-6 border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('dateRange')}
            className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-3" />
              <span className="font-medium text-gray-900">Date Range</span>
            </div>
            {expandedSections.dateRange ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {expandedSections.dateRange && (
            <div className="mt-4 space-y-4 px-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Year
                </label>
                <input
                  type="number"
                  value={filters.dateRange.from}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  placeholder="e.g., 1900"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="1800"
                  max="2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Year
                </label>
                <input
                  type="number"
                  value={filters.dateRange.to}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  placeholder="e.g., 1950"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="1800"
                  max="2024"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Type Filter Section */}
        <div className="mb-6 border-b border-gray-200 pb-4">
          <button
            onClick={() => toggleSection('contentType')}
            className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-500 mr-3" />
              <span className="font-medium text-gray-900">Content Type</span>
              {filters.contentTypes.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {filters.contentTypes.length}
                </span>
              )}
            </div>
            {expandedSections.contentType ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {expandedSections.contentType && (
            <div className="mt-4 space-y-2 px-2">
              {['newspaper', 'book', 'picture', 'map', 'music'].map((type) => (
                <label key={type} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.contentTypes.includes(type)}
                    onChange={() => handleContentTypeChange(type)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <span className="ml-3 text-sm text-gray-700 capitalize select-none">{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Popular Contributors Section */}
        <div className="mb-4 lg:mb-6">
          <button
            onClick={() => toggleSection('contributor')}
            className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-500 mr-3" />
              <span className="font-medium text-gray-900">Contributors</span>
              {filters.contributors.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {filters.contributors.length}
                </span>
              )}
            </div>
            {expandedSections.contributor ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {expandedSections.contributor && (
            <div className="mt-4 space-y-2 px-2">
              {['The Age', 'The Sydney Morning Herald', 'The Australian', 'National Library of Australia'].map((contributor) => (
                <label key={contributor} className="flex items-start p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.contributors.includes(contributor)}
                    onChange={() => handleContributorChange(contributor)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0 mt-0.5"
                  />
                  <span className="ml-3 text-sm text-gray-700 select-none leading-tight">{contributor}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile-only Apply Button */}
      <div className="lg:hidden border-t border-gray-200 bg-gray-50 p-4 rounded-b-xl">
        <button
          onClick={() => setIsMobileOpen(false)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          Apply Filters {hasActiveFilters && `(${getActiveFiltersCount()})`}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Renders a floating toggle button on mobile */}
      <MobileToggle />

      {/* Renders the full sidebar content on desktop */}
      <div className="hidden lg:block w-72 xl:w-80 h-full">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay, visible when isMobileOpen is true */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          {/* Backdrop to close the sidebar on click */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Mobile sidebar content */}
          <div className="relative bg-white w-full max-w-xs shadow-xl transform transition-transform duration-300 translate-x-0">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default SearchSidebar;