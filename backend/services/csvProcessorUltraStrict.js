import fs from 'fs';
import csv from 'csv-parser';

export class CSVProcessorUltraStrict {
    constructor() {
        // CSV file path - relative to backend directory
        this.csvFilePath = './data/cms-doctors-clinicians.csv';
        this.doctorsCache = [];
        this.isLoaded = false;
    }

    async loadCSVData() {
        return new Promise((resolve, reject) => {
            const results = [];
            console.log('🚨 ULTRA-STRICT: Loading CSV data from:', this.csvFilePath);

            // Check if file exists first
            if (!fs.existsSync(this.csvFilePath)) {
                console.error('❌ CSV file not found at:', this.csvFilePath);
                reject(new Error(`CSV file not found: ${this.csvFilePath}`));
                return;
            }

            fs.createReadStream(this.csvFilePath)
                .pipe(csv())
                .on('data', (data) => {
                    try {
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
                                address_line_1: data.adr_ln_1 || data.Generated_Address || '', // Use generated address if original is missing
                                city: data['City/Town'],
                                state: data.State,
                                zip_code: data['ZIP Code'],
                                telephone: data['Telephone Number'],
                                generated_address: data.Generated_Address || null,
                                address_generated: data.Address_Generated === 'true' || data.Address_Generated === true,
                                uniqueKey: `${data.NPI}-${data['Facility Name']}-${data['City/Town']}`
                            };
                            results.push(doctor);
                        }
                    } catch (error) {
                        console.error('Error parsing CSV row:', error);
                    }
                })
                .on('end', () => {
                    this.doctorsCache = results;
                    this.isLoaded = true;
                    console.log(`✅ ULTRA-STRICT: Loaded ${this.doctorsCache.length} doctors from CSV`);

                    if (this.doctorsCache.length === 0) {
                        console.error('❌ No doctors loaded from CSV. Check file format and column names.');
                    } else {
                        console.log('📊 Sample doctor from CSV:', this.doctorsCache[0]);
                    }

                    resolve(this.doctorsCache);
                })
                .on('error', (error) => {
                    console.error('❌ Error reading CSV file:', error);
                    reject(error);
                });
        });
    }

    async searchDoctors(criteria) {
        try {
            if (!this.isLoaded) {
                await this.loadCSVData();
            }

            console.log('🚨 ULTRA-STRICT SEARCH:', criteria);

            const { location, symptoms, age, specialty, limit = 20 } = criteria;
            const symptomsLower = (symptoms || '').toLowerCase();
            const ageNum = parseInt(age) || 0;

            // If specialty is explicitly provided (from Gemini AI), use it directly
            let filteredDoctors = [];
            if (specialty && specialty.trim()) {
                console.log(`🎯 Using provided specialty: ${specialty}`);
                const specialtyUpper = specialty.toUpperCase();
                filteredDoctors = this.doctorsCache.filter(doctor => {
                    const doctorSpecialty = (doctor.primary_specialty || '').toUpperCase();
                    return doctorSpecialty.includes(specialtyUpper) || specialtyUpper.includes(doctorSpecialty);
                });
                console.log(`✅ Found ${filteredDoctors.length} doctors with specialty: ${specialty}`);
            } else {
                // ULTRA-STRICT FILTERING: Only return relevant specialties based on symptoms
                filteredDoctors = this.applyUltraStrictFiltering(this.doctorsCache, symptomsLower, ageNum);
            }

            console.log(`🎯 ULTRA-STRICT: After specialty filtering: ${filteredDoctors.length} doctors`);

            // IMPROVED: Better location parsing with case-insensitive matching and normalization
            // Handles both "City, State" and "City" formats consistently
            if (location && location.trim()) {
                const locationParts = location.split(',').map(part => part.trim());
                let city = locationParts[0] ? locationParts[0].toLowerCase().trim() : '';
                let state = locationParts[1] ? locationParts[1].toUpperCase().trim() : null;

                // Handle cases where state might be full name or have extra spaces
                if (state && state.length > 2) {
                    // Try to extract 2-letter state code if it's a full state name
                    const stateMap = {
                        'VIRGINIA': 'VA', 'CALIFORNIA': 'CA', 'NEW YORK': 'NY', 'TEXAS': 'TX',
                        'FLORIDA': 'FL', 'ILLINOIS': 'IL', 'PENNSYLVANIA': 'PA', 'MARYLAND': 'MD',
                        'MASSACHUSETTS': 'MA', 'GEORGIA': 'GA', 'WASHINGTON': 'WA', 'COLORADO': 'CO',
                        'ARIZONA': 'AZ', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'OREGON': 'OR',
                        'OHIO': 'OH', 'NORTH CAROLINA': 'NC', 'SOUTH CAROLINA': 'SC', 'TENNESSEE': 'TN',
                        'KENTUCKY': 'KY', 'WEST VIRGINIA': 'WV', 'DELAWARE': 'DE', 'NEW JERSEY': 'NJ'
                    };
                    state = stateMap[state] || state.substring(0, 2);
                }

                // Normalize city names - handle common variations
                const normalizeCity = (cityName) => {
                    return cityName
                        .replace(/\s+/g, ' ') // Normalize spaces
                        .replace(/^st\.?\s+/i, 'saint ') // St. -> Saint
                        .replace(/^ft\.?\s+/i, 'fort ') // Ft. -> Fort
                        .replace(/^new\s+/i, 'new ') // Preserve "New" prefix
                        .trim();
                };

                const normalizedCity = normalizeCity(city);

                console.log(`🔍 ULTRA-STRICT: Filtering by location - city: "${normalizedCity}", state: "${state}"`);

                filteredDoctors = filteredDoctors.filter(doctor => {
                    const doctorCity = normalizeCity((doctor.city || '').toLowerCase().trim());
                    const doctorState = (doctor.state || '').toUpperCase().trim();

                    // If state is provided, require state match
                    if (state) {
                        // State must match
                        if (doctorState !== state) {
                            return false;
                        }
                    }

                    // City matching - flexible but accurate
                    if (normalizedCity) {
                        // Exact match or contains match
                        const cityMatch = 
                            doctorCity === normalizedCity ||
                            doctorCity.includes(normalizedCity) ||
                            normalizedCity.includes(doctorCity) ||
                            doctorCity.startsWith(normalizedCity) ||
                            normalizedCity.startsWith(doctorCity);

                        if (!cityMatch) {
                            return false;
                        }
                    }

                    // If we get here, location matches
                    if (state && normalizedCity) {
                        console.log(`✅ Match: ${doctor.city}, ${doctor.state} matches ${city}, ${state}`);
                    }
                    
                    return true;
                });
                
                // Log sample of filtered doctors for debugging
                if (filteredDoctors.length > 0) {
                    console.log(`📍 ULTRA-STRICT: After location filtering (city: "${city}", state: "${state}"): ${filteredDoctors.length} doctors`);
                    console.log('📍 Sample matched locations:', filteredDoctors.slice(0, 5).map(d => `${d.city}, ${d.state}`));
                } else {
                    console.warn(`⚠️ ULTRA-STRICT: No doctors found for location "${city}, ${state}"`);
                    // Show more sample locations to help debug
                    const sampleLocations = [...new Set(this.doctorsCache.slice(0, 100).map(d => `${d.city}, ${d.state}`))].slice(0, 20);
                    console.log('📍 Sample available locations in CSV:', sampleLocations);
                    console.log(`📍 Total unique locations in first 1000 records: ${[...new Set(this.doctorsCache.slice(0, 1000).map(d => `${d.city}, ${d.state}`))].length}`);
                }
            }

            // Remove duplicates
            const uniqueDoctors = this.removeDuplicates(filteredDoctors);
            console.log(`🔄 ULTRA-STRICT: After removing duplicates: ${uniqueDoctors.length} unique doctors`);

            // DEBUGGING: Add detailed logging here
            console.log('🔍 ULTRA-STRICT FILTERING DETAILS:');
            console.log('- Input location:', location);
            console.log('- Input symptoms:', symptoms);
            console.log('- Input age:', age);
            console.log('- Total doctors before filtering:', this.doctorsCache.length);
            console.log('- Doctors after specialty filtering:', filteredDoctors.length);
            console.log('- Doctors after location filtering:', filteredDoctors.length);

            // Log a few sample doctors to see what we're working with
            if (filteredDoctors.length > 0) {
                console.log('📋 Sample filtered doctors:');
                filteredDoctors.slice(0, 3).forEach((doc, i) => {
                    console.log(`  ${i+1}. ${doc.first_name} ${doc.last_name} - ${doc.primary_specialty} - ${doc.city}, ${doc.state}`);
                });
            }

            // If we have doctors, log what we found
            if (uniqueDoctors.length > 0) {
                const specialties = [...new Set(uniqueDoctors.map(d => d.primary_specialty))];
                console.log('✅ ULTRA-STRICT FOUND SPECIALTIES:', specialties);
            } else {
                console.log('❌ ULTRA-STRICT: NO DOCTORS FOUND after strict filtering');
            }

            return uniqueDoctors.slice(0, limit);

        } catch (error) {
            console.error('Error in ultra-strict search:', error);
            return [];
        }
    }
    // ULTRA-STRICT FILTERING: Only allow specific specialties for specific symptoms
    applyUltraStrictFiltering(doctors, symptomsLower, ageNum) {
        console.log(`🚨 ULTRA-STRICT FILTERING: symptoms="${symptomsLower}", age=${ageNum}`);

        return doctors.filter(doctor => {
            const specialty = (doctor.primary_specialty || '').toUpperCase();

            // FOR CHILDREN (under 18) - ONLY these specialties allowed
            if (ageNum > 0 && ageNum < 18) {
                // For children, only allow pediatric-appropriate specialties
                const allowedChildSpecialties = [
                    'PEDIATRICS',
                    'FAMILY PRACTICE',
                    'FAMILY MEDICINE',
                    'PEDIATRICIAN',
                    'GENERAL PRACTICE'
                ];

                const isAllowedForChild = allowedChildSpecialties.some(allowed =>
                    specialty.includes(allowed)
                );

                if (!isAllowedForChild) {
                    return false;
                }

                // FOR SPECIFIC SYMPTOMS IN CHILDREN
                if (symptomsLower.includes('throat') || symptomsLower.includes('sore throat')) {
                    // For sore throat in children: ONLY pediatricians and family doctors
                    const throatSpecialties = ['PEDIATRICS', 'FAMILY PRACTICE', 'FAMILY MEDICINE'];
                    return throatSpecialties.some(throatSpec => specialty.includes(throatSpec));
                }

                if (symptomsLower.includes('ear') || symptomsLower.includes('infection')) {
                    // For ear infections in children: pediatricians and family doctors
                    const earSpecialties = ['PEDIATRICS', 'FAMILY PRACTICE', 'FAMILY MEDICINE'];
                    return earSpecialties.some(earSpec => specialty.includes(earSpec));
                }

                if (symptomsLower.includes('fever') || symptomsLower.includes('cold') || symptomsLower.includes('flu')) {
                    // For fever/cold/flu in children: pediatricians and family doctors
                    const feverSpecialties = ['PEDIATRICS', 'FAMILY PRACTICE', 'FAMILY MEDICINE'];
                    return feverSpecialties.some(feverSpec => specialty.includes(feverSpec));
                }

                // Default for children: only pediatricians and family doctors
                return ['PEDIATRICS', 'FAMILY PRACTICE', 'FAMILY MEDICINE'].some(spec =>
                    specialty.includes(spec)
                );
            }

            // FOR ADULTS - NO HARDCODED SPECIALTY FILTERING
            // Let Gemini AI determine the specialty instead
            // This function is only called when specialty is NOT provided
            // If we reach here with an adult, allow all specialties (Gemini will filter)
            // Only filter out pediatric-only specialties for adults
            const adultOnlySpecialties = ['PEDIATRICS', 'PEDIATRICIAN'];
            if (adultOnlySpecialties.some(pedsSpec => specialty.includes(pedsSpec))) {
                return false; // Filter out pediatrics for adults
            }
            
            // Allow all other specialties for adults - let Gemini AI match them
            return true;
        });
    }

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

    async getSpecialties() {
        if (!this.isLoaded) {
            await this.loadCSVData();
        }
        return [...new Set(this.doctorsCache.map(d => d.primary_specialty).filter(Boolean))].sort();
    }
}

export const csvProcessorUltraStrict = new CSVProcessorUltraStrict();