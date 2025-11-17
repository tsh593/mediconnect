import freeMapsService from './freeMapsService';

export class CMSApiService {
    constructor() {
        this.backendUrl = '/api';
        this.useBackend = true;
    }

    async findRealDoctors(criteria, symptoms) {
        if (!this.useBackend) {
            console.log('🔄 Using frontend fallback (backend disabled)');
            return this.getEnhancedFallbackWithRealNames(criteria, symptoms);
        }

        try {
            console.log('🏥 Finding doctors from backend...', { criteria, symptoms });

            const params = new URLSearchParams();

            // IMPROVED: Better location handling
            if (criteria.location) {
                // Keep the full location for better matching
                params.append('location', criteria.location);
            }

            if (criteria.specialty) params.append('specialty', criteria.specialty);
            if (symptoms) params.append('symptoms', symptoms);
            if (criteria.age) params.append('age', criteria.age);
            params.append('limit', '10');

            const backendUrl = `${this.backendUrl}/doctors/search?${params}`;
            console.log('🔗 Backend URL:', backendUrl);

            const response = await fetch(backendUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000 // 10 second timeout
            });

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Backend returned non-JSON response:', text.substring(0, 200));
                throw new Error('Backend returned invalid response format');
            }

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📊 Backend result:', result);

            if (result.success && result.matches && result.matches.length > 0) {
                console.log(`✅ Backend found ${result.matches.length} real doctors`);
                return result.matches;
            } else {
                console.log('🔄 Backend returned 0 results, using enhanced fallback');
                const fallbackDoctors = this.getEnhancedFallbackWithRealNames(criteria, symptoms);
                return fallbackDoctors.map(doctor => ({
                    ...doctor,
                    isReal: false,
                    source: 'enhanced_fallback_after_empty_backend'
                }));
            }

        } catch (error) {
            console.error('Error fetching from backend:', error);
            console.log('🔄 Falling back to enhanced providers');
            return this.getEnhancedFallbackWithRealNames(criteria, symptoms);
        }
    }

    getEnhancedFallbackWithRealNames(criteria, symptoms) {
        console.log('🔄 Using enhanced fallback with realistic data');
        console.log('⚠️ WARNING: Backend returned no results. Using fallback doctors as last resort.');

        const symptomsLower = (symptoms || '').toLowerCase();
        const age = parseInt(criteria.age) || 0;
        const isChild = age > 0 && age < 18;
        const isAdult = age >= 18;

        // Determine appropriate doctors based on symptoms and age
        let appropriateProviders = [];

        // FOR CHEST PAIN / HEART ISSUES
        if (symptomsLower.includes('chest') || symptomsLower.includes('heart') || symptomsLower.includes('cardiac')) {
            if (isAdult) {
                appropriateProviders.push({
                    id: "fallback-cardio-001",
                    name: "Dr. James Mitchell, MD",
                    specialty: "Cardiology",
                    subSpecialty: "Cardiovascular Disease",
                    hospital: "Fairfax Heart Center",
                    location: criteria.location || "Fairfax, VA",
                    coordinates: { lat: 38.8462, lng: -77.3064 },
                    rating: 4.7,
                    experience: 15,
                    consultationFee: 250,
                    availability: "Within 2 days",
                    conditions: ['Chest Pain', 'Cardiac Conditions', 'Heart Disease'],
                    languages: ["English"],
                    phone: "(703) 555-0100",
                    address: "456 Heart Way, " + (criteria.location || "Fairfax, VA"),
                    matchPercentage: 92,
                    distance: { distance: 1.5, unit: 'km', text: '1.50 km' },
                    travelTime: { minutes: 6, text: '6 min' },
                    scoringFactors: [
                        "Board Certified Cardiologist",
                        "15 years of experience",
                        "Specializes in cardiac conditions",
                        "Emergency consultations available"
                    ],
                    isReal: false,
                    source: "Enhanced Fallback - Cardiac",
                    verificationStatus: "Fallback Provider"
                });
            }
            
            // Also add family practice for adults with chest pain (can be initial consultation)
            if (isAdult) {
                appropriateProviders.push({
                    id: "fallback-fp-cardio-001",
                    name: "Dr. Patricia Williams, MD",
                    specialty: "Family Practice",
                    subSpecialty: "Primary Care",
                    hospital: "Fairfax Family Medical",
                    location: criteria.location || "Fairfax, VA",
                    coordinates: { lat: 38.8500, lng: -77.3100 },
                    rating: 4.6,
                    experience: 10,
                    consultationFee: 180,
                    availability: "Next day",
                    conditions: ['Chest Pain Evaluation', 'Cardiac Screening'],
                    languages: ["English", "Spanish"],
                    phone: "(703) 555-0111",
                    address: "789 Medical Drive, " + (criteria.location || "Fairfax, VA"),
                    matchPercentage: 85,
                    distance: { distance: 2.0, unit: 'km', text: '2.00 km' },
                    travelTime: { minutes: 8, text: '8 min' },
                    scoringFactors: [
                        "Primary Care for cardiac evaluation",
                        "Can refer to specialists if needed",
                        "Same-day appointments available"
                    ],
                    isReal: false,
                    source: "Enhanced Fallback - Family Practice",
                    verificationStatus: "Fallback Provider"
                });
            }
        }
        // FOR DENTAL ISSUES
        else if (symptomsLower.includes('tooth') || symptomsLower.includes('dental') || symptomsLower.includes('gum')) {
            appropriateProviders.push({
                id: "fallback-dentist-001",
                name: "Dr. Sarah Chen, DDS",
                specialty: "Dentistry",
                subSpecialty: "General Dentistry",
                hospital: "Fairfax Dental Care",
                location: criteria.location || "Fairfax, VA",
                coordinates: { lat: 38.8512, lng: -77.3001 },
                rating: 4.9,
                experience: 8,
                consultationFee: 120,
                availability: "Same day available",
                conditions: ['Dental Pain', 'Toothache', 'Dental Emergencies'],
                languages: ["English", "Mandarin"],
                phone: "(703) 555-0678",
                address: "789 Smile Avenue, " + (criteria.location || "Fairfax, VA 22030"),
                matchPercentage: 95,
                distance: { distance: 0.8, unit: 'km', text: '0.80 km' },
                travelTime: { minutes: 3, text: '3 min' },
                scoringFactors: [
                    "Specializes in dental emergencies",
                    "Same-day appointments",
                    "Accepts all ages"
                ],
                isReal: false,
                source: "Enhanced Fallback - Dental",
                verificationStatus: "Fallback Provider"
            });
        }
        // FOR PEDIATRIC PATIENTS (under 18)
        else if (isChild) {
            appropriateProviders.push({
                id: "fallback-pediatric-001",
                name: "Dr. Michael Rodriguez, MD",
                specialty: "Pediatrics",
                subSpecialty: "Child Health",
                hospital: "Fairfax Children's Clinic",
                location: criteria.location || "Fairfax, VA",
                coordinates: { lat: 38.8462, lng: -77.3064 },
                rating: 4.8,
                experience: 12,
                consultationFee: 145,
                availability: "Next day",
                conditions: ['Pediatric Care', 'General Medical Conditions'],
                languages: ["English", "Spanish"],
                phone: "(703) 555-0123",
                address: "123 Medical Drive, " + (criteria.location || "Fairfax, VA 22030"),
                matchPercentage: 90,
                distance: { distance: 1.2, unit: 'km', text: '1.20 km' },
                travelTime: { minutes: 5, text: '5 min' },
                scoringFactors: [
                    "Board Certified Pediatrician",
                    "12 years of experience",
                    "Specializes in child healthcare",
                    "Same-day appointments available"
                ],
                isReal: false,
                source: "Enhanced Fallback - Pediatric",
                verificationStatus: "Fallback Provider"
            });
        }
        // DEFAULT FOR ADULTS - Family Practice or Internal Medicine
        else if (isAdult) {
            appropriateProviders.push({
                id: "fallback-fp-adult-001",
                name: "Dr. Robert Johnson, MD",
                specialty: "Internal Medicine",
                subSpecialty: "Primary Care",
                hospital: "Fairfax Medical Center",
                location: criteria.location || "Fairfax, VA",
                coordinates: { lat: 38.8480, lng: -77.3050 },
                rating: 4.6,
                experience: 14,
                consultationFee: 175,
                availability: "Within 2 days",
                conditions: ['General Medical Conditions', 'Adult Medicine'],
                languages: ["English"],
                phone: "(703) 555-0145",
                address: "321 Health Boulevard, " + (criteria.location || "Fairfax, VA"),
                matchPercentage: 75,
                distance: { distance: 1.8, unit: 'km', text: '1.80 km' },
                travelTime: { minutes: 7, text: '7 min' },
                scoringFactors: [
                    "Board Certified Internist",
                    "14 years of experience",
                    "Primary care for adults",
                    "Accepts new patients"
                ],
                isReal: false,
                source: "Enhanced Fallback - Internal Medicine",
                verificationStatus: "Fallback Provider"
            });
        }

        // If no appropriate providers found, return empty array (don't show wrong doctors)
        if (appropriateProviders.length === 0) {
            console.warn('⚠️ No appropriate fallback providers for:', { symptoms, age, criteria });
            return [];
        }

        // Filter by location if specified
        if (criteria.location) {
            const locationLower = criteria.location.toLowerCase();
            return appropriateProviders.filter(provider =>
                provider.location.toLowerCase().includes(locationLower)
            );
        }

        return appropriateProviders;
    }
    async testBackendConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            const result = await response.json();
            return {
                success: true,
                status: response.status,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

// Add this missing function
    async testCSVData() {
        try {
            // Test with a simple search to see if backend is working
            const doctors = await this.findRealDoctors({ location: 'VA' }, '');
            return {
                success: true,
                totalRecords: doctors.length,
                sampleRecords: doctors.slice(0, 3),
                dataSource: doctors[0]?.isReal ? 'cms_database' : 'enhanced_fallback'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async testBackendConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            const result = await response.json();
            return {
                success: true,
                status: response.status,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export const cmsApiService = new CMSApiService();