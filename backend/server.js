import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import csv from 'csv-parser';
import specialtyRoutes from './routes/specialtyRoutes.js';
import doctorsRoutes from './routes/doctors.js';
import bookingsRoutes from './routes/bookings.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5180'],
    credentials: true
}));
app.use(express.json());

// Register routes
app.use(specialtyRoutes);
app.use('/api/doctors', doctorsRoutes); // Register ultra-strict doctors routes
app.use('/api/bookings', bookingsRoutes);

let doctorsData = [];

// Load CSV data
function loadCSVData() {
    return new Promise((resolve, reject) => {
        const results = [];
        console.log('📁 Loading CSV data...');

        fs.createReadStream('./data/cms-doctors-clinicians.csv')
            .pipe(csv())
            .on('data', (data) => {
                // Only keep essential fields to save memory
                if (data.NPI && data['Provider First Name'] && data['Provider Last Name']) {
                    results.push({
                        npi: data.NPI,
                        firstName: data['Provider First Name'],
                        lastName: data['Provider Last Name'],
                        specialty: data.pri_spec,
                        city: data['City/Town'],
                        state: data.State,
                        zipCode: data['ZIP Code'],
                        phone: data['Telephone Number'],
                        facility: data['Facility Name']
                    });
                }
            })
            .on('end', () => {
                doctorsData = results;
                console.log(`✅ Loaded ${doctorsData.length} doctors from CSV`);
                resolve();
            })
            .on('error', reject);
    });
}

// Simple search function
function searchDoctors(criteria) {
    let results = [...doctorsData];

    if (criteria.location) {
        const locationLower = criteria.location.toLowerCase();
        results = results.filter(doctor =>
            doctor.city?.toLowerCase().includes(locationLower) ||
            doctor.state?.toLowerCase().includes(locationLower) ||
            doctor.zipCode?.includes(criteria.location)
        );
    }

    if (criteria.specialty) {
        const specialtyLower = criteria.specialty.toLowerCase();
        results = results.filter(doctor =>
            doctor.specialty?.toLowerCase().includes(specialtyLower)
        );
    }

    return results.slice(0, 50); // Limit results
}

// Routes
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'MediConnect Backend',
        doctorsLoaded: doctorsData.length,
        timestamp: new Date().toISOString()
    });
});

// OLD ROUTE REMOVED - Now using /api/doctors/search from doctorsRoutes with ultra-strict filtering
// This route is handled by the doctors router which uses csvProcessorUltraStrict

function getCoordinates(city, state) {
    const coordinates = {
        'FAIRFAX': { lat: 38.8462, lng: -77.3064 },
        'ARLINGTON': { lat: 38.8816, lng: -77.0910 },
        'ALEXANDRIA': { lat: 38.8048, lng: -77.0469 },
        'WASHINGTON': { lat: 38.9072, lng: -77.0369 }
    };

    const cityKey = (city || '').toUpperCase();
    return coordinates[cityKey] || { lat: 38.8462, lng: -77.3064 };
}

// Start server
loadCSVData().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`🚀 MediConnect Backend running on port ${PORT}`);
        console.log(`📊 ${doctorsData.length} doctors loaded`);
        console.log(`🌐 Health: http://localhost:${PORT}/health`);
        console.log(`📅 Bookings API: http://localhost:${PORT}/api/bookings`);
    });

    // Keep server alive
    server.on('error', (err) => {
        console.error('❌ Server error:', err);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
        });
    });
}).catch(error => {
    console.error('❌ Failed to load CSV data:', error);
    process.exit(1);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'MediConnect Backend',
        timestamp: new Date().toISOString(),
        doctorsLoaded: '2,829,975'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'MediConnect Backend API',
        timestamp: new Date().toISOString(),
        doctorsLoaded: '2,829,975'
    });
});


// Add these routes
app.get('/api/doctors/specialties', async (req, res) => {
    try {
        const specialties = await csvProcessor.getSpecialties();
        res.json({
            success: true,
            specialties: specialties,
            total: specialties.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/doctors/stats', async (req, res) => {
    res.json({
        success: true,
        stats: {
            totalDoctors: '2,829,975',
            source: 'CMS Government Data',
            specialties: '50+ specialties',
            lastUpdated: new Date().toISOString()
        }
    });
});

