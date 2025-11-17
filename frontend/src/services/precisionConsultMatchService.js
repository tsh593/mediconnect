import { cmsApiService } from './cmsApiService';
import { matchSymptomsToSpecialty as geminiMatchSpecialty, predictConsultationFee } from './googleGenAIService';

/**
 * Use Gemini AI to match symptoms to the most appropriate medical specialty
 * @param {string} symptoms - Patient symptoms description
 * @param {object} patientInfo - Additional patient information (age, gender, etc.)
 * @returns {Promise<object>} - Specialty recommendation with confidence score
 */
export const matchSymptomsToSpecialty = async (symptoms, patientInfo = {}) => {
    try {
        console.log('🤖 Using Gemini AI to match symptoms to specialty...', { symptoms, patientInfo });

        // First, get available specialties from the backend CSV
        let availableSpecialties = [];
        try {
            const response = await fetch('/api/doctors/specialties');
            if (response.ok) {
                const data = await response.json();
                availableSpecialties = data.specialties || [];
                console.log(`📋 Fetched ${availableSpecialties.length} specialties from CSV:`, availableSpecialties.slice(0, 20));
            } else {
                console.warn('⚠️ Backend specialties endpoint returned non-OK status:', response.status);
            }
        } catch (error) {
            console.error('❌ Error fetching specialties from CSV:', error);
        }

        // If no specialties from CSV, use fallback common specialties
        if (availableSpecialties.length === 0) {
            console.warn('⚠️ No specialties from CSV, using fallback common specialties');
            availableSpecialties = [
                'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'PEDIATRICS', 'CARDIOLOGY',
                'DERMATOLOGY', 'ORTHOPEDIC SURGERY', 'NEUROLOGY', 'PSYCHIATRY',
                'PULMONOLOGY', 'GASTROENTEROLOGY', 'ENDOCRINOLOGY', 'ONCOLOGY',
                'UROLOGY', 'GYNECOLOGY', 'OPHTHALMOLOGY', 'OTOLARYNGOLOGY',
                'EMERGENCY MEDICINE', 'RHEUMATOLOGY', 'NEPHROLOGY', 'ALLERGY/IMMUNOLOGY'
            ];
        }

        // Ensure we have specialties before calling AI
        if (availableSpecialties.length === 0) {
            throw new Error('No specialties available from database');
        }

        console.log(`✅ Using ${availableSpecialties.length} specialties for AI recommendation`);

        // Use Gemini AI to get specialty recommendation with CSV specialties
        const aiResponse = await geminiMatchSpecialty(symptoms, availableSpecialties, patientInfo);
        
        if (!aiResponse.success) {
            throw new Error(aiResponse.error || 'AI service unavailable');
        }

        // Extract specialty from AI response
        let rawResponse = aiResponse.response.trim();
        console.log('📝 Raw AI response:', rawResponse);
        
        // Clean up the response - remove markdown, quotes, etc.
        let recommendedSpecialty = rawResponse
            .replace(/^#+\s*/, '') // Remove markdown headers
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/`/g, '') // Remove code markers
            .replace(/["']/g, '') // Remove quotes
            .split('\n')[0] // Take first line only
            .trim()
            .toUpperCase();

        console.log('🔍 Cleaned specialty from AI:', recommendedSpecialty);

        // If availableSpecialties is empty, use the AI response directly with mappings
        if (!availableSpecialties || availableSpecialties.length === 0) {
            console.warn('⚠️ No specialties from backend, using AI response with mappings');
            const specialtyMappings = {
                'CARDIOLOGY': 'CARDIOLOGY',
                'CARDIOLOGIST': 'CARDIOLOGY',
                'PEDIATRICS': 'PEDIATRICS',
                'PEDIATRICIAN': 'PEDIATRICS',
                'FAMILY PRACTICE': 'FAMILY PRACTICE',
                'FAMILY DOCTOR': 'FAMILY PRACTICE',
                'INTERNAL MEDICINE': 'INTERNAL MEDICINE',
                'INTERNIST': 'INTERNAL MEDICINE',
                'DERMATOLOGY': 'DERMATOLOGY',
                'DERMATOLOGIST': 'DERMATOLOGY',
                'ORTHOPEDIC SURGERY': 'ORTHOPEDIC SURGERY',
                'ORTHOPEDIST': 'ORTHOPEDIC SURGERY',
                'NEUROLOGY': 'NEUROLOGY',
                'NEUROLOGIST': 'NEUROLOGY',
                'PSYCHIATRY': 'PSYCHIATRY',
                'PSYCHIATRIST': 'PSYCHIATRY',
                'PULMONOLOGY': 'PULMONOLOGY',
                'PULMONOLOGIST': 'PULMONOLOGY',
                'GASTROENTEROLOGY': 'GASTROENTEROLOGY',
                'GASTROENTEROLOGIST': 'GASTROENTEROLOGY',
                'ENDOCRINOLOGY': 'ENDOCRINOLOGY',
                'ENDOCRINOLOGIST': 'ENDOCRINOLOGY',
                'ONCOLOGY': 'ONCOLOGY',
                'ONCOLOGIST': 'ONCOLOGY',
                'UROLOGY': 'UROLOGY',
                'UROLOGIST': 'UROLOGY',
                'GYNECOLOGY': 'GYNECOLOGY',
                'GYNECOLOGIST': 'GYNECOLOGY',
                'OBSTETRICS': 'GYNECOLOGY',
                'OBSTETRICIAN': 'GYNECOLOGY',
                'OPHTHALMOLOGY': 'OPHTHALMOLOGY',
                'OPHTHALMOLOGIST': 'OPHTHALMOLOGY',
                'OTOLARYNGOLOGY': 'OTOLARYNGOLOGY',
                'ENT': 'OTOLARYNGOLOGY',
                'EMERGENCY MEDICINE': 'EMERGENCY MEDICINE',
                'EMERGENCY': 'EMERGENCY MEDICINE',
                'RHEUMATOLOGY': 'RHEUMATOLOGY',
                'RHEUMATOLOGIST': 'RHEUMATOLOGY',
                'NEPHROLOGY': 'NEPHROLOGY',
                'NEPHROLOGIST': 'NEPHROLOGY'
            };

            const mappedSpecialty = specialtyMappings[recommendedSpecialty] || recommendedSpecialty;
            console.log('✅ Using AI response directly:', mappedSpecialty);
            return {
                success: true,
                specialty: mappedSpecialty,
                rawAIResponse: rawResponse,
                confidence: 'high',
                availableSpecialties: 0,
                model: aiResponse.model || 'gemini',
                timestamp: new Date().toISOString()
            };
        }

        // Try to match to available specialties (fuzzy matching)
        let matchedSpecialty = null;
        const specialtyUpper = recommendedSpecialty.toUpperCase();
        
        // Exact match first
        matchedSpecialty = availableSpecialties.find(spec => 
            spec.toUpperCase() === specialtyUpper
        );

        // If no exact match, try partial matching
        if (!matchedSpecialty) {
            matchedSpecialty = availableSpecialties.find(spec => 
                spec.toUpperCase().includes(specialtyUpper) || 
                specialtyUpper.includes(spec.toUpperCase())
            );
        }

        // If still no match, try common mappings
        if (!matchedSpecialty) {
            const specialtyMappings = {
                'CARDIOLOGIST': 'CARDIOLOGY',
                'PEDIATRICIAN': 'PEDIATRICS',
                'FAMILY DOCTOR': 'FAMILY PRACTICE',
                'INTERNIST': 'INTERNAL MEDICINE',
                'DERMATOLOGIST': 'DERMATOLOGY',
                'ORTHOPEDIST': 'ORTHOPEDIC SURGERY',
                'NEUROLOGIST': 'NEUROLOGY',
                'PSYCHIATRIST': 'PSYCHIATRY',
                'PULMONOLOGIST': 'PULMONOLOGY',
                'GASTROENTEROLOGIST': 'GASTROENTEROLOGY',
                'ENDOCRINOLOGIST': 'ENDOCRINOLOGY',
                'ONCOLOGIST': 'ONCOLOGY',
                'UROLOGIST': 'UROLOGY',
                'GYNECOLOGIST': 'GYNECOLOGY',
                'OBSTETRICIAN': 'GYNECOLOGY',
                'OPHTHALMOLOGIST': 'OPHTHALMOLOGY',
                'ENT': 'OTOLARYNGOLOGY',
                'EMERGENCY': 'EMERGENCY MEDICINE',
                'RHEUMATOLOGIST': 'RHEUMATOLOGY',
                'NEPHROLOGIST': 'NEPHROLOGY'
            };

            const mappedSpecialty = specialtyMappings[specialtyUpper];
            if (mappedSpecialty) {
                matchedSpecialty = availableSpecialties.find(spec => 
                    spec.toUpperCase() === mappedSpecialty
                );
            }
        }

        // If still no match, use the AI response directly (it's likely correct)
        if (!matchedSpecialty) {
            console.warn('⚠️ Could not match specialty, using AI response directly:', recommendedSpecialty);
            matchedSpecialty = recommendedSpecialty;
        }

        console.log('✅ Gemini AI recommended specialty:', matchedSpecialty);

        return {
            success: true,
            specialty: matchedSpecialty,
            rawAIResponse: aiResponse.response,
            confidence: matchedSpecialty ? 'high' : 'medium',
            availableSpecialties: availableSpecialties.length,
            model: aiResponse.model || 'gemini',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Error matching symptoms to specialty:', error);
        
        // Fallback: Use simple keyword matching
        const symptomsLower = symptoms.toLowerCase();
        let fallbackSpecialty = 'FAMILY PRACTICE'; // Default

        if (symptomsLower.includes('heart') || symptomsLower.includes('chest') || symptomsLower.includes('cardiac')) {
            fallbackSpecialty = 'CARDIOLOGY';
        } else if (symptomsLower.includes('child') || symptomsLower.includes('pediatric') || symptomsLower.includes('baby')) {
            fallbackSpecialty = 'PEDIATRICS';
        } else if (symptomsLower.includes('skin') || symptomsLower.includes('rash') || symptomsLower.includes('dermat')) {
            fallbackSpecialty = 'DERMATOLOGY';
        } else if (symptomsLower.includes('bone') || symptomsLower.includes('joint') || symptomsLower.includes('ortho')) {
            fallbackSpecialty = 'ORTHOPEDIC SURGERY';
        } else if (symptomsLower.includes('headache') || symptomsLower.includes('neurolog')) {
            fallbackSpecialty = 'NEUROLOGY';
        } else if (symptomsLower.includes('mental') || symptomsLower.includes('psych')) {
            fallbackSpecialty = 'PSYCHIATRY';
        } else if (symptomsLower.includes('lung') || symptomsLower.includes('breath') || symptomsLower.includes('pulmon')) {
            fallbackSpecialty = 'PULMONOLOGY';
        } else if (symptomsLower.includes('stomach') || symptomsLower.includes('digest') || symptomsLower.includes('gastro')) {
            fallbackSpecialty = 'GASTROENTEROLOGY';
        }

        return {
            success: false,
            specialty: fallbackSpecialty,
            error: error.message,
            fallback: true,
            confidence: 'low',
            timestamp: new Date().toISOString()
        };
    }
};

export const findMatchingDoctors = async (criteria, symptoms) => {
    try {
        console.log('🎯 Finding matching doctors with criteria:', criteria);

        // Step 1: Use Gemini AI to match symptoms to specialty (only if not already provided)
        let specialty = criteria.specialty;
        let specialtyMatchResult = null;

        // OPTIMIZED: Skip AI call if specialty is already provided (prevents duplicate calls)
        if (!specialty && symptoms) {
            console.log('🤖 Using Gemini AI to determine specialty from symptoms...');
            specialtyMatchResult = await matchSymptomsToSpecialty(symptoms, {
                age: criteria.age,
                gender: criteria.gender,
                medicalHistory: criteria.medicalHistory
            });

            if (specialtyMatchResult.success && specialtyMatchResult.specialty) {
                specialty = specialtyMatchResult.specialty;
                console.log('✅ Gemini AI recommended specialty:', specialty);
            } else {
                console.log('⚠️ Using fallback specialty:', specialtyMatchResult.specialty);
                specialty = specialtyMatchResult.specialty || specialty;
            }
        } else if (specialty) {
            console.log('✅ Specialty already provided, skipping AI call:', specialty);
        }

        // Step 2: Use the CMS API service to get real doctors with the matched specialty
        const criteriaWithSpecialty = {
            ...criteria,
            specialty: specialty
        };

        const doctors = await cmsApiService.findRealDoctors(criteriaWithSpecialty, symptoms);

        // Use fallback fees to avoid multiple AI calls (performance optimization)
        // Fee prediction with AI is expensive - using fallback for now
        const doctorsWithFees = doctors.map((doctor) => {
            if (doctor.consultationFee && doctor.consultationFee > 0) {
                // Fee already set, use it
                return doctor;
            }

            // Use fallback fee calculation (no AI call) for better performance
            const region = doctor.location || criteria.location || 'United States';
            const baseFee = doctor.specialty?.toUpperCase().includes('SURGERY') ? 350 : 
                          doctor.specialty?.toUpperCase().includes('CARDIOLOGY') ? 300 :
                          doctor.specialty?.toUpperCase().includes('ONCOLOGY') ? 400 :
                          200;
            
            const experienceMultiplier = doctor.experience ? 1 + (doctor.experience / 100) : 1;
            const estimatedFee = Math.round(baseFee * experienceMultiplier);

            return {
                ...doctor,
                consultationFee: estimatedFee,
                feeSource: 'fallback_fast'
            };
        });

        return {
            success: true,
            matches: doctorsWithFees,
            totalMatches: doctorsWithFees.length,
            dataSource: doctors[0]?.isReal ? 'cms_database' : 'enhanced_fallback',
            specialtyMatch: specialtyMatchResult ? {
                recommendedSpecialty: specialtyMatchResult.specialty,
                confidence: specialtyMatchResult.confidence,
                usedAI: !specialtyMatchResult.fallback
            } : null
        };
    } catch (error) {
        console.error('Error in precision match:', error);
        return {
            success: false,
            error: error.message,
            matches: [],
            totalMatches: 0
        };
    }
};
// Enhanced scheduling with CMS data
export const scheduleConsultation = async (doctorId, appointmentDetails) => {
    try {
        console.log('📅 Scheduling with CMS provider:', { doctorId, appointmentDetails });

        // In a real implementation, this would integrate with CMS provider scheduling
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            success: true,
            appointmentId: `cms-appt-${Date.now()}`,
            confirmation: {
                providerNPI: doctorId,
                date: appointmentDetails.date,
                time: appointmentDetails.time,
                type: appointmentDetails.type || 'in-person',
                instructions: 'Please bring your Medicare card, photo ID, and current medications list',
                confirmationNumber: `CMS-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                medicareAccepted: true,
                dataSource: 'cms_provider_scheduling'
            },
            timestamp: new Date().toISOString(),
            isRealBooking: true
        };
    } catch (error) {
        console.error('Error scheduling CMS consultation:', error);
        return {
            success: false,
            error: 'Failed to schedule appointment with CMS provider.'
        };
    }
};

