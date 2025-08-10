const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Get API key from environment
const TROVE_API_KEY = process.env.TROVE_API_KEY;

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Trove API Backend is running! (v3)', 
        hasApiKey: !!TROVE_API_KEY,
        keyPreview: TROVE_API_KEY ? TROVE_API_KEY.substring(0, 8) + '...' : 'Missing'
    });
});

// Main search endpoint
app.get('/api/trove', async (req, res) => {
    console.log('🔍 Search request received:', req.query);
    
    try {
        // Check API key
        if (!TROVE_API_KEY) {
            return res.status(500).json({ 
                error: 'API key not configured' 
            });
        }

        // Get parameters
        const query = req.query.q;
        const n = req.query.n || 20;
        const s = req.query.s || 0;

        // Validate query
        if (!query || query.trim() === '') {
            return res.status(400).json({ 
                error: 'Search query is required' 
            });
        }

        // Build Trove API v3 URL - changed from v2 to v3 and zone to category
        const params = new URLSearchParams({
            q: query.trim(),
            category: 'newspaper', // Changed from 'zone' to 'category'
            key: TROVE_API_KEY,
            encoding: 'json',
            n: Math.min(parseInt(n) || 20, 100)
        });

        if (parseInt(s) > 0) {
            params.append('s', s);
        }

        // Updated URL to use v3 instead of v2
        const troveUrl = `https://api.trove.nla.gov.au/v3/result?${params}`;
        console.log('📡 Calling Trove API v3...');

        // Make request to Trove with retry logic
        let response;
        let lastError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`📡 Attempt ${attempt} to call Trove API v3...`);
                
                response = await fetch(troveUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'TroveSearchApp/1.0',
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                });

                console.log(`📡 Attempt ${attempt} - Trove response:`, response.status);

                if (response.ok) {
                    console.log('✅ Trove API v3 responded successfully');
                    break; // Success, exit retry loop
                } else if (response.status === 503 && attempt < 3) {
                    lastError = `503 Service Unavailable (attempt ${attempt})`;
                    console.log(`⚠️ Attempt ${attempt} failed: 503 Service Unavailable. Retrying in 3 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
                    continue;
                } else {
                    // Other error or final attempt
                    const errorText = await response.text();
                    lastError = `${response.status}: ${errorText}`;
                    break;
                }
            } catch (fetchError) {
                lastError = fetchError.message;
                console.log(`❌ Attempt ${attempt} failed:`, fetchError.message);
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }

        if (!response || !response.ok) {
            console.log('❌ All attempts failed:', lastError);
            
            if (response?.status === 503) {
                return res.status(503).json({ 
                    error: 'Trove API is currently unavailable. This is a temporary issue with their servers. Please try again in a few minutes.',
                    attempts: 3,
                    suggestion: 'You can check Trove\'s status at https://trove.nla.gov.au'
                });
            }
            
            return res.status(response?.status || 500).json({ 
                error: `Trove API error: ${lastError}`,
                attempts: 3
            });
        }

        // Parse response
        const data = await response.json();
        console.log('✅ Trove v3 response received');

        // Extract results - CORRECTED for actual v3 response structure
        let results = [];
        let total = 0;

        console.log('📋 Raw API response structure:', JSON.stringify(data, null, 2));

        // Correct v3 structure based on actual API response
        if (data?.category && Array.isArray(data.category) && data.category.length > 0) {
            const categoryData = data.category[0];
            if (categoryData?.records?.article) {
                // For newspaper articles, the structure is category[0].records.article
                results = categoryData.records.article;
                total = parseInt(categoryData.records.total) || 0;
                console.log('✅ Found newspaper articles in v3 structure');
            } else if (categoryData?.records?.work) {
                // For other types, it might still use 'work'
                results = categoryData.records.work;
                total = parseInt(categoryData.records.total) || 0;
                console.log('✅ Found works in v3 structure');
            }
        }
        // Fallback: check legacy v2 structure for backward compatibility
        else if (data?.response?.zone?.[0]?.records?.work) {
            results = data.response.zone[0].records.work;
            total = parseInt(data.response.zone[0].records.total) || 0;
            console.log('✅ Found results in v2 legacy structure');
        }
        else {
            console.log('❌ No results found in expected structures');
            console.log('Available top-level keys:', Object.keys(data || {}));
            if (data?.category?.[0]) {
                console.log('Category[0] keys:', Object.keys(data.category[0]));
                if (data.category[0].records) {
                    console.log('Records keys:', Object.keys(data.category[0].records));
                }
            }
        }
        
        // Normalize results for consistent frontend handling
        results = results.map((item, index) => ({
            id: item.id || `result-${index}`,
            title: item.heading || item.title || 'Untitled', // v3 uses 'heading' for articles
            snippet: item.snippet || '',
            date: item.date || item.issued || '',
            type: item.category || item.type || 'newspaper', // v3 uses 'category' for article type
            contributor: item.title?.title || item.contributor || '', // v3 newspaper title structure
            troveUrl: item.troveUrl || item.url || item.identifier || ''
        }));
        
        // Normalize results
        results = results.map((item, index) => ({
            id: item.id || `result-${index}`,
            title: item.title || item.heading || 'Untitled',
            snippet: item.snippet || '',
            date: item.date || item.issued || '',
            type: item.type || 'newspaper',
            contributor: item.contributor || '',
            troveUrl: item.troveUrl || item.url || item.identifier || ''
        }));

        console.log(`📊 Returning ${results.length} results (total: ${total})`);

        return res.json({
            response: {
                docs: results,
                numFound: total,
                start: parseInt(s) || 0
            },
            query: query,
            success: true
        });

    } catch (error) {
        console.error('❌ Server error:', error.message);
        return res.status(500).json({ 
            error: 'Server error: ' + error.message 
        });
    }
});

// Test API key endpoint - Updated for v3
app.get('/api/test-key', async (req, res) => {
    try {
        if (!TROVE_API_KEY) {
            return res.status(500).json({ 
                error: 'API key not found' 
            });
        }

        console.log('🧪 Testing API key with v3...');
        
        // Updated to use v3 and category instead of zone
        const testUrl = `https://api.trove.nla.gov.au/v3/result?q=australia&category=newspaper&key=${TROVE_API_KEY}&encoding=json&n=1`;
        
        const response = await fetch(testUrl);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📋 Test API response structure:', JSON.stringify(data, null, 2));
            
            // Check v3 structure (category[0].records.article for newspapers)
            const hasArticles = data?.category?.[0]?.records?.article?.length > 0;
            const hasWorks = data?.category?.[0]?.records?.work?.length > 0;
            const hasResults = hasArticles || hasWorks;
            
            return res.json({ 
                status: hasResults ? 'API key is working with v3!' : 'API key valid but no results',
                keyPrefix: TROVE_API_KEY.substring(0, 8) + '...',
                hasResults: hasResults,
                responseStructure: {
                    hasCategory: !!data?.category,
                    hasArticles: hasArticles,
                    hasWorks: hasWorks,
                    topLevelKeys: Object.keys(data || {})
                }
            });
        } else {
            return res.status(response.status).json({
                status: 'API key test failed',
                error: `Status: ${response.status}`
            });
        }
        
    } catch (error) {
        console.error('🧪 Test error:', error);
        return res.status(500).json({ 
            error: error.message 
        });
    }
});

