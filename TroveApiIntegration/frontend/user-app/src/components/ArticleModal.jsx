import React from 'react';
import { X, ExternalLink, Calendar, FileText, User, MapPin } from 'lucide-react';

const ArticleModal = ({ article, isOpen, onClose }) => {
  if (!isOpen || !article) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleViewOnTrove = () => {
    if (article.troveUrl) {
      window.open(article.troveUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl mx-2 sm:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 pr-4">
            Article Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Metadata - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
            {article.date && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-1">Date:</span>
                <span>{article.date}</span>
              </div>
            )}
            
            {article.type && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-1">Type:</span>
                <span className="capitalize">{article.type}</span>
              </div>
            )}
            
            {article.contributor && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-1">Source:</span>
                <span>{article.contributor}</span>
              </div>
            )}
            
            {article.id && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400" />
                <span className="font-medium mr-1">ID:</span>
                <span className="font-mono text-xs">{article.id}</span>
              </div>
            )}
          </div>

          {/* Snippet/Content */}
          {article.snippet && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Content Preview</h3>
              <div className="p-3 sm:p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {article.snippet}
                </p>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">About This Record</h3>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="text-sm sm:text-base">
                This record is part of the National Library of Australia's Trove collection, 
                which contains millions of items from libraries, museums, archives and other 
                cultural institutions across Australia.
              </p>
              {article.type === 'newspaper' && (
                <p className="mt-2 text-sm sm:text-base">
                  This newspaper article has been digitized and made searchable through 
                  optical character recognition (OCR). The text may contain some errors 
                  due to the digitization process.
                </p>
              )}
            </div>
          </div>

          {/* Actions - Stacked on Mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
            <button
              onClick={handleViewOnTrove}
              disabled={!article.troveUrl}
              className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              View on Trove
            </button>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(article.troveUrl || window.location.href);
              }}
              className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
            >
              Copy Link
            </button>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> This content is provided by the National Library of Australia 
              through the Trove service. All rights remain with the original copyright holders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;