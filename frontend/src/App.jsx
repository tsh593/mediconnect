import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
    FaStethoscope, FaHeartbeat, FaBrain, FaBaby, FaBone, FaClinicMedical,
    FaUserMd, FaXRay, FaBookMedical, FaFirstAid, FaProcedures, FaMicroscope,
    FaEye, FaAllergies, FaSyringe, FaSearch, FaBookOpen, FaComments, FaStar,
    FaChevronDown, FaChevronUp, FaPaperPlane, FaImage, FaTimes, FaUser, FaEnvelope,
    FaLock, FaMapMarkerAlt, FaSignInAlt, FaSignOutAlt, FaUserCircle, FaCog,
    FaPalette, FaFont, FaSave, FaUndo, FaSearchPlus, FaSearchMinus, FaRobot, FaSpinner
} from 'react-icons/fa';
import { FaCut, FaUserAlt, FaRegUser, FaHeadSideCough } from 'react-icons/fa';
import { GiKidneys, GiLungs, GiSpiderWeb, GiStomach } from 'react-icons/gi';
import { MdPsychology, MdEmergency, MdForum } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import { FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import './specialty.css';
import './index.css';

// Import AI Service
import { getAIDiagnosis, getMedicalEducation, testAIConnection } from './services/googleGenAIService';

// Import Precision Consult Match Service with Free Maps
import {
    findMatchingDoctors,
    matchSymptomsToSpecialty,
    getSpecialtiesList, // Now this exists
    testPrecisionMatchService
} from './services/precisionConsultMatchService';
import { bookingService } from './services/bookingService';

import ClinicalNexusAcademy from './components/ClinicalNexusAcademy.jsx';
import Anatomy3DViewer from './components/Anatomy3DViewer.jsx';
import './components/Anatomy3DViewer.css';

// Import Free Maps Service
import freeMapsService from './services/freeMapsService';

// Import Map Component
import NewMapComponent from './components/NewMapComponent';

// Import CMS API Service
import { cmsApiService } from './services/cmsApiService';
import { CMSApiDebugService } from './services/cmsApiDebugService';

// Environment test utility
const testEnvironment = () => {
    console.group('🌍 ENVIRONMENT VARIABLES TEST');

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('VITE_GEMINI_API_KEY:', apiKey ? `✅ Set (${apiKey.length} chars)` : '❌ Missing');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');

    if (apiKey) {
        console.log('API Key preview:', apiKey.substring(0, 8) + '...');
        console.log('Starts with AIza:', apiKey.startsWith('AIza'));
        console.log('Contains "your":', apiKey.includes('your-api-key'));
    }

    console.groupEnd();

    return {
        geminiApiKey: !!apiKey,
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        apiKeyValid: apiKey && apiKey.startsWith('AIza') && !apiKey.includes('your-api-key')
    };
};

// SINGLETON: Initialize Supabase client once
let supabaseInstance = null;

const getSupabaseClient = () => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey ||
            supabaseUrl.includes('your-project-ref') ||
            supabaseKey.includes('your-anon-key-here')) {
            console.warn('Supabase not configured. Please set up your .env file');
            supabaseInstance = createMockClient();
            return supabaseInstance;
        }

        supabaseInstance = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            }
        });
        console.log('✅ Supabase client initialized (singleton)');
        return supabaseInstance;
    } catch (error) {
        console.error('Error creating Supabase client:', error);
        supabaseInstance = createMockClient();
        return supabaseInstance;
    }
};

const supabase = getSupabaseClient();

// Mock client for development
const createMockClient = () => {
    console.log('Using mock Supabase client for development');
    return {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signUp: (credentials) => {
                console.log('Mock signUp called with:', credentials);
                return Promise.resolve({
                    data: {
                        user: {
                            id: uuidv4(),
                            email: credentials.email,
                            user_metadata: { username: credentials.options?.data?.username }
                        },
                        session: null
                    },
                    error: null
                });
            },
            signInWithPassword: (credentials) => {
                console.log('Mock signIn called with:', credentials);
                return Promise.resolve({
                    data: {
                        user: {
                            id: uuidv4(),
                            email: credentials.email,
                            user_metadata: { username: 'mockuser' }
                        },
                        session: null
                    },
                    error: null
                });
            },
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: (callback) => {
                const subscription = {
                    unsubscribe: () => {}
                };
                return { data: { subscription } };
            }
        },
        from: (table) => ({
            select: () => Promise.resolve({ data: [], error: null }),
            insert: (data) => {
                console.log('Mock insert called for table:', table, 'with data:', data);
                return Promise.resolve({ data: null, error: null });
            },
            update: () => Promise.resolve({ data: null, error: null }),
            on: () => ({
                subscribe: () => ({
                    unsubscribe: () => {}
                })
            })
        }),
        channel: () => ({
            on: () => ({
                subscribe: () => ({
                    unsubscribe: () => {}
                })
            })
        }),
        storage: {
            from: (bucket) => ({
                upload: (path, file) => {
                    console.log('Mock upload called for bucket:', bucket, 'path:', path);
                    return Promise.resolve({
                        data: { path },
                        error: null
                    });
                },
                getPublicUrl: (path) => ({
                    data: {
                        publicUrl: `https://example.com/${bucket}/${path}`
                    }
                }),
                list: () => Promise.resolve({ data: [], error: null }),
                remove: () => Promise.resolve({ data: null, error: null })
            })
        }
    };
};

const testBackendConnection = async () => {
    console.log('🔌 Testing Backend Connection...');
    const result = await cmsApiService.testBackendConnection();
    alert(`Backend Test: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.error || JSON.stringify(result.data, null, 2)}`);
};

const handleTestCSVData = async () => {
    console.log('📊 Testing CMS CSV Data Loading...');
    const result = await cmsApiService.testCSVData();

    if (result.success) {
        alert(`✅ CMS CSV Test: SUCCESS\nRecords: ${result.totalRecords}\nSample: ${result.sampleRecords[0]?.name} - ${result.sampleRecords[0]?.specialty}`);
        console.log('CSV Test Details:', result);
    } else {
        alert(`❌ CMS CSV Test: FAILED\nError: ${result.error}`);
    }
};

const testCSVFileDirectly = async () => {
    try {
        console.log('🔍 Testing CSV file directly...');
        const response = await fetch('/data/cms-doctors-clinicians.csv');
        const text = await response.text();

        console.log('📄 File Response:', {
            status: response.status,
            ok: response.ok,
            size: text.length,
            first100Chars: text.substring(0, 100),
            headers: Object.fromEntries(response.headers.entries())
        });

        if (text.length === 0) {
            alert('❌ File is completely empty when fetched via JavaScript');
        } else {
            alert(`✅ File loaded successfully!\nSize: ${text.length} chars\nFirst line: ${text.split('\n')[0]?.substring(0, 50)}...`);
        }
    } catch (error) {
        console.error('File test error:', error);
        alert(`❌ File test failed: ${error.message}`);
    }
};

// Default user preferences
const defaultPreferences = {
    primaryColor: '#4f46e5',
    secondaryColor: '#10b981',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    fontSize: '16px',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '8px'
};

// Cache busting utility
const getCacheBustedUrl = (url) => {
    if (!url) return null;
    const sessionTimestamp = sessionStorage.getItem('avatar_cache_buster') || Date.now();
    return `${url}?t=${sessionTimestamp}`;
};

