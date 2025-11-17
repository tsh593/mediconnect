import { GoogleGenerativeAI } from '@google/generative-ai';
import { csvProcessorUltraStrict } from './csvProcessorUltraStrict.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Use Gemini to recommend the best specialty based on patient symptoms
 * Uses specialties from the CSV database
 */
export async function recommendSpecialty({ symptoms, age, gender, condition = '' }) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️ GEMINI_API_KEY not set, returning fallback');
            return getFallbackSpecialty(symptoms);
        }

        // Get available specialties from CSV
        let availableSpecialties = [];
        try {
            availableSpecialties = await csvProcessorUltraStrict.getSpecialties();
            console.log(`📋 Found ${availableSpecialties.length} specialties from CSV`);
        } catch (error) {
            console.error('❌ Error fetching specialties from CSV:', error);
            // Use fallback if CSV fails
            availableSpecialties = [
                'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'PEDIATRICS', 'CARDIOLOGY',
                'DERMATOLOGY', 'ORTHOPEDIC SURGERY', 'NEUROLOGY', 'PSYCHIATRY',
                'PULMONOLOGY', 'GASTROENTEROLOGY', 'ENDOCRINOLOGY', 'ONCOLOGY',
                'UROLOGY', 'GYNECOLOGY', 'OPHTHALMOLOGY', 'OTOLARYNGOLOGY',
                'EMERGENCY MEDICINE', 'RHEUMATOLOGY', 'NEPHROLOGY', 'ALLERGY/IMMUNOLOGY'
            ];
        }

        // Limit to first 50 specialties for prompt length
        const specialtyList = availableSpecialties.slice(0, 50).join(', ');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a medical triage assistant. Based on the patient's symptoms, recommend the most appropriate medical specialty from our database.
        
Patient Information:
- Symptoms: ${symptoms}
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Known Condition: ${condition || 'None'}

AVAILABLE SPECIALTIES (from our database - MUST choose from this list):
${specialtyList}

Return a JSON response with exactly these fields (no extra text):
{
  "recommendedSpecialty": "SPECIALTY_NAME_IN_CAPS",
  "alternativeSpecialties": ["SPECIALTY_2", "SPECIALTY_3"],
  "confidence": 0.0-1.0,
  "rationale": "Brief explanation of why this specialty is recommended"
}

IMPORTANT: The "recommendedSpecialty" MUST match exactly one of the specialties from the list above (case-insensitive match). If the exact specialty is not in the list, choose the closest match from the available specialties.

Output ONLY valid JSON, no other text.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON from response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Failed to parse Gemini response:', responseText);
            return getFallbackSpecialty(symptoms);
        }

        console.log('✅ Gemini specialty recommendation:', {
            specialty: parsedResponse.recommendedSpecialty,
            confidence: parsedResponse.confidence,
            rationale: parsedResponse.rationale
        });

        return {
            success: true,
            recommendedSpecialty: parsedResponse.recommendedSpecialty,
            alternativeSpecialties: parsedResponse.alternativeSpecialties || [],
            confidence: parsedResponse.confidence || 0.5,
            rationale: parsedResponse.rationale || 'AI-recommended specialty based on symptoms.',
            usedAI: true
        };
    } catch (error) {
        console.error('❌ Error in recommendSpecialty:', error.message);
        return getFallbackSpecialty(symptoms);
    }
}

/**
 * Fallback specialty recommendation based on keyword matching
 */
function getFallbackSpecialty(symptoms) {
    const symptomsLower = (symptoms || '').toLowerCase();
    
    const specialtyMap = {
        'CARDIOLOGY': ['chest pain', 'heart', 'palpitation', 'arrhythmia', 'hypertension', 'blood pressure'],
        'NEUROLOGY': ['headache', 'migraine', 'seizure', 'tremor', 'dizziness', 'brain', 'neurological'],
        'GASTROENTEROLOGY': ['stomach', 'abdominal', 'nausea', 'vomit', 'diarrhea', 'acid reflux', 'ulcer', 'ibd'],
        'ORTHOPEDICS': ['bone', 'fracture', 'joint', 'knee', 'back', 'shoulder', 'sprain', 'arthritis'],
        'DERMATOLOGY': ['skin', 'rash', 'acne', 'eczema', 'psoriasis', 'mole', 'wart'],
        'PULMONOLOGY': ['cough', 'asthma', 'breath', 'respiratory', 'lung', 'pneumonia', 'copd'],
        'RHEUMATOLOGY': ['joint', 'arthritis', 'autoimmune', 'lupus', 'rheumatoid'],
        'ENDOCRINOLOGY': ['diabetes', 'thyroid', 'hormone', 'metabolic'],
        'UROLOGY': ['bladder', 'kidney', 'urinary', 'prostate'],
        'PSYCHIATRY': ['depression', 'anxiety', 'mental', 'stress', 'bipolar'],
        'PEDIATRICS': ['child', 'infant', 'baby', 'pediatric'],
        'EMERGENCY MEDICINE': ['emergency', 'acute', 'severe', 'trauma', 'urgent']
    };

    let recommendedSpecialty = 'FAMILY MEDICINE';
    let maxMatches = 0;

    for (const [specialty, keywords] of Object.entries(specialtyMap)) {
        const matches = keywords.filter(kw => symptomsLower.includes(kw)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            recommendedSpecialty = specialty;
        }
    }

    return {
        success: true,
        recommendedSpecialty,
        alternativeSpecialties: ['FAMILY MEDICINE', 'INTERNAL MEDICINE'],
        confidence: maxMatches > 0 ? Math.min(0.8, 0.3 + maxMatches * 0.1) : 0.3,
        rationale: 'Fallback recommendation based on symptom keywords.',
        usedAI: false
    };
}
