import fs from 'fs';
import csv from 'csv-parser';

export class CSVProcessorSmart {
    constructor() {
        this.csvFilePath = './data/cms-doctors-clinicians.csv';
        this.doctorsCache = [];
        this.isLoaded = false;

        // HARD-CODED SYMPTOM TO SPECIALTY MAPPING
        this.symptomSpecialtyMap = {
            // THROAT/ENT SYMPTOMS
            'throat': ['PEDIATRICS', 'FAMILY PRACTICE', 'OTOLARYNGOLOGY', 'INTERNAL MEDICINE'],
            'sore throat': ['PEDIATRICS', 'FAMILY PRACTICE', 'OTOLARYNGOLOGY'],
            'strep': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE'],
            'tonsil': ['PEDIATRICS', 'OTOLARYNGOLOGY'],
            'swallow': ['PEDIATRICS', 'OTOLARYNGOLOGY', 'INTERNAL MEDICINE'],
            'hoarse': ['PEDIATRICS', 'OTOLARYNGOLOGY'],

            // EAR SYMPTOMS
            'ear': ['PEDIATRICS', 'FAMILY PRACTICE', 'OTOLARYNGOLOGY'],
            'earache': ['PEDIATRICS', 'FAMILY PRACTICE', 'OTOLARYNGOLOGY'],
            'hearing': ['PEDIATRICS', 'OTOLARYNGOLOGY'],

            // NOSE/SINUS SYMPTOMS
            'nose': ['PEDIATRICS', 'FAMILY PRACTICE', 'OTOLARYNGOLOGY'],
            'sinus': ['PEDIATRICS', 'FAMILY PRACTICE', 'OTOLARYNGOLOGY', 'INTERNAL MEDICINE'],
            'congestion': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE'],

            // FEVER/INFECTION SYMPTOMS
            'fever': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE'],
            'infection': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE'],
            'cold': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE'],
            'flu': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE'],

            // RESPIRATORY SYMPTOMS
            'cough': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'PULMONOLOGY'],
            'breath': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'PULMONOLOGY'],
            'wheeze': ['PEDIATRICS', 'FAMILY PRACTICE', 'PULMONOLOGY'],
            'asthma': ['PEDIATRICS', 'FAMILY PRACTICE', 'PULMONOLOGY'],