// AI Diagnostic Component
const AIDiagnostic = () => {
    const [diagnosticInfo, setDiagnosticInfo] = useState(null);

    const runDiagnostics = async () => {
        console.log('🔍 Running AI Diagnostics...');

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const diagnostics = {
            envVarExists: !!apiKey,
            envVarLength: apiKey ? apiKey.length : 0,
            envVarPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'None',
            isMockKey: apiKey ? apiKey.includes('your-api-key') : true,
            timestamp: new Date().toISOString()
        };

        console.log('📋 Diagnostic Info:', diagnostics);
        setDiagnosticInfo(diagnostics);

        // Test the AI service directly
        try {
            const testResult = await getAIDiagnosis('test headache');
            console.log('🧪 AI Service Test Result:', testResult);

            setDiagnosticInfo(prev => ({
                ...prev,
                aiTestResult: testResult.success ? 'SUCCESS' : 'FAILED',
                aiError: testResult.error,
                aiFallback: testResult.fallback
            }));
        } catch (error) {
            console.error('💥 AI Test Error:', error);
            setDiagnosticInfo(prev => ({
                ...prev,
                aiTestResult: 'ERROR',
                aiError: error.message
            }));
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '15px',
            fontSize: '12px',
            zIndex: 10000,
            borderRadius: '8px',
            maxWidth: '400px',
            fontFamily: 'monospace'
        }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>AI Diagnostic Panel</div>

            <button
                onClick={runDiagnostics}
                style={{
                    padding: '5px 10px',
                    marginBottom: '10px',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Run Diagnostics
            </button>

            {diagnosticInfo && (
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                    <div>✅ Env Var: {diagnosticInfo.envVarExists ? 'EXISTS' : 'MISSING'}</div>
                    <div>📏 Length: {diagnosticInfo.envVarLength} chars</div>
                    <div>🔑 Preview: {diagnosticInfo.envVarPreview}</div>
                    <div>🤖 Mock Key: {diagnosticInfo.isMockKey ? 'YES' : 'NO'}</div>
                    {diagnosticInfo.aiTestResult && (
                        <>
                            <div>🧪 AI Test: {diagnosticInfo.aiTestResult}</div>
                            {diagnosticInfo.aiError && (
                                <div>❌ Error: {diagnosticInfo.aiError}</div>
                            )}
                            <div>🔄 Fallback: {diagnosticInfo.aiFallback ? 'ACTIVE' : 'INACTIVE'}</div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// CMS API Debug Panel Component
const CMSDebugPanel = () => {
    const [debugInfo, setDebugInfo] = useState(null);
    const [datasets, setDatasets] = useState([]);

    const runCMSDebug = async () => {
        const debugService = new CMSApiDebugService();
        const results = await debugService.testCMSConnection();
        setDebugInfo(results);

        // Also get available datasets
        const availableDatasets = await debugService.getAvailableDatasets();
        setDatasets(availableDatasets);
        console.log('Available datasets:', availableDatasets);
    };

    return (
        <div style={{
            position: 'fixed',
            top: '50px',
            left: '10px',
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '15px',
            fontSize: '12px',
            zIndex: 10000,
            borderRadius: '8px',
            maxWidth: '500px',
            fontFamily: 'monospace'
        }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>CMS API Debug</div>

            <button
                onClick={runCMSDebug}
                style={{
                    padding: '5px 10px',
                    marginBottom: '10px',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Test CMS API
            </button>

            {/* Add this debug button near your other debug buttons */}
            <button
                onClick={() => {
                    console.log('Current activeFeature:', activeFeature);
                    setActiveFeature('clinical-academy');
                }}
                style={{
                    fontSize: '10px',
                    marginTop: '5px',
                    display: 'block',
                    background: '#10b981'
                }}
            >
                Test Clinical Academy
            </button>

            <button onClick={handleTestCSVData} style={{ fontSize: '10px', marginTop: '5px', display: 'block', background: '#f59e0b' }}>
                Test CMS CSV Data
            </button>

            <button onClick={testCSVFileDirectly} style={{ fontSize: '10px', marginTop: '5px', display: 'block', background: '#dc2626' }}>
                Test CSV File Directly
            </button>

            {debugInfo && (
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                    {debugInfo.map((test, index) => (
                        <div key={index} style={{ marginBottom: '8px', padding: '5px', background: test.ok ? '#10b98120' : '#ef444420' }}>
                            <div><strong>{test.test}:</strong> {test.ok ? '✅ SUCCESS' : '❌ FAILED'}</div>
                            {test.status && <div>Status: {test.status}</div>}
                            {test.error && <div>Error: {test.error}</div>}
                            <div style={{ fontSize: '10px', color: '#ccc' }}>URL: {test.url}</div>
                        </div>
                    ))}
                </div>
            )}

            {datasets.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>📊 Available Datasets:</div>
                    {datasets.slice(0, 5).map((ds, index) => (
                        <div key={index} style={{ fontSize: '10px', marginBottom: '3px' }}>
                            • {ds.title}
                        </div>
                    ))}
                    {datasets.length > 5 && (
                        <div style={{ fontSize: '10px', color: '#ccc' }}>
                            ... and {datasets.length - 5} more
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBottom, setIsBottom] = useState(false);
    const [activeSpecialty, setActiveSpecialty] = useState(null);
    const [showAnatomyViewer, setShowAnatomyViewer] = useState(false);
    const [selectedSpecialtyFor3D, setSelectedSpecialtyFor3D] = useState(null);
    const [userRatings, setUserRatings] = useState({});
    const [hoveredAvatar, setHoveredAvatar] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const currentUserRef = useRef(currentUser);

    // Image enlargement states
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // AI Diagnostic Think Tank states
    const [showAIChat, setShowAIChat] = useState(false);
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    const [patientInfo, setPatientInfo] = useState({
        age: '',
        gender: '',
        symptoms: '', // NEW FIELD
        medicalHistory: '',
        duration: '',
        severity: ''
    });

    // Precision Consult Match states
    const [showPrecisionMatch, setShowPrecisionMatch] = useState(false);
    const [doctorMatches, setDoctorMatches] = useState([]);
    const [matchLoading, setMatchLoading] = useState(false);
    const [specialtyMatch, setSpecialtyMatch] = useState(null);
    const [recommendedSpecialty, setRecommendedSpecialty] = useState(null);
    const [specialtyLoading, setSpecialtyLoading] = useState(false);
    const [matchCriteria, setMatchCriteria] = useState({
        symptoms: '',
        age: '',
        gender: '',
        location: '',
        insurance: '',
        condition: '',
        telemedicinePreferred: false,
        languagePreferences: []
    });

    // Map states
    const [showMap, setShowMap] = useState(false);
    const [mapProviders, setMapProviders] = useState([]);
    const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]);
    const [mapLoading, setMapLoading] = useState(false);
    const [selectedMapDoctor, setSelectedMapDoctor] = useState(null);

    // Debug panel state
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    // Avatar loading state
    const [avatarLoadError, setAvatarLoadError] = useState(false);
    const [avatarKey, setAvatarKey] = useState(Date.now());

    // CMS Debug state
    const [showCMSDebug, setShowCMSDebug] = useState(false);

    // NEW: Active feature state for Clinical Nexus Academy
    const [activeFeature, setActiveFeature] = useState(null);

    const [isUploading, setIsUploading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [authForm, setAuthForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [authError, setAuthError] = useState('');
    const [supabaseConfigured, setSupabaseConfigured] = useState(true);
    const [authSuccess, setAuthSuccess] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [userPreferences, setUserPreferences] = useState(defaultPreferences);
    const [tempPreferences, setTempPreferences] = useState(defaultPreferences);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    // Booking modal states
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingDoctor, setBookingDoctor] = useState(null);
    const [bookingDetails, setBookingDetails] = useState({
        date: '',
        time: '',
        type: 'in-person',
        notes: ''
    });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingConfirmation, setBookingConfirmation] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // My Appointments states
    const [showMyAppointments, setShowMyAppointments] = useState(false);
    const [myAppointments, setMyAppointments] = useState([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    const openBooking = (doctor) => {
        setBookingDoctor(doctor);
        // Default to tomorrow at 10:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        setBookingDetails({
            date: `${yyyy}-${mm}-${dd}`,
            time: '10:00',
            type: 'in-person',
            notes: ''
        });
        setBookingError('');
        setBookingConfirmation(null);
        setShowBookingModal(true);
    };

    const closeBooking = () => {
        setShowBookingModal(false);
        setBookingDoctor(null);
        setBookingLoading(false);
        setBookingError('');
        setBookingConfirmation(null);
    };

    const submitBooking = async () => {
        if (!bookingDoctor) return;
        if (!bookingDetails.date || !bookingDetails.time) {
            setBookingError('Please select a date and time.');
            return;
        }
        setBookingLoading(true);
        setBookingError('');
        try {
            const payload = {
                name: currentUser?.user_metadata?.username || currentUser?.username || 'Guest',
                age: matchCriteria.age || patientInfo.age || '0',
                email: currentUser?.email || authForm.email || '',
                specialty: bookingDoctor.specialty,
                doctorId: bookingDoctor.nationalProviderIdentifier || bookingDoctor.npi || bookingDoctor.id,
                doctorName: bookingDoctor.name,
                date: bookingDetails.date,
                time: bookingDetails.time,
                type: bookingDetails.type,
                notes: bookingDetails.notes
            };

            const { booking } = await bookingService.createBooking(payload);
            setBookingConfirmation({
                confirmationNumber: booking.confirmationNumber,
                date: booking.date,
                time: booking.time,
                type: booking.type,
                instructions: 'Please bring your ID and medications list.'
            });
        } catch (err) {
            setBookingError(err.message || 'Failed to schedule appointment.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleCancelAppointment = async (bookingId) => {
        if (!currentUser?.email) return;
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        
        setCancellingId(bookingId);
        try {
            await bookingService.cancelBooking(bookingId, currentUser.email);
            setMyAppointments(prev => prev.filter(b => b.id !== bookingId));
        } catch (err) {
            alert('Failed to cancel appointment: ' + err.message);
        } finally {
            setCancellingId(null);
        }
    };

    // Load availability when date changes
    useEffect(() => {
        (async () => {
            try {
                if (!showBookingModal || !bookingDoctor || !bookingDetails.date) return;
                setLoadingSlots(true);
                const doctorId = bookingDoctor.nationalProviderIdentifier || bookingDoctor.npi || bookingDoctor.id;
                const avail = await bookingService.getAvailability(doctorId, bookingDetails.date);
                setAvailableSlots(avail.availability || []);
                setBookingError('');
                // If chosen time becomes unavailable, notify and clear it
                if (bookingDetails.time) {
                    const thisSlot = avail.availability?.find(s => s.time === bookingDetails.time);
                    if (thisSlot && !thisSlot.available) {
                        setBookingError('Selected time is no longer available. Please choose another.');
                        setBookingDetails(prev => ({ ...prev, time: '' }));
                    }
                }
            } catch (e) {
                console.error('Error loading slots:', e);
            } finally {
                setLoadingSlots(false);
            }
        })();
    }, [showBookingModal, bookingDoctor, bookingDetails.date]);

    // Fetch user's appointments when modal opens
    useEffect(() => {
        (async () => {
            if (!showMyAppointments) {
                console.log('❌ Appointments modal not open');
                return;
            }
            if (!currentUser?.email) {
                console.log('❌ No user email found. User:', currentUser);
                return;
            }
            console.log('📅 Fetching appointments for:', currentUser.email);
            setAppointmentsLoading(true);
            try {
                const data = await bookingService.myBookings(currentUser.email);
                console.log('📅 Received appointments:', data);
                setMyAppointments(data.bookings || []);
            } catch (err) {
                console.error('❌ Failed to load appointments:', err);
            } finally {
                setAppointmentsLoading(false);
            }
        })();
    }, [showMyAppointments, currentUser?.email]);

    // Track initialization to prevent multiple setups
    const authInitializedRef = useRef(false);
    const authSubscriptionRef = useRef(null);

    // Initialize Free Maps Service
    useEffect(() => {
        const initializeMaps = async () => {
            try {
                await freeMapsService.initialize();
                console.log('🗺️ Free Maps service initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize maps service:', error);
            }
        };
        initializeMaps();
    }, []);

    // Image enlargement functions
    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
        setImageZoom(1);
        setImagePosition({ x: 0, y: 0 });
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
        setImageZoom(1);
        setImagePosition({ x: 0, y: 0 });
    };

    const handleImageWheel = (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        setImageZoom(prev => Math.max(0.5, Math.min(3, prev * zoomFactor)));
    };

    const handleImageMouseDown = (e) => {
        if (imageZoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - imagePosition.x,
                y: e.clientY - imagePosition.y
            });
        }
    };

    const handleImageMouseMove = (e) => {
        if (isDragging) {
            setImagePosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleImageMouseUp = () => {
        setIsDragging(false);
    };

    // Enhanced emergency click handler with Free Maps
    const handleEmergencyClick = async () => {
        try {
            const position = await freeMapsService.getCurrentLocation();

            const reverseGeocodeResult = await freeMapsService.reverseGeocode(
                position.lat,
                position.lng
            );

            const locationText = reverseGeocodeResult.address;
            const coordinatesText = `Coordinates: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
            const fullLocationText = `${locationText} (${coordinatesText})`;

            const { error } = await supabase
                .from('messages')
                .insert([
                    {
                        user_id: currentUser.id,
                        text: `🚨 EMERGENCY ALERT - Need immediate medical assistance! Location: ${fullLocationText}`,
                        location: {
                            latitude: position.lat,
                            longitude: position.lng,
                            accuracy: position.accuracy,
                            text: fullLocationText
                        },
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error('Error sending emergency alert:', error);
                alert(`🚨 Emergency alert sent locally! Exact location: ${fullLocationText}`);
            } else {
                alert(`🚨 Emergency alert sent! Exact location: ${fullLocationText}`);
            }
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Emergency alert sent without location!');
        }
    };

    // Show doctors on map
    const handleShowMap = async (doctors = null) => {
        setMapLoading(true);
        try {
            const doctorsToShow = doctors || doctorMatches;
            
            if (doctorsToShow && doctorsToShow.length > 0) {
                setMapProviders(doctorsToShow);
                
                // Calculate center from all valid coordinates
                const doctorsWithCoords = doctorsToShow.filter(d => 
                    d.coordinates && 
                    d.coordinates.lat && 
                    d.coordinates.lng &&
                    !isNaN(d.coordinates.lat) &&
                    !isNaN(d.coordinates.lng)
                );
                
                if (doctorsWithCoords.length > 0) {
                    // Calculate average center from all doctor coordinates
                    const avgLat = doctorsWithCoords.reduce((sum, d) => sum + d.coordinates.lat, 0) / doctorsWithCoords.length;
                    const avgLng = doctorsWithCoords.reduce((sum, d) => sum + d.coordinates.lng, 0) / doctorsWithCoords.length;
                    setMapCenter([avgLat, avgLng]);
                    console.log(`📍 Map center calculated from ${doctorsWithCoords.length} doctors: [${avgLat.toFixed(6)}, ${avgLng.toFixed(6)}]`);
                } else if (doctorsToShow[0]?.coordinates) {
                    // Fallback to first doctor's coordinates
                    setMapCenter([doctorsToShow[0].coordinates.lat, doctorsToShow[0].coordinates.lng]);
                    console.log(`📍 Map center set to first doctor: [${doctorsToShow[0].coordinates.lat}, ${doctorsToShow[0].coordinates.lng}]`);
                }
            }
            
            setShowMap(true);
        } catch (error) {
            console.error('Error showing map:', error);
            setAuthError('Unable to load map. Please try again.');
        } finally {
            setMapLoading(false);
        }
    };

    // AI Diagnostic Think Tank Functions
    const handleAISendMessage = async () => {
        if (!aiInput.trim() || isAILoading) return;

        const userMessage = {
            id: uuidv4(),
            type: 'user',
            content: aiInput,
            timestamp: new Date().toISOString()
        };

        setAiMessages(prev => [...prev, userMessage]);
        setAiInput('');
        setIsAILoading(true);

        try {
            const result = await getAIDiagnosis(aiInput, patientInfo);

            if (result.success) {
                const aiMessage = {
                    id: uuidv4(),
                    type: 'ai',
                    content: result.response,
                    success: true,
                    timestamp: new Date().toISOString(),
                    fallback: result.fallback || false,
                    model: result.model
                };
                setAiMessages(prev => [...prev, aiMessage]);
            } else {
                const errorMessage = {
                    id: uuidv4(),
                    type: 'ai',
                    content: 'Sorry, I encountered an error. Please try again.',
                    success: false,
                    timestamp: new Date().toISOString(),
                    fallback: true
                };
                setAiMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('AI Service Error:', error);
            const errorMessage = {
                id: uuidv4(),
                type: 'ai',
                content: 'Sorry, I encountered an error. Please try again.',
                success: false,
                timestamp: new Date().toISOString(),
                fallback: true
            };
            setAiMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAILoading(false);
        }
    };

    const clearAIChat = () => {
        setAiMessages([]);
        setPatientInfo({
            age: '',
            gender: '',
            symptoms: '', // ADD THIS
            medicalHistory: '',
            duration: '',
            severity: ''
        });
    };

    const loadSampleCase = () => {
        const sampleMessage = "45-year-old male presents with acute chest pain radiating to left arm, diaphoresis, and shortness of breath for 2 hours. History of hypertension and smoking.";
        setAiInput(sampleMessage);
        setPatientInfo({
            age: '45',
            gender: 'male',
            symptoms: 'acute chest pain radiating to left arm, diaphoresis, and shortness of breath', // NEW
            medicalHistory: 'hypertension and smoking',
            duration: '2 hours',
            severity: 'acute'
        });
    };

    // Get Specialty Recommendation from Gemini AI
    const getSpecialtyRecommendation = async () => {
        if (!matchCriteria.symptoms.trim()) {
            setAuthError('Please describe your symptoms');
            return null;
        }

        setSpecialtyLoading(true);
        try {
            console.log('🤖 Getting specialty recommendation from Gemini AI...');
            
            // Use the matchSymptomsToSpecialty function from precisionConsultMatchService
            const specialtyResult = await matchSymptomsToSpecialty(
                matchCriteria.symptoms,
                {
                    age: matchCriteria.age,
                    gender: matchCriteria.gender,
                    medicalHistory: matchCriteria.condition
                }
            );

            if (specialtyResult.success && specialtyResult.specialty) {
                const recommendation = {
                    success: true,
                    recommendedSpecialty: specialtyResult.specialty,
                    confidence: specialtyResult.confidence || 'high',
                    usedAI: !specialtyResult.fallback,
                    rationale: specialtyResult.fallback 
                        ? 'Based on keyword matching' 
                        : 'Analyzed by Gemini AI based on your symptoms',
                    model: specialtyResult.model || 'gemini',
                    rawAIResponse: specialtyResult.rawAIResponse
                };
                
                setRecommendedSpecialty(recommendation);
                console.log('✅ Gemini AI Recommended Specialty:', recommendation.recommendedSpecialty);
                console.log('📊 Confidence:', recommendation.confidence);
                console.log('🤖 Used AI:', recommendation.usedAI);
                
                return recommendation;
            } else {
                throw new Error(specialtyResult.error || 'Failed to get specialty recommendation');
            }
        } catch (error) {
            console.error('Error getting specialty recommendation from Gemini:', error);
            setAuthError('Could not get AI specialty recommendation. Using fallback matching.');
            
            // Return a fallback recommendation
            const fallback = {
                success: false,
                recommendedSpecialty: 'FAMILY PRACTICE',
                confidence: 'low',
                usedAI: false,
                rationale: 'Using default specialty due to AI service unavailability',
                error: error.message
            };
            setRecommendedSpecialty(fallback);
            return fallback;
        } finally {
            setSpecialtyLoading(false);
        }
    };

    // Enhanced Precision Consult Match with Free Maps
    const handlePrecisionMatch = async () => {
        if (!matchCriteria.symptoms.trim()) {
            setAuthError('Please describe your symptoms');
            return;
        }

        // Step 1: Get specialty recommendation from Gemini AI and show it to patient
        console.log('🤖 Step 1: Getting specialty recommendation from Gemini AI...');
        const specialtyRecommendation = await getSpecialtyRecommendation();
        
        if (!specialtyRecommendation) {
            setAuthError('Could not get specialty recommendation. Please try again.');
            return;
        }

        // Step 2: Use the recommended specialty to find doctors from CSV
        // OPTIMIZED: Removed 500ms delay for faster response
        console.log('🔍 Step 2: Finding doctors with specialty:', specialtyRecommendation.recommendedSpecialty);
        
        // IMPROVED: Better location processing
        let processedLocation = matchCriteria.location || '';

        // If location is in "City, State" format, ensure it's properly formatted
        if (processedLocation.includes(',')) {
            const parts = processedLocation.split(',').map(part => part.trim());
            
            // Validate state format (should be 2 letters)
            if (parts.length > 1 && parts[1].length !== 2) {
                setAuthError('State must be a 2-letter abbreviation (e.g., VA, CA, NY). Please use format: City, ST');
                setMatchLoading(false);
                return;
            }
            
            processedLocation = parts.join(', ');
        }

        const criteriaWithLocation = {
            ...matchCriteria,
            location: processedLocation,
            specialty: specialtyRecommendation.recommendedSpecialty // Use Gemini's recommended specialty
        };

        setMatchLoading(true);
        try {
            console.log('🔍 Searching for doctors with specialty:', criteriaWithLocation.specialty);
            const result = await findMatchingDoctors(criteriaWithLocation, matchCriteria.symptoms);

            if (result.success && result.matches) {
                // Limit to top 10 doctors
                const top10Doctors = result.matches.slice(0, 10);
                setDoctorMatches(top10Doctors);
                
                // Calculate map center from all valid doctor coordinates
                const doctorsWithCoords = top10Doctors.filter(d => 
                    d.coordinates && 
                    d.coordinates.lat && 
                    d.coordinates.lng &&
                    !isNaN(d.coordinates.lat) &&
                    !isNaN(d.coordinates.lng)
                );
                
                if (doctorsWithCoords.length > 0) {
                    // Calculate average center from all doctor coordinates
                    const avgLat = doctorsWithCoords.reduce((sum, d) => sum + d.coordinates.lat, 0) / doctorsWithCoords.length;
                    const avgLng = doctorsWithCoords.reduce((sum, d) => sum + d.coordinates.lng, 0) / doctorsWithCoords.length;
                    setMapCenter([avgLat, avgLng]);
                    console.log(`📍 Map center set to average of ${doctorsWithCoords.length} doctors: [${avgLat.toFixed(6)}, ${avgLng.toFixed(6)}]`);
                } else if (top10Doctors.length > 0 && top10Doctors[0].coordinates) {
                    // Fallback to first doctor's coordinates
                    setMapCenter([top10Doctors[0].coordinates.lat, top10Doctors[0].coordinates.lng]);
                    console.log(`📍 Map center set to first doctor: [${top10Doctors[0].coordinates.lat}, ${top10Doctors[0].coordinates.lng}]`);
                } else if (processedLocation) {
                    // If no valid coordinates, the map component will geocode the search location
                    console.log(`📍 No valid doctor coordinates, map will geocode search location: ${processedLocation}`);
                }
                
                // Also store specialty match information for display
                setSpecialtyMatch({
                    recommendedSpecialty: specialtyRecommendation.recommendedSpecialty,
                    confidence: specialtyRecommendation.confidence,
                    usedAI: specialtyRecommendation.usedAI
                });
                
                console.log(`✅ Found ${top10Doctors.length} doctors with specialty: ${specialtyRecommendation.recommendedSpecialty}`);
                console.log('📍 Doctor coordinates (DETAILED LOG):', top10Doctors.map(d => ({
                    name: d.name,
                    address: d.address,
                    location: d.location,
                    city: d.location?.split(',')[0] || 'unknown',
                    state: d.location?.split(',')[1]?.trim() || 'unknown',
                    coordinates: d.coordinates,
                    coordLat: d.coordinates?.lat,
                    coordLng: d.coordinates?.lng,
                    isFairfax: d.coordinates?.lat === 38.8462 && d.coordinates?.lng === -77.3064
                })));
                
                // Check if all coordinates are Fairfax (this would be a bug)
                const allFairfax = top10Doctors.every(d => 
                    d.coordinates?.lat === 38.8462 && d.coordinates?.lng === -77.3064
                );
                if (allFairfax && top10Doctors.length > 0) {
                    console.error('⚠️⚠️⚠️ WARNING: All doctors have Fairfax coordinates! This indicates a geocoding bug.');
                    console.error('First doctor details:', {
                        name: top10Doctors[0].name,
                        address: top10Doctors[0].address,
                        location: top10Doctors[0].location,
                        coordinates: top10Doctors[0].coordinates
                    });
                }
            } else {
                setAuthError(result.error || 'No doctors found for the recommended specialty. Please try different search criteria.');
                setDoctorMatches([]);
            }
        } catch (error) {
            console.error('Error finding doctors:', error);
            setAuthError('An error occurred while searching for doctors. Please try again.');
            setDoctorMatches([]);
        } finally {
            setMatchLoading(false);
        }
    };

    // Test AI Connection
    const handleTestAIConnection = async () => {
        console.log('🧪 Testing AI Connection...');
        const result = await testAIConnection();
        alert(`AI Test Result: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.error || result.response}`);
    };

    // Test Precision Match Service
    const handleTestPrecisionMatch = async () => {
        console.log('🧪 Testing Precision Match Service...');
        const result = await testPrecisionMatchService();
        alert(`Precision Match Test Result: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.error || 'Check console for details'}`);
    };

    // Test Free Maps Service
    const handleTestMaps = async () => {
        console.log('🗺️ Testing Free Maps Service...');
        try {
            const location = await freeMapsService.geocodeLocation('New York, NY');
            alert(`Maps Test: SUCCESS\nLocation: ${location.address}\nCoordinates: ${location.lat}, ${location.lng}`);
        } catch (error) {
            alert(`Maps Test: FAILED\nError: ${error.message}`);
        }
    };

    // Test CMS API Service
    const handleTestCMS = async () => {
        console.log('🏥 Testing CMS API Service...');
        try {
            const testCriteria = {
                symptoms: 'sore throat',
                location: 'Fairfax, VA'
            };
            const doctors = await cmsApiService.findRealDoctors(testCriteria, 'sore throat');
            alert(`CMS API Test: ${doctors.length > 0 ? 'SUCCESS' : 'FALLBACK'}\nFound ${doctors.length} doctors\nUsing: ${doctors[0]?.isReal ? 'Real CMS Data' : 'Enhanced Fallback'}`);
        } catch (error) {
            alert(`CMS API Test: FAILED\nError: ${error.message}`);
        }
    };

    // Comprehensive Google AI API Test
    const testGoogleAIComplete = async () => {
        console.clear();
        console.log('🔬 TESTING NEW GOOGLE GENAI SDK');

        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

        // Test 1: Basic API key validation
        console.log('\n1. 🔑 API KEY VALIDATION:');
        console.log('   - Exists:', !!API_KEY);
        console.log('   - Length:', API_KEY?.length || 0);
        console.log('   - Format:', API_KEY?.startsWith('AIza') ? 'Valid' : 'Invalid');
        console.log('   - Preview:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'None');

        if (!API_KEY || !API_KEY.startsWith('AIza')) {
            alert('❌ API Key Issue');
            return;
        }

        // Test 2: Test with new Google GenAI SDK
        console.log('\n2. 🌐 GOOGLE GENAI SDK TESTING:');

        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const ai = new GoogleGenerativeAI(API_KEY);

            const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

            for (const modelName of models) {
                try {
                    console.log(`   Testing: ${modelName}...`);

                    // Use same API as backend: getGenerativeModel() then generateContent()
                    const model = ai.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent("Respond with 'SUCCESS' if working.");
                    const responseText = result.response.text();

                    console.log(`   ✅ ${modelName}: WORKS! Response: "${responseText}"`);
                    alert(`🎉 GOOGLE GENAI SDK SUCCESS!\n\nModel: ${modelName}\nResponse: ${responseText}\n\nYour AI service is working!`);
                    return;

                } catch (error) {
                    console.log(`   ❌ ${modelName}: Failed - ${error.message}`);
                }
            }

            alert('❌ All models failed with Google GenAI SDK');
        } catch (error) {
            console.error('💥 Google GenAI SDK initialization failed:', error);
            alert('❌ Google GenAI SDK failed to load');
        }
    };

    // Environment check function
    const checkEnvironment = () => {
        const envStatus = testEnvironment();
        alert(`Environment Status:\n\nGemini API: ${envStatus.geminiApiKey ? '✅ Set' : '❌ Missing'}\nSupabase URL: ${envStatus.supabaseUrl ? '✅ Set' : '❌ Missing'}\nSupabase Key: ${envStatus.supabaseKey ? '✅ Set' : '❌ Missing'}\nAPI Key Valid: ${envStatus.apiKeyValid ? '✅ Yes' : '❌ No'}`);
    };

    // Initialize cache buster
    useEffect(() => {
        if (!sessionStorage.getItem('avatar_cache_buster')) {
            sessionStorage.setItem('avatar_cache_buster', Date.now().toString());
        }
    }, []);

    // Apply user preferences
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', userPreferences.primaryColor);
        root.style.setProperty('--secondary-color', userPreferences.secondaryColor);
        root.style.setProperty('--background-color', userPreferences.backgroundColor);
        root.style.setProperty('--text-color', userPreferences.textColor);
        root.style.setProperty('--font-size', userPreferences.fontSize);
        root.style.setProperty('--font-family', userPreferences.fontFamily);
        root.style.setProperty('--border-radius', userPreferences.borderRadius);
    }, [userPreferences]);

    // Sync auth form with user data
    useEffect(() => {
        if (currentUser && !currentUser.anonymous) {
            console.log('🔄 Setting auth form with user data:', {
                username: currentUser.username,
                email: currentUser.email,
                avatar_url: currentUser.avatar_url
            });

            const displayUsername = currentUser.username ||
                currentUser.user_metadata?.username ||
                currentUser.email?.split('@')[0] ||
                '';

            setAuthForm(prev => ({
                ...prev,
                username: displayUsername,
                email: currentUser.email || ''
            }));

            setAvatarLoadError(false);
            console.log('✅ Auth form set with username:', displayUsername);
        }
    }, [currentUser]);

    // Handle avatar URL changes
    useEffect(() => {
        if (currentUser?.avatar_url) {
            console.log('🎯 Avatar URL changed, forcing refresh:', currentUser.avatar_url);
            setAvatarKey(Date.now());
            setAvatarLoadError(false);
            const cacheBustedUrl = getCacheBustedUrl(currentUser.avatar_url);
            setAvatarPreview(cacheBustedUrl);
        } else {
            setAvatarPreview(null);
        }
    }, [currentUser?.avatar_url]);

    // Handle closing dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load user preferences
    useEffect(() => {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
            try {
                const parsedPreferences = JSON.parse(savedPreferences);
                setUserPreferences(parsedPreferences);
                setTempPreferences(parsedPreferences);
            } catch (error) {
                console.error('Error parsing saved preferences:', error);
            }
        }
    }, []);

    // Check Supabase configuration
    useEffect(() => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey ||
            supabaseUrl.includes('your-project-ref') ||
            supabaseKey.includes('your-anon-key-here')) {
            setSupabaseConfigured(false);
            console.warn('Supabase not configured. Some features will be limited.');
        }
    }, []);

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => {
            const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50;
            setIsBottom(bottom);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    if(entry.target.classList.contains('stagger')) {
                        entry.target.style.animationDelay = `${entry.target.dataset.delay * 0.2}s`;
                    }
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Single authentication initialization
    useEffect(() => {
        if (authInitializedRef.current) {
            console.log('🚫 Auth already initialized, skipping...');
            return;
        }

        authInitializedRef.current = true;
        let mounted = true;

        console.log('🔐 INITIALIZING AUTHENTICATION (SINGLE TIME)...');

        const initializeAuth = async () => {
            if (!mounted) return;

            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    if (mounted) createAnonymousUser();
                    return;
                }

                if (session?.user) {
                    console.log('👤 User session found:', session.user.id);
                    // Set basic user first
                    const basicUser = {
                        ...session.user,
                        username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user'
                    };

                    if (mounted) {
                        setCurrentUser(basicUser);
                    }

                    // Then fetch complete profile
                    await fetchUserProfile(session.user.id);
                } else {
                    console.log('No session found, creating anonymous user');
                    if (mounted) createAnonymousUser();
                }
            } catch (error) {
                console.error('Error in auth initialization:', error);
                if (mounted) createAnonymousUser();
            }
        };

        initializeAuth();

        // Set up auth state change listener - ONLY ONCE
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                console.log('🔄 Auth state changed:', event);

                try {
                    if (event === 'SIGNED_IN' && session) {
                        console.log('✅ User signed in:', session.user.id);

                        // Set basic user first
                        const basicUser = {
                            ...session.user,
                            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user'
                        };
                        setCurrentUser(basicUser);

                        // Then fetch complete profile
                        await fetchUserProfile(session.user.id);
                    } else if (event === 'SIGNED_OUT') {
                        console.log('🚪 User signed out');
                        setCurrentUser(null);
                        createAnonymousUser();
                    } else if (event === 'USER_UPDATED' && session) {
                        console.log('📝 User updated, refreshing profile...');
                        await fetchUserProfile(session.user.id);
                    }
                } catch (error) {
                    console.error('❌ Error in auth state change:', error);
                }
            }
        );

        authSubscriptionRef.current = subscription;

        return () => {
            console.log('🧹 Cleaning up auth subscription');
            mounted = false;
            if (authSubscriptionRef.current) {
                authSubscriptionRef.current.unsubscribe();
            }
        };
    }, []); // Empty dependency array - run only once

    // Messages subscription
    useEffect(() => {
        if (currentUser && !currentUser.anonymous) {
            fetchMessages();

            try {
                const subscription = supabase
                    .channel('messages')
                    .on('postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'messages' },
                        (payload) => {
                            setMessages(prev => {
                                // Prevent duplicate messages (if already present)
                                if (!prev || prev.findIndex(m => m.id === payload.new.id) === -1) {
                                    return [...(prev || []), payload.new];
                                }
                                return prev;
                            });
                        }
                    )
                    .subscribe();

                return () => {
                    subscription.unsubscribe();
                };
            } catch (error) {
                console.error('Error setting up real-time subscription:', error);
            }
        }
    }, [currentUser]);

    const createAnonymousUser = async () => {
        let userId = localStorage.getItem('mediconnect_anonymous_id');
        if (!userId) {
            userId = uuidv4();
            localStorage.setItem('mediconnect_anonymous_id', userId);
        }
        setCurrentUser({ id: userId, anonymous: true });
    };

    // User profile fetching
    const fetchUserProfile = async (userId) => {
        try {
            console.log('🔄 Fetching user profile for:', userId);

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('❌ Error fetching user profile:', error);
                if (error.code === 'PGRST116') {
                    console.log('User profile not found, creating new profile...');
                    await createUserProfile(userId);
                    return await fetchUserProfile(userId);
                }
                return null;
            } else if (data) {
                console.log('✅ User profile fetched:', data);

                // Get current auth session
                const { data: { session } } = await supabase.auth.getSession();
                const authUser = session?.user;

                // Create complete user object
                const completeUser = {
                    ...authUser,
                    ...data,
                    id: userId,
                    username: data.username ||
                        authUser?.user_metadata?.username ||
                        authUser?.email?.split('@')[0] ||
                        'user',
                    email: data.email || authUser?.email,
                    avatar_url: data.avatar_url,
                    user_metadata: authUser?.user_metadata
                };

                console.log('👤 Complete user object created:', {
                    id: completeUser.id,
                    username: completeUser.username,
                    email: completeUser.email,
                    avatar_url: completeUser.avatar_url
                });

                // Update current user state
                setCurrentUser(completeUser);

                // Update auth form
                setAuthForm(prev => ({
                    ...prev,
                    username: completeUser.username || '',
                    email: completeUser.email || ''
                }));

                console.log('✅ Profile fully loaded - Username:', completeUser.username, 'Avatar:', completeUser.avatar_url);
                return completeUser;
            }
        } catch (error) {
            console.error('❌ Error in fetchUserProfile:', error);
            return null;
        }
    };

    const createUserProfile = async (userId) => {
        try {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                console.error('Error getting user:', authError);
                return;
            }

            const username = authUser?.user_metadata?.username || authUser?.email?.split('@')[0] || 'user';

            const { error } = await supabase
                .from('users')
                .insert([
                    {
                        id: userId,
                        username: username,
                        email: authUser?.email,
                        avatar_url: null,
                        preferences: defaultPreferences,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error('Error creating user profile:', error);
            } else {
                console.log('✅ User profile created with username:', username);
                await fetchUserProfile(userId);
            }
        } catch (error) {
            console.error('Error in createUserProfile:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          *,
          user:users(username, avatar_url)
        `)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                setMessages(data || []);
            }
        } catch (error) {
            console.error('Error in fetchMessages:', error);
        }
    };

    // Force refresh user data
    const refreshUserData = async () => {
        if (currentUser && !currentUser.anonymous) {
            console.log('🔄 Manually refreshing user data...');
            await fetchUserProfile(currentUser.id);
        }
    };

    // Enhanced message sending with Free Maps
    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedImage) return;

        if (!supabaseConfigured) {
            setAuthError('Chat feature unavailable. Please configure Supabase first.');
            return;
        }

        setIsUploading(true);
        let imageUrl = null;

        if (selectedImage) {
            try {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('message-images')
                    .upload(fileName, selectedImage);

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    setIsUploading(false);
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('message-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            } catch (error) {
                console.error('Error in image upload:', error);
                setIsUploading(false);
                return;
            }
        }

        let location = null;
        let locationText = 'Location not available';

        try {
            const position = await freeMapsService.getCurrentLocation();
            const reverseGeocodeResult = await freeMapsService.reverseGeocode(
                position.lat,
                position.lng
            );

            locationText = reverseGeocodeResult.address;
            const coordinatesText = `Coordinates: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
            const fullLocationText = `${locationText} (${coordinatesText})`;

            location = {
                latitude: position.lat,
                longitude: position.lng,
                accuracy: position.accuracy,
                text: fullLocationText
            };

        } catch (error) {
            console.log('Location access not available or denied');
        }

        try {
            // Request the inserted row back by chaining .select()
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        text: newMessage,
                        image_url: imageUrl,
                        location: location,
                        user_id: currentUser.id,
                        created_at: new Date().toISOString()
                    }
                ])
                .select(`*, user:users(username, avatar_url)`);

            if (error) {
                console.error('Error sending message:', error);
            } else if (data && data.length > 0) {
                // Append the newly inserted message to local state so the UI updates immediately
                setMessages(prev => {
                    if (!prev || prev.findIndex(m => m.id === data[0].id) === -1) {
                        return [...(prev || []), data[0]];
                    }
                    return prev;
                });
                setNewMessage('');
                setSelectedImage(null);
            } else {
                // If Supabase returned no row (e.g., mock client), create a local fallback message so UI updates
                const localMsg = {
                    id: `local-${uuidv4()}`,
                    text: newMessage,
                    image_url: imageUrl,
                    location: location,
                    user_id: currentUser.id,
                    created_at: new Date().toISOString(),
                    user: {
                        username: currentUser.username || currentUser.user_metadata?.username || 'User',
                        avatar_url: currentUser.avatar_url || null
                    }
                };
                setMessages(prev => [...(prev || []), localMsg]);
                setNewMessage('');
                setSelectedImage(null);
            }
        } catch (error) {
            console.error('Error in send message:', error);
        }

        setIsUploading(false);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
    };

    const handleSavePreferences = async () => {
        localStorage.setItem('userPreferences', JSON.stringify(tempPreferences));
        setUserPreferences(tempPreferences);

        if (currentUser && !currentUser.anonymous) {
            try {
                const { error } = await supabase
                    .from('users')
                    .update({ preferences: tempPreferences })
                    .eq('id', currentUser.id);

                if (error) {
                    console.error('Error saving preferences:', error);
                } else {
                    setAuthSuccess('Preferences saved successfully!');
                    setTimeout(() => setAuthSuccess(''), 3000);
                }
            } catch (error) {
                console.error('Error saving preferences:', error);
            }
        }

        setShowSettings(false);
    };

    const handleResetPreferences = () => {
        setTempPreferences(defaultPreferences);
    };

    const handleRating = (author, rating) => {
        setUserRatings(prev => ({
            ...prev,
            [author]: rating
        }));
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setAvatarLoadError(false);
        }
    };

    const removeAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarLoadError(false);
    };

    const forceRefreshAvatar = () => {
        console.log('🔄 Force refreshing avatar...');
        setAvatarKey(Date.now());
        setAvatarLoadError(false);
        sessionStorage.setItem('avatar_cache_buster', Date.now().toString());
        if (currentUser?.avatar_url) {
            const newUrl = getCacheBustedUrl(currentUser.avatar_url);
            setAvatarPreview(newUrl);
        }
    };

    // Authentication handler
    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');

        if (!supabaseConfigured) {
            setAuthError('Supabase not configured. Please set up your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
            return;
        }

        if (authMode === 'register') {
            if (authForm.password !== authForm.confirmPassword) {
                setAuthError('Passwords do not match');
                return;
            }

            if (authForm.password.length < 6) {
                setAuthError('Password must be at least 6 characters long');
                return;
            }

            try {
                const { data, error } = await supabase.auth.signUp({
                    email: authForm.email,
                    password: authForm.password,
                    options: {
                        data: {
                            username: authForm.username
                        }
                    }
                });

                if (error) {
                    setAuthError(error.message);
                } else if (data.user) {
                    console.log('✅ USER CREATED:', data.user);

                    try {
                        const { error: profileError } = await supabase
                            .from('users')
                            .insert([
                                {
                                    id: data.user.id,
                                    username: authForm.username,
                                    email: authForm.email,
                                    avatar_url: null,
                                    preferences: defaultPreferences,
                                    created_at: new Date().toISOString()
                                }
                            ]);

                        if (profileError) {
                            console.error('❌ Profile creation failed:', profileError);
                            setAuthSuccess('Account created! Please sign in to complete profile setup.');
                        } else {
                            console.log('✅ User profile created with username:', authForm.username);
                            setAuthSuccess('Account created successfully! Please check your email for verification.');
                        }
                    } catch (profileError) {
                        console.error('❌ Profile creation error:', profileError);
                        setAuthSuccess('Account created! Some features may be limited until you sign in.');
                    }

                    setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
                    setAvatarFile(null);
                    setAvatarPreview(null);

                    setTimeout(() => {
                        setShowAuthModal(false);
                    }, 3000);
                }
            } catch (error) {
                console.error('Authentication error:', error);
                setAuthError('Authentication service unavailable. Please try again later.');
            }
        } else {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authForm.email,
                    password: authForm.password
                });

                if (error) {
                    setAuthError(error.message);
                } else {
                    setShowAuthModal(false);
                    setAuthForm({ username: '', email: '', password: '', confirmPassword: '' });
                    setAuthSuccess('Login successful!');
                    setTimeout(() => {
                        setAuthSuccess('');
                    }, 3000);
                }
            } catch (error) {
                console.error('Login error:', error);
                setAuthError('Login service unavailable. Please try again later.');
            }
        }
    };

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error.message);
                setAuthError('Error signing out: ' + error.message);
            } else {
                setCurrentUser(null);
                setIsUserMenuOpen(false);
                setAuthSuccess('You have been signed out successfully.');
                createAnonymousUser();
                setTimeout(() => {
                    setAuthSuccess('');
                }, 3000);
            }
        } catch (error) {
            console.error('Sign out error:', error);
            setAuthError('Error signing out. Please try again.');
        }
    };

    const debugBackendData = async () => {
        console.group('🔍 DEBUGGING BACKEND DATA');

        // Test 1: Check what specialties exist
        console.log('1. Testing specialties endpoint...');
        try {
            const specialtiesResponse = await fetch('/api/doctors/specialties');
            const specialtiesData = await specialtiesResponse.json();
            console.log('📋 Available specialties:', specialtiesData.specialties?.slice(0, 20));
        } catch (error) {
            console.error('❌ Specialties endpoint failed:', error);
        }

        // Test 2: Search without location
        console.log('2. Testing search without location...');
        try {
            const response = await fetch('/api/doctors/search?limit=5');
            const data = await response.json();
            console.log('🌍 Any doctors found:', data.matches?.length);
            if (data.matches?.length > 0) {
                console.log('👨‍⚕️ Sample doctor:', data.matches[0]);
            }
        } catch (error) {
            console.error('❌ General search failed:', error);
        }

        // Test 3: Search with just state
        console.log('3. Testing search with state only...');
        try {
            const response = await fetch('/api/doctors/search?location=VA&limit=5');
            const data = await response.json();
            console.log('📍 VA doctors found:', data.matches?.length);
            if (data.matches?.length > 0) {
                console.log('👨‍⚕️ VA doctor:', data.matches[0]);
            }
        } catch (error) {
            console.error('❌ State search failed:', error);
        }

        // Test 4: Search with common specialties
        console.log('4. Testing common specialties...');
        const commonSpecialties = ['FAMILY PRACTICE', 'INTERNAL MEDICINE', 'PEDIATRICS', 'DENTISTRY'];
        for (const specialty of commonSpecialties) {
            try {
                const response = await fetch(`/api/doctors/search?specialty=${encodeURIComponent(specialty)}&limit=3`);
                const data = await response.json();
                console.log(`🩺 ${specialty}: ${data.matches?.length} doctors`);
            } catch (error) {
                console.error(`❌ ${specialty} search failed:`, error);
            }
        }

        console.groupEnd();
    };

    // Avatar upload function
    const handleUpdateProfile = async () => {
        if (!currentUser || currentUser.anonymous) {
            setAuthError('You must be logged in to update your profile');
            return;
        }

        console.log('🚀 Starting profile update for user:', currentUser.id);

        try {
            setAuthError('');
            setIsUploading(true);

            const updateData = {};
            let hasChanges = false;

            if (authForm.username && authForm.username.trim() && authForm.username !== currentUser.username) {
                updateData.username = authForm.username.trim();
                hasChanges = true;
                console.log('📝 Username will be updated');
            }

            if (avatarFile) {
                console.log('📤 Starting avatar upload...');

                try {
                    const fileExt = avatarFile.name.split('.').pop();
                    const fileName = `avatar-${currentUser.id}-${Date.now()}.${fileExt}`;

                    console.log('📁 Uploading:', fileName, 'Size:', avatarFile.size);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, avatarFile);

                    if (uploadError) {
                        console.error('❌ UPLOAD FAILED:', uploadError);
                        if (uploadError.message?.includes('bucket')) {
                            setAuthError('Storage bucket "avatars" not found. Create it in Supabase Dashboard -> Storage.');
                        } else if (uploadError.message?.includes('policy') || uploadError.message?.includes('permission')) {
                            setAuthError('Storage permissions issue. Check bucket policies.');
                        } else if (uploadError.message?.includes('JWT')) {
                            setAuthError('Authentication error. Try signing out and in again.');
                        } else {
                            setAuthError(`Upload failed: ${uploadError.message}`);
                        }
                        setIsUploading(false);
                        return;
                    }

                    console.log('✅ Upload successful:', uploadData);

                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    const avatarUrl = urlData.publicUrl;
                    console.log('🔗 Public URL:', avatarUrl);

                    updateData.avatar_url = avatarUrl;
                    hasChanges = true;

                } catch (uploadError) {
                    console.error('💥 Upload exception:', uploadError);
                    setAuthError(uploadError.message || 'Upload failed unexpectedly');
                    setIsUploading(false);
                    return;
                }
            }

            if (hasChanges) {
                console.log('💾 Updating user profile...');

                const { data, error: updateError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', currentUser.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('❌ Profile update failed:', updateError);
                    setAuthError(`Profile update failed: ${updateError.message}`);
                    setIsUploading(false);
                    return;
                }

                console.log('✅ Profile updated:', data);

                // Update local state and force refresh
                setCurrentUser(prev => ({
                    ...prev,
                    ...data,
                    username: data.username || prev.username,
                    avatar_url: data.avatar_url
                }));

                // Force refresh user data
                setTimeout(() => {
                    fetchUserProfile(currentUser.id);
                }, 100);

                setAvatarKey(Date.now());
                setAvatarLoadError(false);
                setAvatarFile(null);
                setAvatarPreview(null);

                setAuthSuccess('Profile updated successfully!');

                setTimeout(() => {
                    setIsUserMenuOpen(false);
                    setAuthSuccess('');
                }, 2000);

            } else {
                setAuthSuccess('No changes to save');
                setTimeout(() => setAuthSuccess(''), 1500);
            }

        } catch (error) {
            console.error('💥 Unexpected error:', error);
            setAuthError('An unexpected error occurred: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const debugStorage = async () => {
        if (!currentUser) {
            alert('Please log in first');
            return;
        }

        console.log('🔍 DEBUGGING STORAGE...');

        try {
            console.log('1. Testing bucket access...');
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
            console.log('Buckets:', buckets);
            console.log('Buckets error:', bucketsError);

            console.log('2. Testing avatars bucket...');
            const { data: files, error: filesError } = await supabase.storage.from('avatars').list();
            console.log('Files in avatars:', files);
            console.log('Files error:', filesError);

            console.log('3. Testing simple upload...');
            const testBlob = new Blob(['test content'], { type: 'text/plain' });
            const testFile = new File([testBlob], `test-${currentUser.id}.txt`);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(testFile.name, testFile);

            console.log('Test upload result:', uploadData);
            console.log('Test upload error:', uploadError);

            if (!uploadError) {
                await supabase.storage.from('avatars').remove([testFile.name]);
                console.log('✅ Storage test PASSED');
                alert('Storage is working correctly!');
            } else {
                console.log('❌ Storage test FAILED:', uploadError);
                alert('Storage test failed: ' + uploadError.message);
            }

        } catch (error) {
            console.error('💥 Debug error:', error);
            alert('Debug failed: ' + error.message);
        }
    };

    const getDisplayUsername = () => {
        if (!currentUser) return 'User';
        return currentUser.username ||
            currentUser.user_metadata?.username ||
            currentUser.email?.split('@')[0] ||
            'User';
    };

    const getAvatarUrl = () => {
        if (!currentUser?.avatar_url) return null;
        return getCacheBustedUrl(currentUser.avatar_url);
    };

    const handleAvatarError = () => {
        console.log('❌ Avatar image failed to load:', currentUser?.avatar_url);
        setAvatarLoadError(true);
    };

    const handleAvatarLoad = () => {
        console.log('✅ Avatar image loaded successfully');
        setAvatarLoadError(false);
    };

    const setupStoragePolicies = async () => {
        if (!currentUser) {
            setAuthError('Please log in first to set up storage');
            return;
        }

        setIsUploading(true);
        setAuthError('');

        try {
            const testBlob = new Blob(['test'], { type: 'text/plain' });
            const testFile = new File([testBlob], `test-${currentUser.id}.txt`);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(testFile.name, testFile);

            if (uploadError && uploadError.message.includes('bucket')) {
                setAuthError('The "avatars" bucket does not exist. Please create it in Supabase Dashboard -> Storage.');
            } else if (uploadError && uploadError.message.includes('policy')) {
                setAuthError('Storage policies are not set. Please run the storage setup SQL in Supabase SQL Editor.');
            } else {
                setAuthSuccess('Storage appears to be working! You can now upload avatars.');
                await supabase.storage.from('avatars').remove([testFile.name]);
            }
        } catch (error) {
            console.error('Storage test error:', error);
            setAuthError('Storage test failed: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const SpecialtyCard = ({ specialty }) => {
        const handleCardClick = (e) => {
            // Don't trigger if clicking on the consultation button
            if (e.target.closest('.consultation-btn')) {
                return;
            }
            setSelectedSpecialtyFor3D(specialty);
            setShowAnatomyViewer(true);
        };

        const handleConsultationClick = (e) => {
            e.stopPropagation();
            // Handle consultation booking logic here
            console.log('Book consultation for:', specialty.name);
        };

        return (
            <div 
                className={`specialty-card specialty-${specialty.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={handleCardClick}
                style={{ cursor: 'pointer' }}
            >
                <div className="specialty-content">
                    <div className={`specialty-icon icon-${specialty.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        {specialty.icon}
                    </div>
                    <h3>{specialty.name}</h3>
                    <p className="specialty-description">{specialty.description}</p>
                    <div className="specialty-cases">
                        {/* FIX: Add safeguard for cases array */}
                        {(specialty.cases || []).map((caseStudy, index) => (
                            <span key={index} className="case-tag">{caseStudy}</span>
                        ))}
                    </div>
                </div>
                <div className="specialty-btn-container">
                    <button 
                        className="specialty-btn consultation-btn"
                        onClick={handleConsultationClick}
                        title="Book Consultation"
                    >
                        Book Consultation
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="app">
            {/* AI Diagnostic Panel */}
            <AIDiagnostic />

            {/* CMS Debug Panel */}
            {showCMSDebug && <CMSDebugPanel />}

            {/* Debug Toggle Icon */}
            <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                style={{
                    position: 'fixed',
                    bottom: showChat ? '590px' : '20px',
                    right: '90px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 9998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                }}
            >
                {showDebugPanel ? '✕' : '🔧'}
            </button>

            {/* Debug Panel */}
            {showDebugPanel && (
                <div style={{
                    position: 'fixed',
                    bottom: showChat ? '650px' : '80px',
                    right: '90px',
                    background: 'rgba(0,0,0,0.95)',
                    color: 'white',
                    padding: '16px',
                    fontSize: '12px',
                    zIndex: 9999,
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    maxWidth: '300px',
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    backdropFilter: 'blur(10px)'
                }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', borderBottom: '2px solid #667eea', paddingBottom: '8px' }}>
                        🔧 Debug Tools
                    </h3>
                    
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #444' }}>
                        <div style={{ fontSize: '11px', marginBottom: '4px' }}>User: {currentUser ? getDisplayUsername() : 'None'}</div>
                        <div style={{ fontSize: '11px', marginBottom: '4px' }}>Avatar: {currentUser?.avatar_url ? 'Yes' : 'No'}</div>
                        <div style={{ fontSize: '11px', marginBottom: '8px' }}>Anonymous: {currentUser?.anonymous ? 'Yes' : 'No'}</div>
                        <button onClick={refreshUserData} style={{ fontSize: '10px', padding: '6px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                            Refresh User Data
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '6px' }}>
                        <button onClick={handleTestAIConnection} style={{ fontSize: '10px', padding: '6px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Test AI Connection
                        </button>
                        <button onClick={handleTestPrecisionMatch} style={{ fontSize: '10px', padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Test Precision Match
                        </button>
                        <button onClick={handleTestMaps} style={{ fontSize: '10px', padding: '6px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Test Free Maps
                        </button>
                        <button onClick={handleTestCMS} style={{ fontSize: '10px', padding: '6px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Test CMS API
                        </button>
                        <button onClick={() => setShowCMSDebug(!showCMSDebug)} style={{ fontSize: '10px', padding: '6px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            {showCMSDebug ? 'Hide' : 'Show'} CMS Debug
                        </button>
                        <button onClick={debugBackendData} style={{ fontSize: '10px', padding: '6px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Debug Backend Data
                        </button>
                        <button onClick={testBackendConnection} style={{ fontSize: '10px', padding: '6px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Test Backend Connection
                        </button>
                        <button onClick={handleTestCSVData} style={{ fontSize: '10px', padding: '6px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Test CSV Data
                        </button>
                        
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #444' }}>
                            <div style={{ fontSize: '10px', marginBottom: '6px', fontWeight: 'bold', color: '#a78bfa' }}>AI Tests:</div>
                            <button onClick={testGoogleAIComplete} style={{ fontSize: '10px', padding: '6px', marginBottom: '4px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                                Test Google AI API
                            </button>
                            <button onClick={checkEnvironment} style={{ fontSize: '10px', padding: '6px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                                Check Environment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Component - Hidden */}
            <div style={{ display: 'none' }}>
                <div>User: {currentUser ? getDisplayUsername() : 'None'}</div>
                <div>Avatar: {currentUser?.avatar_url ? 'Yes' : 'No'}</div>
                <div>Anonymous: {currentUser?.anonymous ? 'Yes' : 'No'}</div>
                <button onClick={refreshUserData} style={{ fontSize: '10px', marginTop: '5px' }}>
                    Refresh
                </button>
                <button onClick={handleTestAIConnection} style={{ fontSize: '10px', marginTop: '5px', display: 'block' }}>
                    Test AI Connection
                </button>
                <button onClick={handleTestPrecisionMatch} style={{ fontSize: '10px', marginTop: '5px', display: 'block' }}>
                    Test Precision Match
                </button>
                <button onClick={handleTestMaps} style={{ fontSize: '10px', marginTop: '5px', display: 'block', background: '#10b981' }}>
                    Test Free Maps
                </button>
                <button onClick={handleTestCMS} style={{ fontSize: '10px', marginTop: '5px', display: 'block', background: '#8b5cf6' }}>
                    Test CMS API
                </button>
                <button onClick={() => setShowCMSDebug(!showCMSDebug)} style={{ fontSize: '10px', marginTop: '5px', display: 'block', background: '#f59e0b' }}>
                    {showCMSDebug ? 'Hide' : 'Show'} CMS Debug
                </button>
                <button onClick={debugBackendData} style={{ fontSize: '10px', marginTop: '5px', display: 'block', background: '#dc2626' }}>
                    Debug Backend Data
                </button>

                <button onClick={testBackendConnection} style={{ fontSize: '10px', marginTop: '5px', display: 'block', background: '#10b981' }}>
                    Test Backend Connection
                </button>

                <button onClick={handleTestCSVData} style={{ fontSize: '10px', marginTop: '5px', display: 'block', background: '#f59e0b' }}>
                    Test CMS CSV Data
                </button>

                {/* New AI Test Buttons */}
                <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                    <div style={{ fontSize: '10px', marginBottom: '5px', fontWeight: 'bold' }}>AI Tests:</div>
                    <button onClick={testGoogleAIComplete} style={{ fontSize: '10px', marginBottom: '3px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer', width: '100%' }}>
                        Test Google AI API
                    </button>
                    <button onClick={checkEnvironment} style={{ fontSize: '10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer', width: '100%' }}>
                        Check Environment
                    </button>
                </div>
            </div>

            {/* Configuration Warning Banner */}
            {!supabaseConfigured && (
                <div className="config-warning-banner">
                    <div className="warning-content">
                        <span>⚠️ Supabase not configured. Some features will be limited. </span>
                        <a href="#setup-instructions" className="setup-link">Click here for setup instructions</a>
                    </div>
                    <button onClick={() => setSupabaseConfigured(true)} className="close-warning">
                        ×
                    </button>
                </div>
            )}

            {/* Setup Instructions Modal */}
            {!supabaseConfigured && (
                <div id="setup-instructions" className="setup-modal">
                    <div className="setup-content">
                        <h2>Supabase Setup Required</h2>
                        <p>To enable all features, please set up Supabase:</p>
                        <ol>
                            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> and create a project</li>
                            <li>Get your URL and API key from Settings → API</li>
                            <li>Create a <code>.env</code> file in your project root:</li>
                        </ol>
                        <pre>
{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
                        </pre>
                        <p>Replace the values with your actual Supabase credentials</p>
                        <button onClick={() => setSupabaseConfigured(true)}>Got it!</button>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {authSuccess && (
                <div className="auth-success-banner">
                    <div className="success-content">
                        <span>✅ {authSuccess}</span>
                    </div>
                    <button onClick={() => setAuthSuccess('')} className="close-success">
                        ×
                    </button>
                </div>
            )}

            <a href="/" className="logo-container hidden">
                <img src="/logo-w1.png" alt="MediConnect" className="logo-img animate-pulse" />
                <span className="logo-text gradient-text">MediConnect</span>
            </a>

            <nav className={`navbar ${isMenuOpen ? 'menu-open' : ''}`}>
                <div className={`nav-content ${isMenuOpen ? 'visible' : ''}`}>
                    <input
                        type="text"
                        className="search-bar glassmorphism-input"
                        placeholder="Search services..."
                    />
                    <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                        <a href="/learning" className="nav-link hover-text-lavender-dark">Learning</a>
                        <a 
                            href="#appointments" 
                            className="nav-link hover-text-lavender-dark"
                            onClick={(e) => {
                                e.preventDefault();
                                console.log('📅 Opening appointments modal...');
                                setShowMyAppointments(true);
                                setIsMenuOpen(false);
                            }}
                            style={{ position: 'relative' }}
                        >
                            Appointments
                            {currentUser?.email && myAppointments.length > 0 && (() => {
                                const upcomingCount = myAppointments.filter(apt => {
                                    const aptDate = new Date(`${apt.date}T${apt.time}`);
                                    return aptDate >= new Date() && apt.status === 'confirmed';
                                }).length;
                                return upcomingCount > 0 ? (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-12px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        border: '2px solid white'
                                    }}>
                                        {upcomingCount}
                                    </span>
                                ) : null;
                            })()}
                        </a>
                        <a href="/emergencies" className="nav-link hover-text-lavender-dark">Emergencies</a>

                        {/* User Authentication in Menu with improved avatar handling */}
                        {currentUser && !currentUser.anonymous ? (
                            <div className="user-menu" ref={userMenuRef}>
                                <button className="user-info-button" onClick={() => setIsUserMenuOpen(prev => !prev)}>
                                    {currentUser.avatar_url && !avatarLoadError ? (
                                        <img
                                            key={avatarKey}
                                            src={getAvatarUrl()}
                                            alt={currentUser.username}
                                            className="user-avatar"
                                            onError={handleAvatarError}
                                            onLoad={handleAvatarLoad}
                                        />
                                    ) : (
                                        <FaUserCircle className="user-avatar-placeholder" />
                                    )}
                                    <span className="user-welcome">Hi, {getDisplayUsername()}</span>
                                    {isUserMenuOpen ? <FaChevronUp /> : <FaChevronDown />}
                                </button>

                                {isUserMenuOpen && (
                                    <div className="user-dropdown-menu">
                                        <h3>Profile Settings</h3>

                                        {/* Add debug section */}
                                        <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                                            <button
                                                onClick={debugStorage}
                                                className="btn btn-sm btn-secondary"
                                                style={{ width: '100%', marginBottom: '5px' }}
                                            >
                                                Test Storage Setup
                                            </button>
                                            <small style={{ color: '#666' }}>
                                                If avatars aren't working, click this to diagnose storage issues.
                                            </small>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="username"><FaUser /> Username</label>
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                value={authForm.username}
                                                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                                                placeholder="Your username"
                                            />
                                            <small>Current: {currentUser.username || 'Not set'}</small>
                                        </div>

                                        <div className="form-group">
                                            <label><FaImage /> Avatar</label>
                                            <div className="avatar-upload-container">
                                                {avatarPreview ? (
                                                    <img
                                                        src={avatarPreview}
                                                        alt="Avatar preview"
                                                        className="avatar-preview"
                                                        onError={handleAvatarError}
                                                    />
                                                ) : currentUser.avatar_url && !avatarLoadError ? (
                                                    <img
                                                        key={`preview-${avatarKey}`}
                                                        src={getAvatarUrl()}
                                                        alt="Current avatar"
                                                        className="avatar-preview"
                                                        onError={handleAvatarError}
                                                        onLoad={handleAvatarLoad}
                                                    />
                                                ) : (
                                                    <div className="avatar-placeholder-large"><FaUserCircle /></div>
                                                )}
                                                <div className="avatar-actions">
                                                    <input
                                                        type="file"
                                                        id="avatar-upload"
                                                        onChange={handleAvatarSelect}
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="avatar-upload" className="btn btn-sm btn-sage">Change</label>
                                                    {(avatarPreview || currentUser.avatar_url) && (
                                                        <button onClick={removeAvatar} className="btn-remove-avatar"><FaTimes /></button>
                                                    )}
                                                </div>
                                            </div>
                                            {avatarFile && (
                                                <small>Selected: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)</small>
                                            )}
                                        </div>

                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpdateProfile}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? 'Updating...' : <><FaSave /> Save Changes</>}
                                        </button>

                                        {authError && (
                                            <div className="auth-error">
                                                {authError}
                                            </div>
                                        )}

                                        <hr className="divider" />
                                        <button className="btn btn-danger" onClick={handleSignOut}>
                                            <FaSignOutAlt /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                className="btn btn-sage"
                                onClick={() => {
                                    setShowAuthModal(true);
                                    setAuthMode('login');
                                    setAuthError('');
                                    setAuthSuccess('');
                                }}
                            >
                                <FaSignInAlt /> Sign In
                            </button>
                        )}
                    </div>
                </div>

                <div
                    className="hamburger-container"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <div className="hamburger">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}
                            />
                        ))}
                    </div>
                    <div className={`hamburger-pulse ${isMenuOpen ? 'animate-ripple' : ''}`} />
                </div>
            </nav>

            <main>
                <div className="massive-logo-wrapper">
                    <img
                        src="/logo-w1.png"
                        alt="MediConnect"
                        className="massive-logo-img animate-float"
                    />
                </div>

                <section className="hero">
                    <div className="hero-content hidden">
                        <div className="hero-text">
                            <h1 className="text-gradient animate-text-reveal">
                                Medical Collaboration & Emergency Platform
                            </h1>
                            <div className="cta-buttons">
                                <button
                                    className="btn btn-lavender hover-scale-105"
                                    onClick={handleEmergencyClick}
                                >
                                    Emergency Alert
                                </button>
                                <button 
                                    className="btn btn-sage hover-scale-105"
                                    onClick={() => setShowPrecisionMatch(true)}
                                >
                                    Book Appointment
                                </button>
                            </div>
                        </div>

                        <div className="hero-image hidden">
                            <div className="gradient-blob animate-blob" />
                            <img
                                src="/collaborate.jpg"
                                alt="Healthcare professionals collaborating"
                                className="floating transition-transform-duration-300 hover-scale-105 hero-image-radius"
                            />
                        </div>

                        <p className="text-sage-800 description-text">
                            Connect with medical experts, access learning resources, and get immediate help when needed.
                        </p>

                        <div className="user-roles">
                            <div className="role-container doctor-container hidden" data-delay="0">
                                <span className="role-badge doctor-badge">Doctors</span>
                                <p className="role-description">Teach and consult</p>
                            </div>

                            <div className="role-container student-container hidden" data-delay="0.2">
                                <span className="role-badge student-badge">Students</span>
                                <p className="role-description">Learn and discuss</p>
                            </div>

                            <div className="role-container resident-container hidden" data-delay="0.4">
                                <span className="role-badge resident-badge">Residents</span>
                                <p className="role-description">Train and mentor</p>
                            </div>

                            <div className="role-container patient-container hidden" data-delay="0.6">
                                <span className="role-badge patient-badge">Patients</span>
                                <p className="role-description">Get care and support</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="features hidden">
                    <div className="feature-buttons">
                        <button className="feature-btn emergency-btn">
                            <div className="btn-content">
                                <span className="audience-tag">For Everyone</span>
                                <h3 className="btn-title">Code Blue Connect</h3>
                                <p className="btn-description">
                                    Instant geolocated SOS broadcasting to verified medical responders
                                    within a 5-mile radius
                                </p>
                                <span className="btn-action-b">
                                    <MdEmergency className="icon" />
                                    Trigger Alert
                                </span>
                            </div>
                        </button>

                        <button
                            className="feature-btn specialist-btn"
                            onClick={() => setShowPrecisionMatch(true)}
                        >
                            <div className="btn-content">
                                <span className="audience-tag">For Patients</span>
                                <h3 className="btn-title">Precision Consult Match</h3>
                                <p className="btn-description">
                                    AI-powered specialist matching with 12 clinical parameters for optimal care
                                </p>
                                <span className="btn-action">
                                    <FaSearch className="icon" />
                                    <FaStethoscope className="icon" />
                                    Find Doctors
                                </span>
                            </div>
                        </button>

                        {/* UPDATED: Clinical Nexus Academy Button with activeFeature state */}
                        <button
                            className="feature-btn learning-btn"
                            onClick={() => {
                                console.log('Opening Clinical Nexus Academy'); // Debug log
                                setActiveFeature('clinical-academy');
                            }}
                        >
                            <div className="btn-content">
                                <span className="audience-tag">Students/Residents</span>
                                <h3 className="btn-title">Clinical Nexus Academy</h3>
                                <p className="btn-description">
                                    Immersive case simulations and peer-to-peer grand rounds
                                </p>
                                <p className="btn-description">Access cases, quizzes, and mentor support</p>
                                <span className="btn-action-a">
                                    <FaBookOpen className="icon" />
                                    Start Learning
                                </span>
                            </div>
                        </button>


                        {/* Updated Diagnostic Think Tank Button with AI */}
                        <button
                            className="feature-btn discussion-btn"
                            onClick={() => setShowAIChat(true)}
                        >
                            <div className="btn-content">
                                <span className="audience-tag">For Doctors</span>
                                <h3 className="btn-title">Diagnostic Think Tank</h3>
                                <p className="btn-description">
                                    AI-powered differential diagnoses with evidence-based insights
                                </p>
                                <span className="btn-action-c">
                                    <FaRobot className="icon" />
                                    AI Consult
                                </span>
                            </div>
                        </button>
                    </div>
                </section>

                <section className="medical-specialties">
                    <div className="container">
                        <h2 className="section-title">
                            <span className="highlight">Multidisciplinary</span> Expertise Network
                        </h2>
                        <p className="section-subtitle">
                            27 specialized fields | 500+ verified practitioners | Avg. 8min response time
                        </p>
                        <div className="specialties-grid">
                            {medicalSpecialties.map((specialty, i) => (
                                <SpecialtyCard
                                    key={specialty.name}
                                    specialty={specialty}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="learning hidden">
                    <h2 className="text-lavender-dark">
                        Medical Learning Hub & Clinical Cognition Engine
                    </h2>
                    <p className="section-description">
                        Transform theoretical knowledge into practical mastery through our
                        <span className="highlight">3D anatomy visualizer</span>,
                        <span className="highlight">live code review simulations</span>, and
                        <span className="highlight">resident mentorship pipelines</span>.
                    </p>
                    <div className="specialty-grid">
                        {medicalSpecialties.map((specialty, i) => (
                            <div
                                key={specialty.name}
                                className="learning-card hidden stagger"
                                data-delay={i * 0.1}
                                onClick={() => {
                                    setSelectedSpecialtyFor3D(specialty);
                                    setShowAnatomyViewer(true);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={`learning-icon icon-${specialty.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {specialty.icon}
                                </div>
                                <h3>{specialty.name}</h3>
                                <div className="learning-resources">
                                    {/* FIX: Add safeguard for cases array */}
                                    {(specialty.cases || []).slice(0, 2).map((resource, index) => (
                                        <span key={index} className="resource-tag">
                                          {resource}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="appointments hidden">
                    <h2 className="text-sage-800">
                        Precision Care Coordination
                    </h2>
                    <p className="section-description">
                        Our <span className="highlight">Smart Match Algorithm</span> analyzes
                        12 clinical parameters to connect patients with ideal specialists,
                        reducing diagnostic odysseys by 68% (2024 clinical trial data).
                    </p>
                    <h2 className="text-sage-800">Book a Specialist</h2>
                    <div className="appointment-form">
                        <select
                            className="specialty-select"
                            onChange={(e) => setActiveSpecialty(medicalSpecialties.find(s => s.name === e.target.value))}
                        >
                            <option value="">Select Specialty</option>
                            {medicalSpecialties.map((specialty) => (
                                <option key={specialty.name} value={specialty.name}>
                                    {specialty.name}
                                </option>
                            ))}
                        </select>
                        {activeSpecialty && (
                            <div className="booking-details">
                                <div className="specialty-header">
                                    <div className={`specialty-icon icon-${activeSpecialty.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {activeSpecialty.icon}
                                    </div>
                                    <h3>{activeSpecialty.name} Consultation</h3>
                                </div>
                                <div className="consultation-info">
                                    {/* FIXED: Added safeguard for cases array */}
                                    <p><strong>Typical Cases:</strong> {(activeSpecialty.cases || []).slice(0, 3).join(', ')}</p>
                                    <p><strong>Average Response Time:</strong> 2-4 hours</p>
                                    <p><strong>Consultation Fee:</strong> $120-250</p>
                                </div>
                                <button 
                                    className="btn btn-lavender"
                                    onClick={() => {
                                        setMatchCriteria(prev => ({
                                            ...prev,
                                            specialty: activeSpecialty.name
                                        }));
                                        setShowPrecisionMatch(true);
                                    }}
                                >
                                    Find Doctors
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <section className="testimonials hidden">
                    <h2>Voices of Trust</h2>
                    <p className="section-subtitle hidden">
                        Join 3,000+ medical professionals revolutionizing care
                    </p>

                    <div className="testimonial-carousel">
                        {testimonials.map((testimonial, i) => {
                            const userRating = userRatings[testimonial.author] || testimonial.rating;

                            return (
                                <div
                                    key={i}
                                    className="testimonial-card hidden stagger"
                                    data-delay={i * 0.2}
                                >
                                    <div className="testimonial-content">
                                        <div
                                            className={`testimonial-avatar ${hoveredAvatar === testimonial.author ? 'avatar-hover' : ''}`}
                                            onMouseEnter={() => setHoveredAvatar(testimonial.author)}
                                            onMouseLeave={() => setHoveredAvatar(null)}
                                        >
                                            <img
                                                src={testimonial.avatar}
                                                alt={testimonial.author}
                                                className="avatar-img"
                                            />
                                            {hoveredAvatar === testimonial.author && (
                                                <div className="avatar-tooltip">
                                                    {testimonial.author}
                                                </div>
                                            )}
                                        </div>

                                        <div className="rating-container">
                                            <div className="user-rating">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <FaStar
                                                        key={star}
                                                        className={`rating-star ${star <= userRating ? 'active' : ''}`}
                                                        onClick={() => handleRating(testimonial.author, star)}
                                                    />
                                                ))}
                                            </div>
                                            <span className="rating-text">
                                                {userRating}.0/5.0
                                            </span>
                                        </div>

                                        <p className="testimonial-quote">"{testimonial.quote}"</p>

                                        <div className="author">
                                            <span className={testimonial.badgeClass}>
                                                {testimonial.author}
                                            </span>
                                            <span className="author-role">{testimonial.role}</span>
                                        </div>
                                    </div>

                                    <div className="testimonial-footer">
                                        <button className="btn btn-lavender w-full hover-scale-102 transition-transform">
                                            <FaComments className="mr-2" />
                                            View Full Story
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-8">
                        <button className="btn btn-lavender px-8 py-3 rounded-lg hover-bg-opacity-90
                            transition-all duration-300 transform hover-translate-y-0.5 shadow-lg
                            bg-gradient-to-r from-purple-600 to-blue-500 text-white">
                            <FaComments className="mr-2" />
                            Share Your Story
                        </button>
                    </div>
                </section>
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div className="settings-modal">
                    <div className="settings-content">
                        <button
                            className="close-settings"
                            onClick={() => setShowSettings(false)}
                        >
                            <FaTimes />
                        </button>

                        <h2>Customize Your Experience</h2>

                        <div className="settings-section">
                            <h3><FaUser /> Profile Settings</h3>
                            <div className="input-group">
                                <FaUser className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={authForm.username || currentUser?.username || ''}
                                    onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                                />
                            </div>

                            <div className="avatar-upload-section">
                                <label className="avatar-label">Profile Picture</label>
                                <div className="avatar-preview-container">
                                    {avatarPreview ? (
                                        <div className="avatar-preview">
                                            <img src={avatarPreview} alt="Avatar preview" />
                                            <button type="button" onClick={removeAvatar} className="remove-avatar">
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ) : currentUser?.avatar_url ? (
                                        <div className="avatar-preview">
                                            <img src={currentUser.avatar_url} alt="Current avatar" />
                                        </div>
                                    ) : (
                                        <div className="avatar-placeholder">
                                            <FaUserCircle />
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="avatar-upload-settings" className="avatar-upload-btn">
                                    <FaImage /> Change Image
                                </label>
                                <input
                                    id="avatar-upload-settings"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <button
                                className="btn btn-lavender"
                                onClick={handleUpdateProfile}
                            >
                                Update Profile
                            </button>
                        </div>

                        <div className="settings-section">
                            <h3><FaPalette /> Appearance Settings</h3>

                            <div className="preference-group">
                                <label>Primary Color</label>
                                <input
                                    type="color"
                                    value={tempPreferences.primaryColor}
                                    onChange={(e) => setTempPreferences({...tempPreferences, primaryColor: e.target.value})}
                                />
                            </div>

                            <div className="preference-group">
                                <label>Secondary Color</label>
                                <input
                                    type="color"
                                    value={tempPreferences.secondaryColor}
                                    onChange={(e) => setTempPreferences({...tempPreferences, secondaryColor: e.target.value})}
                                />
                            </div>

                            <div className="preference-group">
                                <label>Background Color</label>
                                <input
                                    type="color"
                                    value={tempPreferences.backgroundColor}
                                    onChange={(e) => setTempPreferences({...tempPreferences, backgroundColor: e.target.value})}
                                />
                            </div>

                            <div className="preference-group">
                                <label>Text Color</label>
                                <input
                                    type="color"
                                    value={tempPreferences.textColor}
                                    onChange={(e) => setTempPreferences({...tempPreferences, textColor: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3><FaFont /> Typography Settings</h3>

                            <div className="preference-group">
                                <label>Font Size</label>
                                <select
                                    value={tempPreferences.fontSize}
                                    onChange={(e) => setTempPreferences({...tempPreferences, fontSize: e.target.value})}
                                >
                                    <option value="14px">Small</option>
                                    <option value="16px">Medium</option>
                                    <option value="18px">Large</option>
                                    <option value="20px">X-Large</option>
                                </select>
                            </div>

                            <div className="preference-group">
                                <label>Font Family</label>
                                <select
                                    value={tempPreferences.fontFamily}
                                    onChange={(e) => setTempPreferences({...tempPreferences, fontFamily: e.target.value})}
                                >
                                    <option value="system-ui, sans-serif">System UI</option>
                                    <option value="'Inter', sans-serif">Inter</option>
                                    <option value="'Roboto', sans-serif">Roboto</option>
                                    <option value="'Open Sans', sans-serif">Open Sans</option>
                                    <option value="'Georgia', serif">Georgia</option>
                                </select>
                            </div>

                            <div className="preference-group">
                                <label>Border Radius</label>
                                <select
                                    value={tempPreferences.borderRadius}
                                    onChange={(e) => setTempPreferences({...tempPreferences, borderRadius: e.target.value})}
                                >
                                    <option value="0px">None</option>
                                    <option value="4px">Small</option>
                                    <option value="8px">Medium</option>
                                    <option value="12px">Large</option>
                                    <option value="16px">X-Large</option>
                                </select>
                            </div>
                        </div>

                        <div className="settings-actions">
                            <button
                                className="btn btn-sage"
                                onClick={handleSavePreferences}
                            >
                                <FaSave /> Save Preferences
                            </button>

                            <button
                                className="btn btn-secondary"
                                onClick={handleResetPreferences}
                            >
                                <FaUndo /> Reset to Default
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="auth-modal">
                    <div className="auth-content">
                        <button
                            className="close-auth"
                            onClick={() => {
                                setShowAuthModal(false);
                                setAuthError('');
                                setAuthSuccess('');
                                setAvatarFile(null);
                                setAvatarPreview(null);
                            }}
                        >
                            <FaTimes />
                        </button>

                        <h2>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>

                        {authError && <div className="auth-error">{authError}</div>}
                        {authSuccess && <div className="auth-success">{authSuccess}</div>}

                        <form onSubmit={handleAuth}>
                            {authMode === 'register' && (
                                <>
                                    <div className="input-group">
                                        <FaUser className="input-icon" />
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={authForm.username}
                                            onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                                            required
                                        />
                                    </div>

                                    {/* Avatar Upload */}
                                    <div className="avatar-upload-section">
                                        <label className="avatar-label">Profile Picture (Optional)</label>
                                        <div className="avatar-preview-container">
                                            {avatarPreview ? (
                                                <div className="avatar-preview">
                                                    <img src={avatarPreview} alt="Avatar preview" />
                                                    <button type="button" onClick={removeAvatar} className="remove-avatar">
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    <FaUserCircle />
                                                </div>
                                            )}
                                        </div>
                                        <label htmlFor="avatar-upload" className="avatar-upload-btn">
                                            <FaImage /> Choose Image
                                        </label>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="input-group">
                                <FaEnvelope className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={authForm.email}
                                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <FaLock className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={authForm.password}
                                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                                    required
                                    minLength={6}
                                />
                            </div>

                            {authMode === 'register' && (
                                <div className="input-group">
                                    <FaLock className="input-icon" />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={authForm.confirmPassword}
                                        onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            )}

                            <button type="submit" className="auth-submit-btn">
                                {authMode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div className="auth-switch">
                            {authMode === 'login' ? (
                                <p>
                                    Don't have an account?{' '}
                                    <button onClick={() => {
                                        setAuthMode('register');
                                        setAuthError('');
                                        setAuthSuccess('');
                                    }}>
                                        Sign Up
                                    </button>
                                </p>
                            ) : (
                                <p>
                                    Already have an account?{' '}
                                    <button onClick={() => {
                                        setAuthMode('login');
                                        setAuthError('');
                                        setAuthSuccess('');
                                    }}>
                                        Sign In
                                    </button>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Precision Consult Match Modal with Map Integration */}
            {showPrecisionMatch && (
                <div className="precision-match-modal">
                    <div className="precision-match-content">
                        <div className="precision-match-header">
                            <h2>
                                <FaSearch style={{ flexShrink: 0, width: '20px', height: '20px' }} />
                                Precision Consult Match
                            </h2>
                            <button
                                className="close-precision-match"
                                onClick={() => {
                                    setShowPrecisionMatch(false);
                                    setDoctorMatches([]);
                                    setSpecialtyMatch(null);
                                    setRecommendedSpecialty(null);
                                    setMatchCriteria({
                                        symptoms: '',
                                        age: '',
                                        gender: '',
                                        location: '',
                                        insurance: '',
                                        condition: '',
                                        telemedicinePreferred: false,
                                        languagePreferences: []
                                    });
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="precision-match-body">
                            {specialtyLoading && (
                                <div className="specialty-loading-container" style={{
                                    padding: '24px',
                                    textAlign: 'center',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '12px',
                                    marginBottom: '16px'
                                }}>
                                    <FaSpinner className="spinner" style={{ marginRight: '8px', flexShrink: 0, width: '18px', height: '18px' }} />
                                    <span>Getting AI specialty recommendation...</span>
                                </div>
                            )}

                            {/* Show specialty recommendation - always show when available, even if doctors are found */}
                            {recommendedSpecialty && recommendedSpecialty.recommendedSpecialty && (
                                <div className="specialty-recommendation-banner" style={{
                                    padding: '16px',
                                    backgroundColor: '#e8f5e9',
                                    border: '2px solid #4caf50',
                                    borderRadius: '12px',
                                    marginBottom: '16px',
                                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
                                        <FaRobot style={{ color: '#4caf50', flexShrink: 0, width: '18px', height: '18px' }} />
                                        <h4 style={{ margin: 0, color: '#2e7d32', fontSize: '16px', fontWeight: 'bold' }}>
                                            🎯 AI Recommended Specialty
                                        </h4>
                                    </div>
                                    <div style={{ marginLeft: '26px' }}>
                                        <p style={{ margin: '8px 0', fontSize: '18px', fontWeight: 'bold', color: '#1b5e20' }}>
                                            {recommendedSpecialty.recommendedSpecialty}
                                        </p>
                                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#558b2f' }}>
                                            Confidence: {typeof recommendedSpecialty.confidence === 'number' 
                                                ? Math.round(recommendedSpecialty.confidence * 100) 
                                                : typeof recommendedSpecialty.confidence === 'string' && recommendedSpecialty.confidence === 'high'
                                                ? '85'
                                                : typeof recommendedSpecialty.confidence === 'string' && recommendedSpecialty.confidence === 'medium'
                                                ? '70'
                                                : typeof recommendedSpecialty.confidence === 'string' && recommendedSpecialty.confidence === 'low'
                                                ? '50'
                                                : Math.round(parseFloat(recommendedSpecialty.confidence || 0.7) * 100)
                                            }%
                                        </p>
                                        <p style={{ margin: '8px 0', fontSize: '13px', color: '#33691e', fontStyle: 'italic' }}>
                                            💡 {recommendedSpecialty.rationale}
                                        </p>
                                        {recommendedSpecialty.alternativeSpecialties && recommendedSpecialty.alternativeSpecialties.length > 0 && (
                                            <div style={{ marginTop: '12px' }}>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#558b2f' }}>
                                                    Alternative specialties to consider:
                                                </p>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {recommendedSpecialty.alternativeSpecialties.map((specialty, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setMatchCriteria(prev => ({
                                                                ...prev,
                                                                symptoms: `${prev.symptoms} [Searching in ${specialty}]`
                                                            }))}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#c8e6c9',
                                                                border: '1px solid #81c784',
                                                                borderRadius: '16px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                color: '#2e7d32',
                                                                fontWeight: '500',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.backgroundColor = '#81c784';
                                                                e.target.style.color = '#fff';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.backgroundColor = '#c8e6c9';
                                                                e.target.style.color = '#2e7d32';
                                                            }}
                                                        >
                                                            {specialty}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#558b2f', opacity: 0.8 }}>
                                            {recommendedSpecialty.usedAI ? '🤖 Powered by Gemini AI' : '🔍 Keyword-based recommendation'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Show loading spinner after confidence score while finding doctors */}
                            {recommendedSpecialty && recommendedSpecialty.recommendedSpecialty && matchLoading && doctorMatches.length === 0 && (
                                <div style={{
                                    padding: '32px',
                                    textAlign: 'center',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '12px',
                                    marginBottom: '24px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <FaSpinner className="spinner" style={{
                                        width: '32px',
                                        height: '32px',
                                        color: '#4f46e5',
                                        marginBottom: '16px'
                                    }} />
                                    <p style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#1f2937'
                                    }}>
                                        Finding Matching Doctors...
                                    </p>
                                    <p style={{
                                        margin: '0',
                                        fontSize: '14px',
                                        color: '#6b7280'
                                    }}>
                                        Searching for {recommendedSpecialty.recommendedSpecialty} specialists near you and preparing map...
                                    </p>
                                </div>
                            )}

                            {doctorMatches.length === 0 && !recommendedSpecialty ? (
                                <div className="match-form">
                                    <div className="disclaimer">
                                        <FaInfoCircle style={{ flexShrink: 0, width: '18px', height: '18px' }} />
                                        <span>AI-powered matching analyzes your symptoms to find the most suitable specialists</span>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Primary Symptoms *</label>
                                            <textarea
                                                placeholder="Describe your symptoms, duration, severity, and any triggers..."
                                                value={matchCriteria.symptoms}
                                                onChange={(e) => setMatchCriteria(prev => ({
                                                    ...prev,
                                                    symptoms: e.target.value
                                                }))}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Known Condition (if any)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Diabetes, Hypertension, Asthma..."
                                                value={matchCriteria.condition}
                                                onChange={(e) => setMatchCriteria(prev => ({
                                                    ...prev,
                                                    condition: e.target.value
                                                }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Age</label>
                                            <input
                                                type="number"
                                                placeholder="Your age"
                                                value={matchCriteria.age}
                                                onChange={(e) => setMatchCriteria(prev => ({
                                                    ...prev,
                                                    age: e.target.value
                                                }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Gender</label>
                                            <select
                                                value={matchCriteria.gender}
                                                onChange={(e) => setMatchCriteria(prev => ({
                                                    ...prev,
                                                    gender: e.target.value
                                                }))}
                                            >
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Location</label>
                                            <input
                                                type="text"
                                                placeholder="City, ST (e.g., Fairfax, VA)"
                                                value={matchCriteria.location}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setMatchCriteria(prev => ({
                                                        ...prev,
                                                        location: value
                                                    }));
                                                    
                                                    // Validate state format if comma is present
                                                    if (value.includes(',')) {
                                                        const parts = value.split(',').map(p => p.trim());
                                                        if (parts.length > 1 && parts[1].length > 0 && parts[1].length !== 2) {
                                                            setAuthError('State must be a 2-letter abbreviation (e.g., VA, CA, NY)');
                                                        } else {
                                                            setAuthError('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <small style={{ 
                                                display: 'block', 
                                                marginTop: '4px', 
                                                fontSize: '11px', 
                                                color: '#666',
                                                fontStyle: 'italic'
                                            }}>
                                                💡 Use 2-letter state abbreviation (e.g., VA, CA, NY, TX)
                                            </small>
                                        </div>

                                        <div className="form-group">
                                            <label>Insurance Provider</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Blue Cross, Aetna, Medicare..."
                                                value={matchCriteria.insurance}
                                                onChange={(e) => setMatchCriteria(prev => ({
                                                    ...prev,
                                                    insurance: e.target.value
                                                }))}
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={matchCriteria.telemedicinePreferred}
                                                    onChange={(e) => setMatchCriteria(prev => ({
                                                        ...prev,
                                                        telemedicinePreferred: e.target.checked
                                                    }))}
                                                />
                                                <span>Prefer telemedicine consultation</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-lavender find-doctors-btn"
                                        onClick={handlePrecisionMatch}
                                        disabled={matchLoading || !matchCriteria.symptoms.trim()}
                                    >
                                        {matchLoading ? (
                                            <>
                                                <FaSpinner className="spinner" />
                                                Finding Best Matches...
                                            </>
                                        ) : (
                                            <>
                                                <FaSearch className="mr-2" />
                                                Find Matching Doctors
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="match-results">
                                    {/* Show specialty recommendation at the top of results */}
                                    {recommendedSpecialty && recommendedSpecialty.recommendedSpecialty && (
                                        <div className="specialty-recommendation-banner" style={{
                                            padding: '20px',
                                            backgroundColor: recommendedSpecialty.usedAI ? '#e8f5e9' : '#fff3e0',
                                            border: `2px solid ${recommendedSpecialty.usedAI ? '#4caf50' : '#ff9800'}`,
                                            borderRadius: '12px',
                                            marginBottom: '24px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                                <FaRobot style={{ fontSize: '28px', color: recommendedSpecialty.usedAI ? '#4caf50' : '#ff9800', marginRight: '12px' }} />
                                                <h3 style={{ margin: 0, color: recommendedSpecialty.usedAI ? '#2e7d32' : '#e65100', fontSize: '20px', fontWeight: 'bold' }}>
                                                    {recommendedSpecialty.usedAI ? '🤖 Gemini AI Recommended Specialty' : '🔍 Recommended Specialty'}
                                                </h3>
                                            </div>
                                            <div style={{ 
                                                padding: '16px', 
                                                backgroundColor: '#fff', 
                                                borderRadius: '8px',
                                                marginBottom: '12px',
                                                border: `1px solid ${recommendedSpecialty.usedAI ? '#c8e6c9' : '#ffe0b2'}`
                                            }}>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color: recommendedSpecialty.usedAI ? '#1b5e20' : '#e65100' }}>
                                                    {recommendedSpecialty.recommendedSpecialty}
                                                </p>
                                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                                                    <strong>Confidence:</strong> {typeof recommendedSpecialty.confidence === 'number' 
                                                        ? Math.round(recommendedSpecialty.confidence * 100) + '%'
                                                        : typeof recommendedSpecialty.confidence === 'string' && recommendedSpecialty.confidence === 'high'
                                                        ? '85%'
                                                        : typeof recommendedSpecialty.confidence === 'string' && recommendedSpecialty.confidence === 'medium'
                                                        ? '70%'
                                                        : typeof recommendedSpecialty.confidence === 'string' && recommendedSpecialty.confidence === 'low'
                                                        ? '50%'
                                                        : Math.round(parseFloat(recommendedSpecialty.confidence || 0.7) * 100) + '%'
                                                    }
                                                </p>
                                                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#555', fontStyle: 'italic' }}>
                                                    💡 {recommendedSpecialty.rationale || 'Based on your symptoms and medical information'}
                                                </p>
                                            </div>
                                            {recommendedSpecialty.usedAI && (
                                                <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#558b2f', opacity: 0.8, textAlign: 'center' }}>
                                                    ✨ Powered by Google Gemini AI
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="results-header">
                                        <h3>Top Doctor Matches</h3>
                                        <p className="results-subtitle">
                                            Found {doctorMatches.length} {recommendedSpecialty?.recommendedSpecialty ? `${recommendedSpecialty.recommendedSpecialty} ` : ''}specialists based on your symptoms
                                        </p>
                                    </div>

                                    {/* Map shown inline in results container */}
                                    {doctorMatches.length > 0 && (
                                        <div style={{ 
                                            marginBottom: '24px',
                                            padding: '16px',
                                            backgroundColor: '#f9fafb',
                                            borderRadius: '12px',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                                                <FaMapMarkerAlt style={{ marginRight: '8px', color: '#4caf50' }} />
                                                Doctor Locations on Map
                                            </h4>
                                            <NewMapComponent
                                                key={`new-map-${doctorMatches.length}-${mapCenter[0]}-${mapCenter[1]}`}
                                                providers={doctorMatches}
                                                center={mapCenter}
                                                height="500px"
                                                zoom={13}
                                                searchLocation={matchCriteria.location}
                                            />
                                            <div style={{ 
                                                marginTop: '12px', 
                                                display: 'flex', 
                                                gap: '12px', 
                                                fontSize: '12px',
                                                color: '#6b7280'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ 
                                                        width: '16px', 
                                                        height: '16px', 
                                                        backgroundColor: '#ef4444', 
                                                        borderRadius: '50%',
                                                        border: '2px solid white',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}></div>
                                                    <span>Healthcare Providers</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="doctors-grid">
                                        {doctorMatches.map((doctor, index) => {
                                            // Ensure the key is truly unique by combining ID with index
                                            const uniqueKey = `${doctor.id}-${index}`;

                                            return (
                                                <div key={uniqueKey} className="doctor-card">
                                                    <div className="doctor-header">
                                                        <div className="doctor-image">
                                                            <img
                                                                src={`https://randomuser.me/api/portraits/${doctor.gender === 'female' ? 'women' : 'men'}/${index}.jpg`}
                                                                alt={doctor.name}
                                                                onError={(e) => {
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=4f46e5&color=fff`;
                                                                }}
                                                            />
                                                            <div className="match-badge">
                                                                {typeof doctor.matchPercentage === 'number' 
                                                                    ? Math.round(doctor.matchPercentage) 
                                                                    : Math.round(parseFloat(doctor.matchPercentage || 0))
                                                                }% Match
                                                            </div>
                                                        </div>
                                                        <div className="doctor-info">
                                                            <h4>{doctor.name}</h4>
                                                            <p className="specialty">{doctor.specialty}</p>
                                                            <p className="subspecialty">{doctor.subSpecialty}</p>
                                                            <div className="rating">
                                                                <FaStar className="star" />
                                                                <span>{typeof doctor.rating === 'number' ? doctor.rating.toFixed(1) : parseFloat(doctor.rating || 0).toFixed(1)}</span>
                                                                <span className="reviews">({doctor.experience * 10}+ reviews)</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="doctor-details">
                                                        <div className="detail-item">
                                                            <FaMapMarkerAlt />
                                                            <span>{doctor.hospital}, {doctor.location}</span>
                                                        </div>
                                                        {doctor.distance && (
                                                            <div className="detail-item">
                                                                <FaMapMarkerAlt />
                                                                <span>{doctor.distance.text} away • {doctor.travelTime?.text} travel</span>
                                                            </div>
                                                        )}
                                                        <div className="detail-item">
                                                            <FaStethoscope />
                                                            <span>{doctor.experience} years experience</span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <FaComments />
                                                            <span>{(doctor.languages || ['English']).join(', ')}</span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <FaUserMd />
                                                            <span>Available: {doctor.availability}</span>
                                                        </div>
                                                    </div>

                                                    <div className="conditions">
                                                        <strong>Specializes in:</strong>
                                                        <div className="condition-tags">
                                                            {doctor.subSpecialty ? (
                                                                <span className="condition-tag" style={{ fontWeight: '600', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                                                    {doctor.subSpecialty}
                                                                </span>
                                                            ) : null}
                                                            {(doctor.conditions || []).slice(0, 3).map(condition => (
                                                                <span key={condition} className="condition-tag">
                                                                    {condition}
                                                                </span>
                                                            ))}
                                                            {!doctor.subSpecialty && (!doctor.conditions || doctor.conditions.length === 0) && (
                                                                <span className="condition-tag">
                                                                    {doctor.specialty || 'General Practice'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="doctor-actions">
                                                        <div className="fee">
                                                            Consultation: ${doctor.consultationFee}
                                                        </div>
                                                        <button className="btn btn-sage" onClick={() => openBooking(doctor)}>
                                                            Book Consultation
                                                        </button>
                                                    </div>

                                                    {doctor.scoringFactors && (
                                                        <div className="match-reasons">
                                                            <details>
                                                                <summary>Why this match?</summary>
                                                                <ul>
                                                                    {doctor.scoringFactors.map((factor, i) => (
                                                                        <li key={i}>{factor}</li>
                                                                    ))}
                                                                </ul>
                                                            </details>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="results-actions">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setDoctorMatches([]);
                                                setSpecialtyMatch(null);
                                                setRecommendedSpecialty(null);
                                            }}
                                        >
                                            New Search
                                        </button>
                                        <button
                                            className="btn btn-sage"
                                            onClick={() => handleShowMap()}
                                        >
                                            <FaMapMarkerAlt className="mr-2" />
                                            View Map
                                        </button>
                                        <button
                                            className="btn btn-lavender"
                                            onClick={() => {
                                                setShowPrecisionMatch(false);
                                                setDoctorMatches([]);
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Map Modal */}
            {showMap && (
                <div className="map-modal" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    padding: '20px'
                }}>
                    <div className="map-modal-content" style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        width: '95%',
                        maxWidth: '1400px',
                        height: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div className="map-header" style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaMapMarkerAlt style={{ color: '#10b981' }} />
                                Healthcare Providers Map View
                            </h3>
                            <button
                                className="close-map"
                                onClick={() => {
                                    setShowMap(false);
                                    setSelectedMapDoctor(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '4px'
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            {/* Doctors List Sidebar */}
                            <div style={{
                                width: '380px',
                                borderRight: '1px solid #e5e7eb',
                                overflowY: 'auto',
                                backgroundColor: '#f9fafb'
                            }}>
                                <div style={{ padding: '16px' }}>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                                        {mapProviders.length} provider{mapProviders.length !== 1 ? 's' : ''} found
                                    </p>
                                    {mapProviders.map((doctor, index) => (
                                        <div
                                            key={doctor.id || index}
                                            onClick={() => {
                                                setSelectedMapDoctor(doctor);
                                                if (doctor.coordinates?.lat && doctor.coordinates?.lng) {
                                                    setMapCenter([doctor.coordinates.lat, doctor.coordinates.lng]);
                                                }
                                            }}
                                            style={{
                                                padding: '12px',
                                                marginBottom: '8px',
                                                backgroundColor: selectedMapDoctor?.id === doctor.id ? '#e0f2fe' : 'white',
                                                border: selectedMapDoctor?.id === doctor.id ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedMapDoctor?.id !== doctor.id) {
                                                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedMapDoctor?.id !== doctor.id) {
                                                    e.currentTarget.style.backgroundColor = 'white';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                                    {doctor.name}
                                                </h4>
                                                {doctor.matchPercentage && (
                                                    <span style={{
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: '#10b981',
                                                        backgroundColor: '#d1fae5',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px'
                                                    }}>
                                                        {doctor.matchPercentage}% match
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
                                                {doctor.specialty}
                                            </p>
                                            <p style={{ margin: '4px 0', fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FaMapMarkerAlt style={{ fontSize: '10px' }} />
                                                {doctor.address || doctor.location || 'Address not available'}
                                            </p>
                                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn btn-sage"
                                                    style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowMap(false);
                                                        setSelectedMapDoctor(null);
                                                        openBooking(doctor);
                                                    }}
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Map Container */}
                            <div className="map-container" style={{ flex: 1, position: 'relative' }}>
                                <NewMapComponent
                                    providers={mapProviders}
                                    center={mapCenter}
                                    height="100%"
                                    selectedProvider={selectedMapDoctor}
                                />
                            </div>
                        </div>

                        <div className="map-actions" style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowMap(false);
                                    setSelectedMapDoctor(null);
                                }}
                            >
                                Close Map
                            </button>
                            <button
                                className="btn btn-lavender"
                                onClick={() => {
                                    setShowMap(false);
                                    setSelectedMapDoctor(null);
                                    setShowPrecisionMatch(true);
                                }}
                            >
                                Back to Results
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                    onClick={closeBooking}
                >
                    <div
                        style={{
                            background: '#fff',
                            width: '100%',
                            maxWidth: '520px',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Book Consultation</h3>
                            <button
                                onClick={closeBooking}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '18px'
                                }}
                                aria-label="Close booking"
                                title="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {bookingDoctor && (
                            <div style={{ marginTop: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 600 }}>{bookingDoctor.name}</div>
                                <div style={{ color: '#4b5563', fontSize: '14px' }}>
                                    {bookingDoctor.specialty}{bookingDoctor.subSpecialty ? ` • ${bookingDoctor.subSpecialty}` : ''}
                                </div>
                                <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                                    {bookingDoctor.hospital} • {bookingDoctor.location}
                                </div>
                            </div>
                        )}

                        {bookingConfirmation ? (
                            <div style={{ marginTop: '14px' }}>
                                <div style={{
                                    background: '#ecfdf5',
                                    border: '1px solid #10b981',
                                    color: '#065f46',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                }}>
                                    <strong>Appointment Confirmed</strong><br />
                                    Confirmation #: {bookingConfirmation.confirmationNumber}
                                </div>
                                <div style={{ fontSize: '14px', color: '#374151' }}>
                                    <div>Date: {bookingConfirmation.date}</div>
                                    <div>Time: {bookingConfirmation.time}</div>
                                    <div>Type: {bookingConfirmation.type}</div>
                                    {bookingConfirmation.instructions && (
                                        <div style={{ marginTop: '8px', color: '#6b7280' }}>
                                            {bookingConfirmation.instructions}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-sage" onClick={closeBooking}>Done</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginTop: '14px' }}>
                                {bookingError && (
                                    <div style={{
                                        background: '#fef2f2',
                                        border: '1px solid #ef4444',
                                        color: '#991b1b',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        marginBottom: '12px'
                                    }}>
                                        {bookingError}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date</label>
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={bookingDetails.date}
                                            onChange={(e) => setBookingDetails(prev => ({ ...prev, date: e.target.value, time: '' }))}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        />
                                    </div>
                                    {bookingDetails.date && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                                Available Times {loadingSlots && '(Loading...)'}
                                            </label>
                                            {loadingSlots ? (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading available slots...</div>
                                            ) : availableSlots.length > 0 ? (
                                                <div style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', 
                                                    gap: '8px',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    padding: '8px',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px'
                                                }}>
                                                    {availableSlots.map(slot => (
                                                        <button
                                                            key={slot.time}
                                                            type="button"
                                                            disabled={!slot.available}
                                                            onClick={() => setBookingDetails(prev => ({ ...prev, time: slot.time }))}
                                                            style={{
                                                                padding: '8px',
                                                                borderRadius: '6px',
                                                                border: bookingDetails.time === slot.time ? '2px solid #10b981' : '1px solid #e5e7eb',
                                                                background: !slot.available ? '#f3f4f6' : (bookingDetails.time === slot.time ? '#d1fae5' : '#fff'),
                                                                color: !slot.available ? '#9ca3af' : (bookingDetails.time === slot.time ? '#065f46' : '#374151'),
                                                                cursor: slot.available ? 'pointer' : 'not-allowed',
                                                                fontSize: '13px',
                                                                fontWeight: bookingDetails.time === slot.time ? '600' : '400',
                                                                textDecoration: !slot.available ? 'line-through' : 'none'
                                                            }}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No available slots for this date</div>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Type</label>
                                        <select
                                            value={bookingDetails.type}
                                            onChange={(e) => setBookingDetails(prev => ({ ...prev, type: e.target.value }))}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="in-person">In-person</option>
                                            <option value="telemedicine">Telemedicine</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Notes (optional)</label>
                                        <textarea
                                            rows="3"
                                            value={bookingDetails.notes}
                                            onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Reason for visit, preferences, etc."
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-secondary" onClick={closeBooking} disabled={bookingLoading}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-sage" onClick={submitBooking} disabled={bookingLoading}>
                                        {bookingLoading ? 'Booking…' : 'Confirm Booking'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* My Appointments Modal */}
            {showMyAppointments && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setShowMyAppointments(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '20px'
                    }}
                >
                    <div 
                        className="modal-content glassmorphism" 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ 
                            maxWidth: '900px', 
                            width: '100%',
                            maxHeight: '80vh', 
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            position: 'relative'
                        }}
                    >
                        {console.log('🎨 Rendering appointments modal. Count:', myAppointments.length)}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
                            <h2 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>
                                <FaBookMedical style={{ marginRight: '8px' }} />
                                My Appointments
                            </h2>
                            <button onClick={() => setShowMyAppointments(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>
                                <FaTimes />
                            </button>
                        </div>

                        {appointmentsLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <FaSpinner className="spin" style={{ fontSize: '40px', color: '#a78bfa' }} />
                                <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading your appointments...</p>
                            </div>
                        ) : myAppointments.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <FaBookMedical style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
                                <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>No appointments yet</p>
                                <p style={{ fontSize: '14px', color: '#9ca3af' }}>Book an appointment with a specialist to get started</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {myAppointments.map((appointment) => {
                                    const isPast = new Date(`${appointment.date}T${appointment.time}`) < new Date();
                                    return (
                                        <div 
                                            key={appointment.id} 
                                            style={{
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                background: isPast ? '#f9fafb' : '#fff',
                                                opacity: isPast ? 0.7 : 1
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937', marginBottom: '4px' }}>
                                                        {appointment.doctorName}
                                                    </h3>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                                                        <FaStethoscope style={{ marginRight: '6px' }} />
                                                        {appointment.specialty}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    background: appointment.status === 'confirmed' ? '#d1fae5' : '#fee2e2',
                                                    color: appointment.status === 'confirmed' ? '#065f46' : '#991b1b'
                                                }}>
                                                    {appointment.status.toUpperCase()}
                                                </span>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Date & Time</p>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                                                        {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {appointment.time}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Type</p>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151', fontWeight: '500', textTransform: 'capitalize' }}>
                                                        {appointment.type}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Confirmation #</p>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                                                        {appointment.confirmationNumber}
                                                    </p>
                                                </div>
                                            </div>

                                            {appointment.notes && (
                                                <div style={{ marginBottom: '12px', padding: '10px', background: '#f3f4f6', borderRadius: '6px' }}>
                                                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Notes</p>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>{appointment.notes}</p>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                                {!isPast && (
                                                    <button
                                                        onClick={() => handleCancelAppointment(appointment.id)}
                                                        disabled={cancellingId === appointment.id}
                                                        className="btn btn-secondary"
                                                        style={{ 
                                                            fontSize: '14px', 
                                                            padding: '8px 16px',
                                                            opacity: cancellingId === appointment.id ? 0.6 : 1
                                                        }}
                                                    >
                                                        {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel Appointment'}
                                                    </button>
                                                )}
                                                {isPast && (
                                                    <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Past appointment</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* NEW: Clinical Nexus Academy Modal */}
            {activeFeature === 'clinical-academy' && (
                <div className="clinical-academy-modal">
                    <div className="clinical-academy-content">
                        <div className="clinical-academy-header">
                            <h2>
                                <FaBookOpen className="mr-2" />
                                Clinical Nexus Academy
                            </h2>
                            <button
                                className="close-clinical-academy"
                                onClick={() => setActiveFeature(null)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="clinical-academy-body">
                            <ClinicalNexusAcademy onClose={() => setActiveFeature(null)} />
                        </div>
                    </div>
                </div>
            )}

            {/* 3D Anatomy Viewer Modal */}
            {showAnatomyViewer && selectedSpecialtyFor3D && (
                <Anatomy3DViewer
                    specialty={selectedSpecialtyFor3D}
                    onClose={() => {
                        setShowAnatomyViewer(false);
                        setSelectedSpecialtyFor3D(null);
                    }}
                />
            )}

            {/* Chat Toggle Button */}
            <button
                className="chat-toggle-btn"
                onClick={() => setShowChat(!showChat)}
                title="Open community chat"
                aria-label="Open community chat"
            >
                <FaComments />
                {messages.length > 0 && <span className="message-indicator"></span>}
            </button>

            {/* Chat Modal */}
            {showChat && (
                <div className="chat-modal">
                    <div className="chat-header">
                        <h3>Community Chat</h3>
                        <button
                            className="close-chat"
                            onClick={() => setShowChat(false)}
                        >
                            <FaTimes />
                        </button>
                    </div>
                    <div className="messages-container">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.user_id === currentUser?.id ? 'own-message' : ''}`}
                            >
                                <div className="message-user">
                                    <div className="message-user-avatar">
                                        {message.user?.avatar_url ? (
                                            <img src={message.user.avatar_url} alt={message.user.username} className="message-avatar" />
                                        ) : (
                                            <FaUserCircle className="message-avatar-placeholder" />
                                        )}
                                    </div>
                                    <div className="message-user-info">
                                        <span className="message-username">{message.user?.username || 'Anonymous'}</span>
                                        <span className="message-time">
                                            {new Date(message.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>

                                {message.image_url && (
                                    <div className="message-image-container">
                                        <div
                                            className="message-image clickable-image"
                                            onClick={() => handleImageClick(message.image_url)}
                                        >
                                            <img src={message.image_url} alt="Shared content" />
                                            <div className="image-overlay">
                                                <FaImage className="enlarge-icon" />
                                                <span>Click to enlarge</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {message.text && <p className="message-text">{message.text}</p>}
                                {message.location && (
                                    <div className={`message-location-container ${message.text?.includes('🚨 EMERGENCY ALERT') ? 'emergency-location' : ''}`}>
                                        <div className="message-location-header">
                                            <FaMapMarkerAlt className="location-icon" />
                                            <span className="location-title">Location Shared</span>
                                        </div>
                                        <div className="location-details">
                                            <div className="location-address">
                                                {message.location.text?.split(' (')[0] || 'Address not available'}
                                            </div>
                                            <div className="location-coordinates">
                                                {message.location.text?.includes('Coordinates:')
                                                    ? message.location.text.match(/Coordinates: [^)]+/)[0]
                                                    : `Coordinates: ${message.location.latitude?.toFixed(6)}, ${message.location.longitude?.toFixed(6)}`
                                                }
                                            </div>
                                        </div>
                                        {message.location.accuracy && (
                                            <div className="location-accuracy">
                                                Accuracy: ±{Math.round(message.location.accuracy)} meters
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="message-input">
                        {selectedImage && (
                            <div className="image-preview">
                                <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                                <button onClick={removeImage} className="remove-image">
                                    <FaTimes />
                                </button>
                            </div>
                        )}
                        <div className="input-container">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isUploading}
                            />
                            <label htmlFor="image-upload" className="image-upload-btn">
                                <FaImage />
                            </label>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                                disabled={isUploading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={(!newMessage.trim() && !selectedImage) || isUploading}
                                className="send-btn"
                            >
                                {isUploading ? <div className="spinner"></div> : <FaPaperPlane />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Diagnostic Think Tank Modal */}
            {showAIChat && (
                <div className="ai-chat-modal">
                    <div className="ai-chat-content">
                        <div className="ai-chat-header">
                            <div className="ai-chat-title">
                                <FaRobot className="ai-icon" />
                                <h3>Diagnostic Think Tank</h3>
                                <span className="ai-badge">AI-Powered Medical Assistant</span>
                            </div>
                            <button
                                className="close-ai-chat"
                                onClick={() => setShowAIChat(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="ai-disclaimer">
                            <strong>Medical AI Assistant</strong> - For educational and discussion purposes only.
                            Always verify through proper medical channels. Not for direct patient care.
                        </div>

                        <div className="ai-chat-main">
                            {/* Patient Info Sidebar */}
                            <div className="patient-info-section">
                                <h4>Patient Information</h4>
                                <div className="patient-info-grid">
                                    <div className="info-group">
                                        <label>Age</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 45"
                                            value={patientInfo.age}
                                            onChange={(e) => setPatientInfo(prev => ({...prev, age: e.target.value}))}
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Gender</label>
                                        <select
                                            value={patientInfo.gender}
                                            onChange={(e) => setPatientInfo(prev => ({...prev, gender: e.target.value}))}
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {/* ADD THIS NEW SYMPTOMS FIELD */}
                                    <div className="info-group full-width">
                                        <label>Symptoms *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., acute chest pain radiating to left arm, diaphoresis, and shortness of breath"
                                            value={patientInfo.symptoms}
                                            onChange={(e) => setPatientInfo(prev => ({...prev, symptoms: e.target.value}))}
                                        />
                                    </div>

                                    <div className="info-group">
                                        <label>Duration</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 2 days"
                                            value={patientInfo.duration}
                                            onChange={(e) => setPatientInfo(prev => ({...prev, duration: e.target.value}))}
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Severity</label>
                                        <select
                                            value={patientInfo.severity}
                                            onChange={(e) => setPatientInfo(prev => ({...prev, severity: e.target.value}))}
                                        >
                                            <option value="">Select</option>
                                            <option value="mild">Mild</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="severe">Severe</option>
                                            <option value="acute">Acute</option>
                                        </select>
                                    </div>
                                    <div className="info-group full-width">
                                        <label>Medical History</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Hypertension, Diabetes, Smoking (leave empty if none)"
                                            value={patientInfo.medicalHistory}
                                            onChange={(e) => setPatientInfo(prev => ({...prev, medicalHistory: e.target.value}))}
                                        />
                                        <small style={{color: '#666', fontSize: '12px'}}>Leave empty if no relevant medical history</small>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-sage" onClick={loadSampleCase}>
                                    Load Sample Case
                                </button>

                                <button className="btn btn-sm btn-sage" onClick={() => {
                                    if (!patientInfo.symptoms) {
                                        alert('Please enter symptoms first');
                                        return;
                                    }

                                    // Handle medical history professionally
                                    let historyPhrase = '';
                                    if (patientInfo.medicalHistory.trim()) {
                                        historyPhrase = ` Past medical history: ${patientInfo.medicalHistory}.`;
                                    } else {
                                        historyPhrase = ' No significant past medical history.';
                                    }

                                    const patientInfoText = `${patientInfo.age}-year-old ${patientInfo.gender} presents with ${patientInfo.symptoms} for ${patientInfo.duration}.${historyPhrase}`;
                                    setAiInput(prev => prev ? `${prev} ${patientInfoText}` : patientInfoText);
                                }} style={{ marginLeft: '5px' }}>
                                    Add Patient Info to Chat
                                </button>

                            </div>

                            {/* Main Messages Area */}
                            <div className="ai-messages-container">
                                {aiMessages.length === 0 ? (
                                    <div className="ai-welcome-message">
                                        <FaRobot className="welcome-icon" />
                                        <h4>Welcome to Diagnostic Think Tank</h4>
                                        <p>Describe the clinical presentation, symptoms, or case you'd like to discuss. I'll help with differential diagnoses and diagnostic considerations.</p>
                                        <div className="example-prompts">
                                            <strong>Try these examples:</strong>
                                            <ul>
                                                <li>"45yo male with chest pain and diaphoresis"</li>
                                                <li>"Headache with photophobia and neck stiffness"</li>
                                                <li>"Abdominal pain in right lower quadrant"</li>
                                                <li>"Fever with productive cough for 3 days"</li>
                                                <li>"Acute onset of neurological deficits"</li>
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    aiMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`ai-message ${message.type === 'user' ? 'user-message' : 'ai-response'} ${!message.success ? 'error-message' : ''}`}
                                        >
                                            <div className="ai-message-header">
                                                {message.type === 'user' ? (
                                                    <FaUser className="message-icon" />
                                                ) : (
                                                    <FaRobot className="message-icon" />
                                                )}
                                                <span className="message-sender">
                                                    {message.type === 'user' ? 'You' : 'AI Assistant'}
                                                </span>
                                                <span className="message-time">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="ai-message-content">
                                                {message.type === 'user' ? (
                                                    <div className="user-text">{message.content}</div>
                                                ) : (
                                                    <div className="medical-response">
                                                        <ReactMarkdown
                                                            components={{
                                                                // Simple fix for list items
                                                                li: ({ children, ...props }) => (
                                                                    <li style={{
                                                                        display: 'list-item',
                                                                        marginBottom: '0.75rem',
                                                                        lineHeight: '1.6',
                                                                        listStylePosition: 'outside',
                                                                        paddingLeft: '0.5rem'
                                                                    }} {...props}>
                                                                        {children}
                                                                    </li>
                                                                ),
                                                                ul: ({ children, ...props }) => (
                                                                    <ul style={{
                                                                        marginBottom: '1.25rem',
                                                                        paddingLeft: '2rem',
                                                                        listStyleType: 'disc',
                                                                        listStylePosition: 'outside'
                                                                    }} {...props}>
                                                                        {children}
                                                                    </ul>
                                                                ),
                                                                ol: ({ children, ...props }) => (
                                                                    <ol style={{
                                                                        marginBottom: '1.25rem',
                                                                        paddingLeft: '2rem',
                                                                        listStyleType: 'decimal',
                                                                        listStylePosition: 'outside'
                                                                    }} {...props}>
                                                                        {children}
                                                                    </ol>
                                                                )
                                                            }}
                                                        >
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Only show fallback notice for AI messages that are fallbacks */}
                                            {message.type === 'ai' && message.fallback && (
                                                <div className="fallback-notice">
                                                    <FaInfoCircle /> Note: AI service using educational fallback. This is a simulated response.
                                                </div>
                                            )}
                                            {/* Only show error notice for AI messages that failed */}
                                            {message.type === 'ai' && !message.success && (
                                                <div className="error-notice">
                                                    <FaExclamationTriangle /> Error: AI service unavailable. Please try again.
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                {isAILoading && (
                                    <div className="ai-message ai-response loading-message">
                                        <div className="ai-message-header">
                                            <FaRobot className="message-icon" />
                                            <span className="message-sender">AI Assistant</span>
                                            <FaSpinner className="spinner" />
                                        </div>
                                        <div className="ai-message-content">
                                            Analyzing case and generating differential diagnoses...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="ai-input-container">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Describe symptoms, clinical presentation, or ask a diagnostic question..."
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAISendMessage()}
                                    disabled={isAILoading}
                                />
                                <button
                                    onClick={handleAISendMessage}
                                    disabled={!aiInput.trim() || isAILoading}
                                    className="ai-send-btn"
                                >
                                    {isAILoading ? <FaSpinner className="spinner" /> : 'Ask AI'}
                                </button>
                            </div>
                            <div className="ai-chat-actions">
                                <button className="btn btn-secondary" onClick={clearAIChat}>
                                    Clear Chat
                                </button>
                                <small>AI responses are for discussion purposes only</small>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enlarged Image Modal */}
            {enlargedImage && (
                <div className="enlarged-image-modal" onClick={closeEnlargedImage}>
                    <div className="enlarged-image-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-enlarged-image" onClick={closeEnlargedImage}>
                            <FaTimes />
                        </button>

                        <div className="zoom-controls">
                            <button onClick={() => setImageZoom(prev => Math.max(0.5, prev - 0.25))}>
                                <FaSearchMinus />
                            </button>
                            <span>{Math.round(imageZoom * 100)}%</span>
                            <button onClick={() => setImageZoom(prev => Math.min(3, prev + 0.25))}>
                                <FaSearchPlus />
                            </button>
                            <button onClick={() => {
                                setImageZoom(1);
                                setImagePosition({ x: 0, y: 0 });
                            }}>
                                Reset
                            </button>
                        </div>

                        <div
                            className={`image-container ${imageZoom > 1 ? 'zoomed' : ''}`}
                            onWheel={handleImageWheel}
                            onMouseDown={handleImageMouseDown}
                            onMouseMove={handleImageMouseMove}
                            onMouseUp={handleImageMouseUp}
                            onMouseLeave={handleImageMouseUp}
                        >
                            <img
                                src={enlargedImage}
                                alt="Enlarged view"
                                style={{
                                    transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                                    cursor: imageZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                                }}
                            />
                        </div>

                        <div className="image-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => window.open(enlargedImage, '_blank')}
                            >
                                <FaImage /> Open in New Tab
                            </button>
                            <button className="btn btn-secondary" onClick={closeEnlargedImage}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="hidden">
                <div className="footer-content">
                    <div className="footer-brand">
                        <img
                            src="/logo.png"
                            alt="MediConnect"
                            className="footer-logo animate-pulse"
                        />
                    </div>

                    <div className="footer-links">
                        <div className="link-group">
                            <h4>Services</h4>
                            <a href="/learning">Learning Hub</a>
                            <a href="/appointments">Specialist Booking</a>
                            <a href="/emergency">Emergency Help</a>
                        </div>
                        <div className="link-group">
                            <h4>Community</h4>
                            <a href="/forums">Discussion Forums</a>
                            <a href="/mentorship">Mentorship</a>
                            <a href="/cases">Case Library</a>
                        </div>
                        <div className="link-group">
                            <h4>Legal</h4>
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/terms">Terms of Service</a>
                            <a href="/compliance">HIPAA Compliance</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2025 MEDICONNECT. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

// Medical Specialties Data with Professional Icons
const medicalSpecialties = [
    {
        name: 'General Medicine',
        icon: <FaUserMd />,
        color: '#3B82F6',
        description: 'Comprehensive adult health management',
        cases: ['Chronic disease care', 'Preventive screenings', 'Health maintenance']
    },
    {
        name: 'Radiology',
        icon: <FaXRay />,
        color: '#475569',
        description: 'Medical imaging and diagnostic interpretation',
        cases: ['MRI analysis', 'CT scan review', 'Ultrasound diagnostics']
    },
    {
        name: 'Cardiology',
        icon: <FaHeartbeat />,
        color: '#EF4444',
        description: 'Heart and circulatory system disorders',
        cases: ['Arrhythmia management', 'Heart failure care', 'Angina treatment']
    },
    {
        name: 'Neurology',
        icon: <FaBrain />,
        color: '#8B5CF6',
        description: 'Nervous system disorders treatment',
        cases: ['Epilepsy management', 'Stroke rehabilitation', 'MS care']
    },
    {
        name: 'Oncology',
        icon: <FaClinicMedical />,
        color: '#9333EA',
        description: 'Cancer diagnosis and treatment',
        cases: ['Chemotherapy planning', 'Radiation therapy', 'Tumor boards']
    },
    {
        name: 'Pediatrics',
        icon: <FaBaby />,
        color: '#F59E0B',
        description: 'Child health and development',
        cases: ['Vaccination schedules', 'Growth monitoring', 'Adolescent care']
    },
    {
        name: 'Orthopedics',
        icon: <FaBone />,
        color: '#6B7280',
        description: 'Musculoskeletal system care',
        cases: ['Fracture repair', 'Joint replacement', 'Sports injuries']
    },
    {
        name: 'Dermatology',
        icon: <FaUserAlt />,
        color: '#EC4899',
        description: 'Skin, hair and nail conditions',
        cases: ['Psoriasis treatment', 'Acne therapy', 'Skin cancer screening']
    },
    {
        name: 'Gastroenterology',
        icon: <GiStomach />,
        color: '#10B981',
        description: 'Digestive system disorders',
        cases: ['Colonoscopy screening', 'IBD management', 'Liver disease care']
    },
    {
        name: 'Endocrinology',
        icon: <FaSyringe />,
        color: '#F59E0B',
        description: 'Hormonal and metabolic disorders',
        cases: ['Diabetes management', 'Thyroid disorders', 'Osteoporosis care']
    },
    {
        name: 'Pulmonology',
        icon: <GiLungs />,
        color: '#3B82F6',
        description: 'Respiratory system health',
        cases: ['Asthma control', 'COPD management', 'Sleep apnea treatment']
    },
    {
        name: 'Nephrology',
        icon: <GiKidneys />,
        color: '#10B981',
        description: 'Kidney disease management',
        cases: ['Dialysis planning', 'Hypertension care', 'Transplant coordination']
    },
    {
        name: 'Hematology',
        icon: <FaMicroscope />,
        color: '#DC2626',
        description: 'Blood disorders treatment',
        cases: ['Anemia management', 'Leukemia care', 'Coagulation disorders']
    },
    {
        name: 'Rheumatology',
        icon: <FaProcedures />,
        color: '#8B5CF6',
        description: 'Autoimmune and joint diseases',
        cases: ['Arthritis management', 'Lupus care', 'Osteoporosis treatment']
    },
    {
        name: 'Infectious Diseases',
        icon: <FaAllergies />,
        color: '#9333EA',
        description: 'Complex infection management',
        cases: ['Antibiotic therapy', 'HIV care', 'Travel medicine']
    },
    {
        name: 'Emergency Medicine',
        icon: <MdEmergency />,
        color: '#DC2626',
        description: 'Acute care and trauma response',
        cases: ['Trauma stabilization', 'Cardiac arrest care', 'Toxicology']
    },
    {
        name: 'Family Medicine',
        icon: <FaUserMd />,
        color: '#3B82F6',
        description: 'Comprehensive family health care',
        cases: ['Preventive care', 'Chronic disease management', 'Health screenings']
    },
    {
        name: 'Psychiatry',
        icon: <MdPsychology />,
        color: '#10B981',
        description: 'Mental health and behavioral care',
        cases: ['Depression treatment', 'Anxiety management', 'Behavioral therapy']
    },
    {
        name: 'Obstetrics/Gynecology',
        icon: <FaProcedures />,
        color: '#EC4899',
        description: 'Women\'s reproductive health',
        cases: ['Prenatal care', 'Menopause management', 'Gynecologic surgery']
    },
    {
        name: 'Urology',
        icon: <GiKidneys />,
        color: '#3F51B5',
        description: 'Urinary tract and male reproductive health',
        cases: ['Prostate care', 'Kidney stones treatment', 'Incontinence management']
    },
    {
        name: 'Ophthalmology',
        icon: <FaEye />,
        color: '#6366F1',
        description: 'Eye care and vision health',
        cases: ['Cataract surgery', 'Glaucoma management', 'Retinal care']
    },
    {
        name: 'Otolaryngology',
        icon: <FaHeadSideCough />,
        color: '#6B7280',
        description: 'Ear, nose and throat disorders',
        cases: ['Hearing loss management', 'Sinusitis treatment', 'Voice disorders']
    },
    {
        name: 'Anesthesiology',
        icon: <FaSyringe />,
        color: '#8B5CF6',
        description: 'Pain management and surgical support',
        cases: ['Surgical anesthesia', 'Pain control', 'Critical care support']
    },
    {
        name: 'Pathology',
        icon: <FaMicroscope />,
        color: '#475569',
        description: 'Disease diagnosis through laboratory analysis',
        cases: ['Biopsy interpretation', 'Genetic testing', 'Forensic pathology']
    },
    {
        name: 'Surgery',
        icon: <FaProcedures />,
        color: '#DC2626',
        description: 'Operative treatment of injuries/diseases',
        cases: ['Minimally invasive surgery', 'Trauma surgery', 'Surgical oncology']
    }
];

const testimonials = [
    {
        quote: "This platform has transformed how we handle emergency cases. The real-time collaboration features are game-changing.",
        author: 'Dr. Sarah Johnson',
        role: 'Emergency Physician',
        specialty: 'Emergency Medicine',
        badgeClass: 'role-badge doctor-badge',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        rating: 5
    },
    {
        quote: "As a medical student, the interactive learning modules have been invaluable for my clinical rotations preparation.",
        author: 'Michael Chen',
        role: 'Medical Student',
        specialty: 'Medical Education',
        badgeClass: 'role-badge student-badge',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        rating: 5
    },
    {
        quote: "The specialist matching algorithm saved us crucial time in diagnosing a rare autoimmune condition.",
        author: 'Dr. Emily Smith',
        role: 'Rheumatologist',
        specialty: 'Rheumatology',
        badgeClass: 'role-badge patient-badge',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        rating: 4
    },
    {
        quote: "Our rural clinic benefits immensely from the telemedicine capabilities. It's like having specialists on call 24/7.",
        author: 'Nurse James Wilson',
        role: 'Head Nurse',
        specialty: 'Family Medicine',
        badgeClass: 'role-badge doctor-badge',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        rating: 5
    },
    {
        quote: "The surgical simulation tools have dramatically improved our residency training program's effectiveness.",
        author: 'Dr. Maria Gonzalez',
        role: 'Surgical Resident',
        specialty: 'Surgery',
        badgeClass: 'role-badge student-badge',
        avatar: 'https://randomuser.me/api/portraits/women/72.jpg',
        rating: 5
    }
];

export default App;