// Check Trove API status - Updated for v3
app.get('/api/check-trove-status', async (req, res) => {
    try {
        console.log('🏥 Checking Trove API v3 health...');
        
        // Try a very simple request to check if Trove v3 is up
        const testUrl = `https://api.trove.nla.gov.au/v3/result?q=test&category=newspaper&key=${TROVE_API_KEY}&encoding=json&n=1`;
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'TroveSearchApp/1.0',
                'Accept': 'application/json'
            }
        });
        
        const status = {
            isUp: response.ok,
            statusCode: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            version: 'v3'
        };
        
        if (response.ok) {
            console.log('✅ Trove API v3 is healthy');
            return res.json({
                ...status,
                message: 'Trove API v3 is working normally'
            });
        } else {
            console.log(`⚠️ Trove API v3 issues: ${response.status}`);
            return res.json({
                ...status,
                message: response.status === 503 ? 
                    'Trove API v3 is temporarily unavailable (503)' : 
                    `Trove API v3 returned error: ${response.status}`
            });
        }
        
    } catch (error) {
        console.error('❌ Health check failed:', error);
        return res.json({
            isUp: false,
            statusCode: 'ERROR',
            message: 'Cannot connect to Trove API v3: ' + error.message,
            timestamp: new Date().toISOString(),
            version: 'v3'
        });
    }
});

// Direct Trove test - Updated for v3
app.get('/api/test-direct-trove', async (req, res) => {
    try {
        if (!TROVE_API_KEY) {
            return res.status(500).json({ 
                success: false, 
                error: 'API key not configured' 
            });
        }

        const testQuery = req.query.q || 'melbourne';
        // Updated to use v3 and category
        const testUrl = `https://api.trove.nla.gov.au/v3/result?q=${encodeURIComponent(testQuery)}&category=newspaper&key=${TROVE_API_KEY}&encoding=json&n=1`;
        
        const response = await fetch(testUrl);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📋 Direct test response structure:', JSON.stringify(data, null, 2));
            
            // Check v3 structure
            const hasArticles = data?.category?.[0]?.records?.article?.length > 0;
            const hasWorks = data?.category?.[0]?.records?.work?.length > 0;
            const hasResults = hasArticles || hasWorks;
            
            let totalResults = 0;
            if (data?.category?.[0]?.records?.total) {
                totalResults = data.category[0].records.total;
            }
            
            return res.json({
                success: hasResults,
                status: response.status,
                query: testQuery,
                resultsFound: totalResults,
                version: 'v3',
                responseStructure: {
                    hasCategory: !!data?.category,
                    hasArticles: hasArticles,
                    hasWorks: hasWorks,
                    topLevelKeys: Object.keys(data || {})
                }
            });
        } else {
            return res.status(response.status).json({
                success: false,
                error: `Status: ${response.status}`,
                version: 'v3'
            });
        }
        
    } catch (error) {
        console.error('❌ Direct test failed:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            version: 'v3'
        });
    }
});

// Error handler
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server
// Export for Vercel
module.exports = app;

// Only start server when running locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📋 Test server: http://localhost:${PORT}`);
        console.log(`🔑 Test API key: http://localhost:${PORT}/api/test-key`);
        console.log(`🔍 Search endpoint: http://localhost:${PORT}/api/trove`);
        console.log(`🆕 Now using Trove API v3 with 'category' instead of 'zone'\n`);
        
        if (!TROVE_API_KEY) {
            console.log('⚠️  WARNING: TROVE_API_KEY not found in .env file!');
        } else {
            console.log('✅ API key loaded successfully');
        }
    });
}
