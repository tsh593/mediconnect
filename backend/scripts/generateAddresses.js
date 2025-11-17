import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { generateAddressesBatch } from '../services/addressGenerator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CSV_INPUT_PATH = resolve(__dirname, '../data/cms-doctors-clinicians.csv');
const CSV_OUTPUT_PATH = resolve(__dirname, '../data/cms-doctors-clinicians.csv'); // Same file (overwrite)
const CSV_BACKUP_PATH = resolve(__dirname, '../data/cms-doctors-clinicians-backup.csv');

/**
 * Read CSV file and return array of doctors
 */
function readCSV() {
    return new Promise((resolve, reject) => {
        const doctors = [];
        let headers = [];

        console.log('📖 Reading CSV file...');
        
        // Read first line to get headers
        const fileStream = fs.createReadStream(CSV_INPUT_PATH);
        let firstLine = true;
        
        fileStream
            .pipe(csv())
            .on('data', (row) => {
                if (firstLine) {
                    // Get headers from first row
                    headers = Object.keys(row);
                    firstLine = false;
                }
                
                if (row.NPI && row['Provider First Name'] && row['Provider Last Name']) {
                    doctors.push({
                        ...row,
                        // Ensure we have the original row data
                        _originalRow: row
                    });
                }
            })
            .on('end', () => {
                console.log(`✅ Read ${doctors.length} doctors from CSV`);
                console.log(`📋 Found ${headers.length} columns`);
                resolve({ doctors, headers });
            })
            .on('error', reject);
    });
}

/**
 * Write CSV file with generated addresses
 */
function writeCSV(doctors, headers) {
    return new Promise((resolve, reject) => {
        // Check if Generated_Address column already exists
        const hasGeneratedAddressColumn = headers.includes('Generated_Address');
        const hasAddressGeneratedColumn = headers.includes('Address_Generated');

        // Add new columns if they don't exist
        const outputHeaders = [...headers];
        if (!hasGeneratedAddressColumn) {
            outputHeaders.push('Generated_Address');
        }
        if (!hasAddressGeneratedColumn) {
            outputHeaders.push('Address_Generated');
        }

        // Prepare CSV writer
        const csvWriter = createObjectCsvWriter({
            path: CSV_OUTPUT_PATH,
            header: outputHeaders.map(header => ({ id: header, title: header }))
        });

        // Prepare data rows
        const rows = doctors.map(doctor => {
            const row = { ...doctor };
            
            // Remove internal _originalRow property
            delete row._originalRow;

            // Keep original address if it exists, otherwise use generated
            if ((!row.adr_ln_1 || row.adr_ln_1.trim().length < 5) && row.generated_address) {
                // Use generated address if original is missing/empty
                row.adr_ln_1 = row.generated_address;
                row.Generated_Address = row.generated_address;
                row.Address_Generated = 'true';
            } else {
                // Keep original address, but mark if it was generated
                row.Generated_Address = row.generated_address || '';
                row.Address_Generated = row.address_generated ? 'true' : 'false';
            }

            // Remove internal properties that shouldn't be in CSV
            delete row.generated_address;
            delete row.address_generated;
            delete row._originalRow;

            // Ensure all headers have values (for any missing columns)
            outputHeaders.forEach(header => {
                if (row[header] === undefined || row[header] === null) {
                    row[header] = '';
                }
            });

            return row;
        });

        console.log('📝 Writing CSV file with generated addresses...');
        csvWriter.writeRecords(rows)
            .then(() => {
                console.log(`✅ Successfully wrote ${rows.length} doctors to CSV`);
                resolve();
            })
            .catch(reject);
    });
}

/**
 * Main function to generate addresses and update CSV
 */
async function main() {
    try {
        console.log('🚀 Starting address generation process...');
        console.log('⚠️  Note: This will process doctors with missing addresses');
        console.log('⚠️  Make sure GEMINI_API_KEY is set in your .env file\n');

        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ Error: GEMINI_API_KEY not found in environment variables');
            console.error('   Please set it in your .env file');
            process.exit(1);
        }

        // Check if CSV file exists
        if (!fs.existsSync(CSV_INPUT_PATH)) {
            console.error(`❌ CSV file not found: ${CSV_INPUT_PATH}`);
            process.exit(1);
        }

        // Create backup
        console.log('💾 Creating backup...');
        fs.copyFileSync(CSV_INPUT_PATH, CSV_BACKUP_PATH);
        console.log(`✅ Backup created: ${CSV_BACKUP_PATH}`);

        // Read CSV
        const { doctors, headers } = await readCSV();

        // Filter doctors that need addresses (missing or very short)
        const doctorsNeedingAddresses = doctors.filter(doctor => {
            const hasAddress = doctor.adr_ln_1 && doctor.adr_ln_1.trim().length > 5;
            return !hasAddress;
        });

        console.log(`\n📊 Statistics:`);
        console.log(`   Total doctors: ${doctors.length}`);
        console.log(`   Doctors needing addresses: ${doctorsNeedingAddresses.length}`);
        console.log(`   Doctors with existing addresses: ${doctors.length - doctorsNeedingAddresses.length}\n`);

        if (doctorsNeedingAddresses.length === 0) {
            console.log('✅ All doctors already have addresses!');
            return;
        }

        // Ask for confirmation (optional - you can remove this for automation)
        console.log('⚠️  This will generate addresses using Gemini AI');
        console.log(`⚠️  Processing ${doctorsNeedingAddresses.length} doctors in batches of 10`);
        console.log('⚠️  This may take a while and use API credits\n');

        // Generate addresses in batches
        const doctorsWithAddresses = await generateAddressesBatch(
            doctorsNeedingAddresses,
            10, // batch size
            2000 // 2 second delay between batches (rate limiting)
        );

        // Update original doctors array with generated addresses
        const addressMap = new Map();
        doctorsWithAddresses.forEach(doctor => {
            addressMap.set(doctor.NPI, {
                generated_address: doctor.generated_address,
                address_generated: doctor.address_generated
            });
        });

        const updatedDoctors = doctors.map(doctor => {
            const addressData = addressMap.get(doctor.NPI);
            if (addressData) {
                return {
                    ...doctor,
                    generated_address: addressData.generated_address,
                    address_generated: addressData.address_generated
                };
            }
            return doctor;
        });

        // Write updated CSV
        await writeCSV(updatedDoctors, headers);

        console.log('\n✅ Address generation complete!');
        console.log(`📊 Generated ${doctorsWithAddresses.filter(d => d.address_generated).length} new addresses`);
        console.log(`💾 Original file backed up to: ${CSV_BACKUP_PATH}`);
        console.log(`📝 Updated file: ${CSV_OUTPUT_PATH}`);

    } catch (error) {
        console.error('❌ Error during address generation:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };

