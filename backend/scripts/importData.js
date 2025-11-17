import { CSVProcessor } from '../services/csvProcessor.js';

async function importData() {
    console.log('🚀 Starting data import...');

    const processor = new CSVProcessor();

    try {
        await processor.initDatabase;
        const result = await processor.importCSVData('./data/cms-doctors-clinicians.csv');
        console.log('✅ Data import completed:', result);
    } catch (error) {
        console.error('❌ Data import failed:', error);
    } finally {
        processor.close();
    }
}

importData();