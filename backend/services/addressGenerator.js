import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate a realistic address for a doctor using Gemini AI
 * @param {Object} doctor - Doctor object with city, state, zip_code, facility_name, etc.
 * @returns {Promise<string>} Generated address line 1
 */
export async function generateDoctorAddress(doctor) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️ GEMINI_API_KEY not set, cannot generate address');
            return null;
        }

        const { city, state, zip_code, facility_name, primary_specialty, first_name, last_name } = doctor;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Generate a realistic street address for a medical facility in ${city}, ${state} ${zip_code || ''}.

Doctor Information:
- Name: Dr. ${first_name} ${last_name}
- Facility: ${facility_name || 'Medical Clinic'}
- Specialty: ${primary_specialty || 'General Practice'}
- City: ${city}
- State: ${state}
- ZIP Code: ${zip_code || 'unknown'}

Generate ONLY the street address (building number and street name) in this format:
- Format: "123 Main Street" or "456 Medical Center Drive" or "789 Park Avenue Suite 200"
- Must be a realistic address that could exist in ${city}, ${state}
- Include suite/unit number if it's a medical facility (e.g., "Suite 200", "Suite A")
- Do NOT include city, state, or zip code
- Do NOT add any explanation or extra text
- Just return the street address line only

Example outputs:
- "1500 Medical Center Drive Suite 300"
- "2500 Park Avenue"
- "1200 Healthcare Boulevard Suite 150"

Your response (street address only):`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Clean up the response - remove quotes, extra whitespace, etc.
        let address = responseText
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/^Address:\s*/i, '') // Remove "Address:" prefix if present
            .trim();

        // Validate that it looks like an address
        if (!address || address.length < 5) {
            console.warn(`⚠️ Generated address too short: "${address}"`);
            return null;
        }

        // If it contains city/state/zip, extract only the street address
        if (address.includes(',')) {
            address = address.split(',')[0].trim();
        }

        console.log(`✅ Generated address for Dr. ${last_name} in ${city}, ${state}: ${address}`);
        return address;

    } catch (error) {
        console.error(`❌ Error generating address for doctor in ${doctor.city}, ${doctor.state}:`, error.message);
        return null;
    }
}

/**
 * Generate addresses for multiple doctors in batches
 * @param {Array} doctors - Array of doctor objects
 * @param {number} batchSize - Number of doctors to process per batch
 * @param {number} delayMs - Delay between batches in milliseconds (for rate limiting)
 * @returns {Promise<Array>} Array of doctors with generated addresses
 */
export async function generateAddressesBatch(doctors, batchSize = 10, delayMs = 2000) {
    const results = [];
    let processed = 0;

    for (let i = 0; i < doctors.length; i += batchSize) {
        const batch = doctors.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(doctors.length / batchSize)} (${batch.length} doctors)...`);

        const batchPromises = batch.map(async (doctor) => {
            // Only generate if address is missing or very short
            const hasAddress = doctor.address_line_1 && doctor.address_line_1.trim().length > 5;
            
            if (hasAddress) {
                return {
                    ...doctor,
                    generated_address: null,
                    address_generated: false
                };
            }

            const generatedAddress = await generateDoctorAddress(doctor);
            
            if (generatedAddress) {
                processed++;
            }

            return {
                ...doctor,
                generated_address: generatedAddress,
                address_generated: !!generatedAddress
            };
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Rate limiting delay between batches
        if (i + batchSize < doctors.length) {
            console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    console.log(`✅ Generated ${processed} addresses out of ${doctors.length} doctors`);
    return results;
}