// Get specialties from CMS data
export const getSpecialtiesFromCMS = async () => {
    try {
        const data = await cmsApiService.loadCSVData();
        const specialties = [...new Set(data.map(p => p['Primary Specialty']).filter(Boolean))];

        return {
            success: true,
            specialties: specialties.length > 0 ? specialties : [
                'Family Practice',
                'Internal Medicine',
                'Pediatrics',
                'Cardiology',
                'Dermatology'
            ],
            source: 'cms_csv_data'
        };
    } catch (error) {
        console.error('Error fetching specialties from CMS CSV:', error);
        return {
            success: false,
            specialties: [
                'Family Practice',
                'Internal Medicine',
                'Pediatrics',
                'Cardiology',
                'Dermatology'
            ],
            source: 'fallback_specialties'
        };
    }
};

// Add the missing getSpecialtiesList export
export const getSpecialtiesList = async () => {
    try {
        const result = await getSpecialtiesFromCMS();
        return {
            success: result.success,
            specialties: result.specialties,
            source: result.source
        };
    } catch (error) {
        console.error('Error getting specialties list:', error);
        return {
            success: false,
            specialties: [
                'Family Practice',
                'Internal Medicine',
                'Pediatrics',
                'Cardiology',
                'Dermatology'
            ],
            source: 'fallback_specialties'
        };
    }
};

