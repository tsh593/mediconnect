// server/proxy-server.js - UPDATED WITH BETTER ERROR HANDLING
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path}`, {
        query: req.query,
        body: req.body
    });
    next();
});

// Proxy endpoint for CMS API
app.get('/api/cms/*', async (req, res) => {
    try {
        const originalUrl = req.originalUrl.replace('/api/cms', '');
        const cmsUrl = `https://data.cms.gov${originalUrl}`;

        console.log(`📡 Proxying GET to: ${cmsUrl}`);

        const response = await fetch(cmsUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'MediConnect-Proxy/1.0'
            }
        });

        console.log(`📥 Response Status: ${response.status} ${response.statusText}`);

        const contentType = response.headers.get('content-type');

        // Handle non-JSON responses
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`❌ CMS API returned non-JSON: ${contentType}`);
            console.error(`📄 Response preview: ${text.substring(0, 500)}`);

            return res.status(response.status).json({
                error: `CMS API returned non-JSON response: ${contentType}`,
                status: response.status,
                contentType: contentType,
                responsePreview: text.substring(0, 500)
            });
        }

        const data = await response.json();

        if (!response.ok) {
            console.log(`❌ CMS API Error: ${response.status}`, data);
            return res.status(response.status).json({
                error: `CMS API responded with status: ${response.status}`,
                details: data,
                originalUrl: cmsUrl
            });
        }

        console.log(`✅ Successfully proxied GET request, returned ${Object.keys(data).length} keys`);
        res.json(data);

    } catch (error) {
        console.error('❌ CMS Proxy GET Error:', error);
        res.status(500).json({
            error: 'Failed to fetch from CMS API',
            message: error.message,
            url: req.originalUrl
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'CMS Proxy Server',
        timestamp: new Date().toISOString()
    });
});

// Test CMS API directly with better error handling
app.get('/api/test-cms-direct', async (req, res) => {
    try {
        const testUrls = [
            'https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/mj5m-pz16',
            'https://data.cms.gov/provider-data/api/1/datastore/sql?query=[SELECT%20%22National%20Provider%20Identifier%22%20FROM%20mj5m-pz16][LIMIT%201]'
        ];

        const results = [];

        for (const url of testUrls) {
            try {
                console.log(`🧪 Testing: ${url}`);
                const response = await fetch(url);
                const contentType = response.headers.get('content-type');
                let data;

                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }

                results.push({
                    url: url,
                    status: response.status,
                    ok: response.ok,
                    contentType: contentType,
                    data: data
                });

            } catch (error) {
                results.push({
                    url: url,
                    status: 'error',
                    ok: false,
                    error: error.message
                });
            }
        }

        res.json({
            service: 'CMS Direct Test',
            timestamp: new Date().toISOString(),
            results: results
        });

    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 CMS Proxy server running on http://localhost:${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test CMS Direct: http://localhost:${PORT}/api/test-cms-direct`);
});