import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Use Gemini AI to calculate match percentage based on doctor's specialty and patient symptoms
 * @param {string} specialty - Doctor's specialty
 * @param {string} symptoms - Patient symptoms
 * @param {number} age - Patient age
 * @returns {Promise<number>} Match percentage (0-100)
 */
export async function calculateMatchPercentageWithAI(specialty, symptoms, age) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️ GEMINI_API_KEY not set, using fallback match percentage');
            return getFallbackMatchPercentage(specialty, symptoms, age);
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a medical matching assistant. Calculate how well a doctor's specialty matches a patient's symptoms.

Doctor's Specialty: ${specialty || 'General Practice'}
Patient Symptoms: ${symptoms || 'Not specified'}
Patient Age: ${age || 'Not specified'}

Rate the match on a scale of 0-100 where:
- 90-100: Excellent match - specialty directly addresses the symptoms
- 80-89: Very good match - specialty is highly relevant
- 70-79: Good match - specialty is relevant but not ideal
- 60-69: Moderate match - specialty can help but not specialized
- 50-59: Fair match - specialty is somewhat related
- 0-49: Poor match - specialty is not relevant

Consider:
- How directly the specialty addresses the symptoms
- Age-appropriateness (e.g., pediatrics for children)
- Specialty relevance to the condition

Return ONLY a number between 0-100 (no text, no explanation, just the number).`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Extract number from response
        const match = responseText.match(/\d+/);
        if (match) {
            const percentage = parseInt(match[0]);
            // Ensure it's between 0-100
            const validPercentage = Math.min(100, Math.max(0, percentage));
            console.log(`✅ Gemini calculated match: ${specialty} vs "${symptoms}" = ${validPercentage}%`);
            return validPercentage;
        }

        console.warn('⚠️ Could not parse Gemini match percentage, using fallback');
        return getFallbackMatchPercentage(specialty, symptoms, age);

    } catch (error) {
        console.error('❌ Error calculating match percentage with Gemini:', error.message);
        return getFallbackMatchPercentage(specialty, symptoms, age);
    }
}

/**
 * Fallback match percentage calculation (used when Gemini API fails)
 */
function getFallbackMatchPercentage(specialty, symptoms, age) {
    let score = 80; // Base score - all doctors passed filtering
    
    const symptomsLower = (symptoms || '').toLowerCase();
    const specialtyUpper = (specialty || '').toUpperCase();
    const ageNum = parseInt(age) || 0;

    // Specialty-specific matching
    if (specialtyUpper && specialtyUpper.length > 0) {
        score += 5;
    }

    // Symptom-specialty matching
    if (symptomsLower.includes('throat') || symptomsLower.includes('ear') || symptomsLower.includes('nose')) {
        if (specialtyUpper.includes('OTOLARYNGOLOGY') || specialtyUpper.includes('ENT')) score += 15;
    }
    
    if (symptomsLower.includes('chest') || symptomsLower.includes('heart') || symptomsLower.includes('cardiac')) {
        if (specialtyUpper.includes('CARDIOLOGY')) score += 15;
    }
    
    if (symptomsLower.includes('skin') || symptomsLower.includes('rash') || symptomsLower.includes('dermatitis')) {
        if (specialtyUpper.includes('DERMATOLOGY')) score += 15;
    }
    
    if (symptomsLower.includes('bone') || symptomsLower.includes('joint') || symptomsLower.includes('fracture') || symptomsLower.includes('orthopedic')) {
        if (specialtyUpper.includes('ORTHOPEDIC')) score += 15;
    }
    
    if (symptomsLower.includes('headache') || symptomsLower.includes('neurological') || symptomsLower.includes('seizure')) {
        if (specialtyUpper.includes('NEUROLOGY')) score += 15;
    }
    
    if (symptomsLower.includes('mental') || symptomsLower.includes('depression') || symptomsLower.includes('anxiety')) {
        if (specialtyUpper.includes('PSYCHIATRY')) score += 15;
    }
    
    if (symptomsLower.includes('breathing') || symptomsLower.includes('lung') || symptomsLower.includes('respiratory')) {
        if (specialtyUpper.includes('PULMONOLOGY')) score += 15;
    }
    
    if (symptomsLower.includes('stomach') || symptomsLower.includes('digestive') || symptomsLower.includes('gastro')) {
        if (specialtyUpper.includes('GASTROENTEROLOGY')) score += 15;
    }

    // Age-specific matching
    if (ageNum < 18) {
        if (specialtyUpper.includes('PEDIATRICS')) score += 10;
        if (specialtyUpper.includes('FAMILY PRACTICE')) score += 5;
    }

    // Ensure result is between 80-98
    return Math.min(98, Math.max(80, score));
}

