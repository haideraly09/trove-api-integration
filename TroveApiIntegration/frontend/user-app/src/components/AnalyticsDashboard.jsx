import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, FileText, Search, Eye, Clock } from 'lucide-react';

const AnalyticsDashboard = ({ searchHistory, results }) => {
  // Use `useState` to manage the selected timeframe for the data displayed
  const [timeframe, setTimeframe] = useState('week');
  // Use `useState` to hold the calculated analytics data
  const [analytics, setAnalytics] = useState({
    totalSearches: 0,
    totalResults: 0,
    avgResultsPerSearch: 0,
    topQueries: [],
    searchTrends: [],
    contentTypes: [],
    dateDistribution: []
  });

  // `useEffect` hook to recalculate analytics whenever the data or timeframe changes
  useEffect(() => {
    calculateAnalytics();
  }, [searchHistory, results, timeframe]);

  const calculateAnalytics = () => {
    // If no search history is available, reset the analytics state to default values
    if (!searchHistory || searchHistory.length === 0) {
      setAnalytics({
        totalSearches: 0,
        totalResults: 0,
        avgResultsPerSearch: 0,
        topQueries: [],
        searchTrends: [],
        contentTypes: [],
        dateDistribution: []
      });
      return;
    }

    // --- Basic Stats Calculation ---
    const totalSearches = searchHistory.length;
    // Calculate total results by summing up result counts from each search
    const totalResults = searchHistory.reduce((sum, search) => sum + (search.resultCount || 0), 0);
    // Calculate the average number of results per search, rounded to the nearest integer
    const avgResultsPerSearch = totalSearches > 0 ? Math.round(totalResults / totalSearches) : 0;

    // --- Top Queries Calculation ---
    // Count the occurrences of each unique search query
    const queryCount = {};
    searchHistory.forEach(search => {
      queryCount[search.query] = (queryCount[search.query] || 0) + 1;
    });
    // Convert the query counts into an array of objects, sort by count, and take the top 10
    const topQueries = Object.entries(queryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // --- Search Trends over Time Calculation ---
    const now = new Date();
    // Get the time ranges based on the selected timeframe ('week' or 'month')
    const timeRanges = getTimeRanges(timeframe);
    const searchTrends = timeRanges.map(range => {
      // Filter search history to find searches within the current time range
      const searchesInRange = searchHistory.filter(search => {
        const searchDate = new Date(search.timestamp);
        return searchDate >= range.start && searchDate <= range.end;
      });
      return {
        period: range.label,
        searches: searchesInRange.length,
        results: searchesInRange.reduce((sum, search) => sum + (search.resultCount || 0), 0)
      };
    });

    // --- Content Type Distribution from Results Calculation ---
    const contentTypeCount = {};
    if (results && results.length > 0) {
      results.forEach(result => {
        const type = result.type || 'unknown';
        contentTypeCount[type] = (contentTypeCount[type] || 0) + 1;
      });
    }
    const contentTypes = Object.entries(contentTypeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // --- Date Distribution of Articles Calculation ---
    const dateDistribution = {};
    if (results && results.length > 0) {
      results.forEach(result => {
        if (result.date) {
          // Extract the year from the date string
          const year = result.date.substring(0, 4);
          if (year && year.match(/^\d{4}$/)) {
            // Group results by decade
            const decade = Math.floor(parseInt(year) / 10) * 10;
            const decadeLabel = `${decade}s`;
            dateDistribution[decadeLabel] = (dateDistribution[decadeLabel] || 0) + 1;
          }
        }
      });
    }
    const sortedDateDistribution = Object.entries(dateDistribution)
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => a.decade.localeCompare(b.decade));

    // Update the state with all the calculated analytics
    setAnalytics({
      totalSearches,
      totalResults,
      avgResultsPerSearch,
      topQueries,
      searchTrends,
      contentTypes,
      dateDistribution: sortedDateDistribution
    });
  };

  // Helper function to generate time ranges for the charts based on the timeframe
  const getTimeRanges = (timeframe) => {
    const now = new Date();
    const ranges = [];

    if (timeframe === 'week') {
      // Generate ranges for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        ranges.push({
          start,
          end,
          label: date.toLocaleDateString('en-AU', { weekday: 'short' })
        });
      }
    } else if (timeframe === 'month') {
      // Generate ranges for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        ranges.push({
          start,
          end,
          label: date.getDate().toString()
        });
      }
    }

    return ranges;
  };

  // Define a color palette for the charts
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

  return (
    // Main container with responsive padding and max-width for large screens
    <div className="p-4 md:p-8 lg:p-12 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold text-gray-900">Search Analytics</h2>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {/* Stats Cards: Responsive grid that changes from 1 to 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex items-center">
            <Search className="h-10 w-10 text-blue-600 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Searches</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalSearches}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex items-center">
            <FileText className="h-10 w-10 text-green-600 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Results</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalResults.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex items-center">
            <TrendingUp className="h-10 w-10 text-purple-600 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Results/Search</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.avgResultsPerSearch}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex items-center">
            <Clock className="h-10 w-10 text-orange-600 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last Search</p>
              <p className="text-base font-bold text-gray-900">
                {searchHistory.length > 0 
                  ? new Date(searchHistory[searchHistory.length - 1].timestamp).toLocaleDateString()
                  : 'No searches'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row: Responsive grid that changes from 1 to 2 columns on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Trends Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Search Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.searchTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="searches" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Searches"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Content Types Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Types Found</h3>
            {analytics.contentTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.contentTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.contentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No content type data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Responsive grid for queries and historical data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Queries List */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Most Searched Terms</h3>
            {analytics.topQueries.length > 0 ? (
              <div className="space-y-4">
                {analytics.topQueries.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-base text-gray-700 truncate flex-1 mr-4">
                      {item.query}
                    </span>
                    <div className="flex items-center min-w-[100px]">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(item.count / analytics.topQueries[0].count) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No search history available</p>
            )}
          </div>

          {/* Historical Date Distribution Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Results by Historical Period</h3>
            {analytics.dateDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.dateDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No historical date data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
