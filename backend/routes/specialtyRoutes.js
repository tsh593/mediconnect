import express from 'express';
import { recommendSpecialty } from '../services/specialtyRecommender.js';

const router = express.Router();

/**
 * POST /api/specialty/recommend
 * Get recommended specialty based on symptoms using Gemini AI
 */
router.post('/api/specialty/recommend', async (req, res) => {
    try {
        const { symptoms, age, gender, condition } = req.body;

        if (!symptoms || !symptoms.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Symptoms are required'
            });
        }

        console.log('🤖 Recommending specialty for symptoms:', symptoms);

        const recommendation = await recommendSpecialty({
            symptoms,
            age: age || null,
            gender: gender || null,
            condition: condition || ''
        });

        res.json(recommendation);
    } catch (error) {
        console.error('❌ Error in specialty recommendation:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            recommendedSpecialty: 'FAMILY MEDICINE'
        });
    }
});

export default router;
