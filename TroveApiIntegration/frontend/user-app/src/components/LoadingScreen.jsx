import React from 'react';
import { Search, Database, Clock } from 'lucide-react';

const LoadingScreen = ({ message = "Searching Trove archives..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Animated Search Icon */}
      <div className="relative mb-6">
        <div className="animate-pulse">
          <Database className="h-16 w-16 text-blue-600 mx-auto" />
        </div>
        <div className="absolute -top-2 -right-2 animate-bounce">
          <Search className="h-6 w-6 text-blue-400" />
        </div>
      </div>

      {/* Loading Spinner */}
      <div className="mb-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      {/* Loading Message */}
      <div className="text-center max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {message}
        </h3>
        <p className="text-gray-600 mb-4">
          Please wait while we search through millions of historical records...
        </p>
        
        {/* Loading Steps */}
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2 animate-pulse" />
            <span>Connecting to Trove API</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="h-2 w-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            <span>Processing search query</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="h-2 w-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            <span>Retrieving results</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mt-8">
        <div className="bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md">
        <h4 className="font-medium text-blue-900 mb-2">Search Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use quotation marks for exact phrases</li>
          <li>• Try different spellings or synonyms</li>
          <li>• Use date filters to narrow results</li>
        </ul>
      </div>
    </div>
  );
};

export default LoadingScreen;