            // STOMACH/DIGESTIVE SYMPTOMS
            'stomach': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'GASTROENTEROLOGY'],
            'abdominal': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'GASTROENTEROLOGY'],
            'nausea': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'GASTROENTEROLOGY'],
            'vomit': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE'],
            'diarrhea': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE'],

            // SKIN SYMPTOMS
            'skin': ['PEDIATRICS', 'FAMILY PRACTICE', 'DERMATOLOGY'],
            'rash': ['PEDIATRICS', 'FAMILY PRACTICE', 'DERMATOLOGY'],
            'acne': ['PEDIATRICS', 'FAMILY PRACTICE', 'DERMATOLOGY'],
            'allergy': ['PEDIATRICS', 'FAMILY PRACTICE', 'ALLERGY/IMMUNOLOGY'],

            // HEAD/BRAIN SYMPTOMS
            'headache': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'NEUROLOGY'],
            'migraine': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'NEUROLOGY'],
            'dizziness': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'NEUROLOGY'],

            // HEART/CHEST SYMPTOMS
            'chest': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'CARDIOLOGY'],
            'heart': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'CARDIOLOGY'],
            'palpitation': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'CARDIOLOGY'],

            // BONE/JOINT SYMPTOMS
            'bone': ['PEDIATRICS', 'FAMILY PRACTICE', 'ORTHOPEDIC SURGERY'],
            'joint': ['PEDIATRICS', 'FAMILY PRACTICE', 'ORTHOPEDIC SURGERY', 'RHEUMATOLOGY'],
            'fracture': ['PEDIATRICS', 'FAMILY PRACTICE', 'ORTHOPEDIC SURGERY'],
            'sprain': ['PEDIATRICS', 'FAMILY PRACTICE', 'ORTHOPEDIC SURGERY'],

            // EYE SYMPTOMS
            'eye': ['PEDIATRICS', 'FAMILY PRACTICE', 'OPHTHALMOLOGY'],
            'vision': ['PEDIATRICS', 'FAMILY PRACTICE', 'OPHTHALMOLOGY'],

            // URINARY SYMPTOMS
            'urinary': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'UROLOGY'],
            'bladder': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'UROLOGY'],

            // MENTAL HEALTH SYMPTOMS
            'anxiety': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'PSYCHIATRY'],
            'depression': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'PSYCHIATRY'],
            'stress': ['PEDIATRICS', 'FAMILY PRACTICE', 'INTERNAL MEDICINE', 'PSYCHIATRY']
        };
    }

    async loadCSVData() {
        return new Promise((resolve, reject) => {
            const results = [];
            console.log('📁 Loading CSV data for smart filtering...');

            fs.createReadStream(this.csvFilePath)
                .pipe(csv())
                .on('data', (data) => {
                    if (data.NPI && data['Provider First Name'] && data['Provider Last Name'] && data.pri_spec) {
                        const doctor = {
                            npi: data.NPI,
                            last_name: data['Provider Last Name'],
                            first_name: data['Provider First Name'],
                            middle_name: data['Provider Middle Name'],
                            gender: data.gndr,
                            credentials: data.Cred,
                            medical_school: data.Med_sch,
                            graduation_year: parseInt(data.Grd_yr) || null,
                            primary_specialty: data.pri_spec,
                            facility_name: data['Facility Name'],
                            address_line_1: data.adr_ln_1,
                            city: data['City/Town'],
                            state: data.State,
                            zip_code: data['ZIP Code'],
                            telephone: data['Telephone Number'],
                            uniqueKey: `${data.NPI}-${data['Facility Name']}-${data['City/Town']}`
                        };
                        results.push(doctor);
                    }
                })
                .on('end', () => {
                    this.doctorsCache = results;
                    this.isLoaded = true;
                    console.log(`✅ Loaded ${this.doctorsCache.length} doctors from CSV`);

                    // Log available specialties
                    const specialties = [...new Set(this.doctorsCache.map(d => d.primary_specialty))].sort();
                    console.log('🎯 Available specialties in CSV:', specialties.slice(0, 10));

                    resolve(this.doctorsCache);
                })
                .on('error', reject);
        });
    }

    async searchDoctors(criteria) {
        try {
            if (!this.isLoaded) {
                await this.loadCSVData();
            }

            console.log('🔍 SMART SEARCH with criteria:', criteria);

            const { location, symptoms, age, limit = 20 } = criteria;
            const symptomsLower = (symptoms || '').toLowerCase();
            const ageNum = parseInt(age) || 0;

            // Step 1: Get relevant specialties based on symptoms
            const relevantSpecialties = this.getRelevantSpecialties(symptomsLower, ageNum);
            console.log('🎯 Relevant specialties for symptoms:', relevantSpecialties);

            // Step 2: Filter doctors by relevant specialties
            let filteredDoctors = this.doctorsCache.filter(doctor => {
                const doctorSpecialty = (doctor.primary_specialty || '').toUpperCase();
                return relevantSpecialties.some(spec =>
                    doctorSpecialty.includes(spec.toUpperCase())
                );
            });

            console.log(`📊 Found ${filteredDoctors.length} doctors with relevant specialties`);

            // Step 3: Filter by location if provided
            if (location && location.trim()) {
                const locationLower = location.toLowerCase();
                filteredDoctors = filteredDoctors.filter(doctor =>
                    (doctor.city && doctor.city.toLowerCase().includes(locationLower)) ||
                    (doctor.state && doctor.state.toLowerCase().includes(locationLower)) ||
                    (doctor.zip_code && doctor.zip_code.includes(location))
                );
                console.log(`📍 After location filter: ${filteredDoctors.length} doctors`);
            }

            // Step 4: Remove duplicates (same doctor at same location)
            const uniqueDoctors = this.removeDuplicates(filteredDoctors);
            console.log(`🔄 After removing duplicates: ${uniqueDoctors.length} unique doctors`);

            // Step 5: Sort by relevance
            const sortedDoctors = this.sortByRelevance(uniqueDoctors, symptomsLower, ageNum);

            // Step 6: Limit results
            return sortedDoctors.slice(0, limit);

        } catch (error) {
            console.error('Error in smart CSV search:', error);
            return [];
        }
    }

    // Get relevant specialties based on symptoms and age
    getRelevantSpecialties(symptomsLower, ageNum) {
        let specialties = new Set();

        // Add specialties based on symptoms
        for (const [symptom, specialtyList] of Object.entries(this.symptomSpecialtyMap)) {
            if (symptomsLower.includes(symptom)) {
                specialtyList.forEach(spec => specialties.add(spec));
            }
        }

        // If no specific symptoms found, use default primary care
        if (specialties.size === 0) {
            specialties.add('PEDIATRICS');
            specialties.add('FAMILY PRACTICE');
            specialties.add('INTERNAL MEDICINE');
        }

        // Age-based filtering
        if (ageNum > 0 && ageNum < 18) {
            // For children, prioritize pediatrics and filter out adult-only specialties
            const pediatricSpecialties = Array.from(specialties).filter(spec =>
                !['GERIATRIC MEDICINE', 'ADULT MEDICINE'].includes(spec)
            );
            if (pediatricSpecialties.length > 0) {
                specialties = new Set(pediatricSpecialties);
            }
            // Always include pediatrics for children
            specialties.add('PEDIATRICS');
        }

        return Array.from(specialties);
    }

    // Remove duplicate doctors (same NPI at same location)
    removeDuplicates(doctors) {
        const seen = new Set();
        return doctors.filter(doctor => {
            const key = doctor.uniqueKey;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // Sort doctors by relevance to symptoms and age
    sortByRelevance(doctors, symptomsLower, ageNum) {
        return doctors.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, symptomsLower, ageNum);
            const scoreB = this.calculateRelevanceScore(b, symptomsLower, ageNum);
            return scoreB - scoreA;
        });
    }

    calculateRelevanceScore(doctor, symptomsLower, ageNum) {
        let score = 0;
        const specialty = (doctor.primary_specialty || '').toUpperCase();

        // Base specialty relevance
        for (const [symptom, specialtyList] of Object.entries(this.symptomSpecialtyMap)) {
            if (symptomsLower.includes(symptom)) {
                if (specialtyList.includes(specialty)) {
                    score += 50;
                }
            }
        }

        // Age relevance
        if (ageNum > 0 && ageNum < 18) {
            if (specialty.includes('PEDIATRICS')) {
                score += 30;
            } else if (specialty.includes('FAMILY PRACTICE')) {
                score += 20;
            }
        } else if (ageNum >= 65) {
            if (specialty.includes('INTERNAL MEDICINE') || specialty.includes('GERIATRIC')) {
                score += 20;
            }
        }

        // Experience bonus
        if (doctor.graduation_year) {
            const experience = new Date().getFullYear() - doctor.graduation_year;
            score += Math.min(experience, 25);
        }

        return score;
    }

    async getSpecialties() {
        if (!this.isLoaded) {
            await this.loadCSVData();
        }
        return [...new Set(this.doctorsCache.map(d => d.primary_specialty).filter(Boolean))].sort();
    }
}

export const csvProcessorSmart = new CSVProcessorSmart();