// cmsApiDebugService.js - Debug CMS API Issues
export class CMSApiDebugService {
    constructor() {
        this.baseUrls = [
            'https://data.cms.gov/provider-data/api/1/datastore/query',
            'https://data.cms.gov/provider-data/api/1/datastore/sql',
            'https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items'
        ];
    }

    async testCMSConnection() {
        console.group('🔧 Testing CMS API Connection');

        const tests = [];

        // Test 1: Basic connectivity
        try {
            const response = await fetch('https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items');
            tests.push({
                test: 'Basic Connectivity',
                status: response.status,
                ok: response.ok,
                url: 'https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items'
            });
        } catch (error) {
            tests.push({
                test: 'Basic Connectivity',
                error: error.message,
                url: 'https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items'
            });
        }

        // Test 2: Dataset metadata
        try {
            const response = await fetch('https://data.cms.gov/provider-data/api/1/datastore/query/doctors-and-clinicians-national-downloadable-file?limit=1');
            tests.push({
                test: 'Dataset Query',
                status: response.status,
                ok: response.ok,
                url: 'doctors-and-clinicians-national-downloadable-file'
            });
        } catch (error) {
            tests.push({
                test: 'Dataset Query',
                error: error.message,
                url: 'doctors-and-clinicians-national-downloadable-file'
            });
        }

        console.log('CMS API Test Results:', tests);
        console.groupEnd();

        return tests;
    }

    async getAvailableDatasets() {
        try {
            const response = await fetch('https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items');
            const datasets = await response.json();

            console.log('📊 Available CMS Datasets:');
            datasets.forEach(ds => {
                console.log(`- ${ds.title} (${ds.identifier})`);
            });

            return datasets;
        } catch (error) {
            console.error('Failed to fetch datasets:', error);
            return [];
        }
    }
}