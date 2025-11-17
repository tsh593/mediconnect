import express from 'express';
// IMPORT THE ULTRA-STRICT CONTROLLER
import { searchDoctors, getSpecialties, getStats, testCSV } from '../controllers/doctorsControllerUltraStrict.js';

const router = express.Router();

router.get('/search', searchDoctors);
router.get('/specialties', getSpecialties);
router.get('/stats', getStats);
router.get('/test-csv', testCSV);

export default router;