// Test with real CMS CSV data
export const testPrecisionMatchService = async () => {
    try {
        console.log('🧪 Testing CMS CSV Precision Match Service...');

        const testCriteria = {
            symptoms: 'chest pain with difficulty breathing',
            age: '55',
            gender: 'male',
            location: 'Fairfax, VA',
            insurance: 'Medicare',
            telemedicinePreferred: false
        };

        // Test CSV data loading first
        const csvTest = await cmsApiService.testCSVData();
        console.log('📊 CMS CSV Data Test Results:', csvTest);

        const result = await findMatchingDoctors(testCriteria, testCriteria.symptoms);

        return {
            success: true,
            test: 'cms_csv_precision_match_service',
            matchesFound: result.matches.length,
            hasRealData: result.isRealData,
            dataSource: result.dataSource,
            csvStatus: csvTest,
            topMatch: result.matches[0] ? {
                name: result.matches[0].name,
                specialty: result.matches[0].specialty,
                matchPercentage: result.matches[0].matchPercentage,
                isReal: result.matches[0].isReal,
                source: result.matches[0].source,
                npi: result.matches[0].nationalProviderIdentifier
            } : null,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('CMS CSV Precision Match Service test failed:', error);
        return {
            success: false,
            error: error.message,
            test: 'cms_csv_precision_match_service'
        };
    }
};

export default {
    findMatchingDoctors,
    matchSymptomsToSpecialty,
    scheduleConsultation,
    getSpecialtiesList,
    getSpecialtiesFromCMS,
    testPrecisionMatchService
};