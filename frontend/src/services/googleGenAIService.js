// googleGenAIService.js - Enhanced with latest Gemini 2.5 models and advanced features
import { GoogleGenerativeAI } from "@google/generative-ai";

class GoogleAIService {
    constructor() {
        this.ai = null;
        this.isConfigured = false;
        this.availableModels = [
            'gemini-2.5-flash',  // Latest Flash model
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro'
        ];
        this.currentModelIndex = 0;
        this.lastRequestTime = 0;
        this.REQUEST_DEBOUNCE_MS = 1000;
        this.initializeAI();
    }

    initializeAI() {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

        console.group('🔧 Enhanced Google GenAI SDK Configuration');

        if (!API_KEY) {
            console.error('❌ VITE_GEMINI_API_KEY is missing');
            console.groupEnd();
            return;
        }

        if (API_KEY.includes('your-api-key') || API_KEY.length < 30) {
            console.error('❌ API key appears to be invalid');
            console.groupEnd();
            return;
        }

        console.log('✅ API Key: Valid');
        console.log('📏 Length:', API_KEY.length);
        console.log('🔑 Preview:', API_KEY.substring(0, 8) + '...');
        console.log('🚀 Available Models:', this.availableModels);

        try {
            this.ai = new GoogleGenerativeAI(API_KEY);

            // Verify initialization
            if (this.ai) {
                console.log('🔍 GoogleGenerativeAI instance created successfully');
            }

            this.isConfigured = true;
            console.log('✅ Enhanced Google GenAI SDK initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Google GenAI:', error);
            this.isConfigured = false;
            this.ai = null;
        }

        console.groupEnd();
    }

    async tryNextModel() {
        this.currentModelIndex++;
        if (this.currentModelIndex >= this.availableModels.length) {
            throw new Error('All models failed');
        }
        console.log(`🔄 Switching to model: ${this.availableModels[this.currentModelIndex]}`);
        return true;
    }

    // Enhanced medical knowledge base with comprehensive data
    getMedicalKnowledgeBase() {
        return {
            'headache': {
                differential: [
                    "Migraine: Unilateral, throbbing, with aura/nausea, photophobia",
                    "Tension-type headache: Bilateral, pressing, band-like, mild-moderate",
                    "Cluster headache: Severe unilateral periorbital/temporal, autonomic features",
                    "Medication overuse headache: Chronic daily headache, rebound pattern",
                    "Sinus headache: Frontal/facial pain with nasal congestion, worse bending forward",
                    "Cervicogenic headache: Unilateral, originates from neck, worse with movement"
                ],
                redFlags: [
                    "Thunderclap onset (seconds to minutes)",
                    "Fever with neck stiffness (meningismus)",
                    "Focal neurological deficits (weakness, visual changes)",
                    "Onset after age 50 (temporal arteritis)",
                    "Worsening with posture changes (increased ICP)",
                    "Headache awakening from sleep",
                    "Progressive worsening over days/weeks"
                ],
                workup: ["Neurological exam", "Blood pressure", "ESR/CRP if >50 years", "Consider neuroimaging if red flags"],
                specialists: ["Neurology", "Primary Care"]
            },
            'chest pain': {
                differential: [
                    "Cardiac: ACS (STEMI/NSTEMI), pericarditis, myocarditis",
                    "Pulmonary: PE, pneumonia, pneumothorax, pleurisy",
                    "GI: GERD, esophageal spasm, PUD, gastritis",
                    "Musculoskeletal: Costochondritis, muscle strain, rib fracture",
                    "Anxiety/Panic attacks: Hyperventilation, palpitations"
                ],
                redFlags: [
                    "Radiation to arm/neck/jaw (cardiac ischemia)",
                    "Associated diaphoresis/nausea/vomiting",
                    "Shortness of breath at rest",
                    "Hemodynamic instability (hypotension, tachycardia)",
                    "Worsening with exertion (angina equivalent)",
                    "History of CAD or multiple risk factors"
                ],
                workup: ["ECG immediately", "Cardiac enzymes", "CXR", "D-dimer if PE suspected", "Cardiac monitoring"],
                specialists: ["Cardiology", "Emergency Medicine", "Primary Care"]
            },
            'abdominal pain': {
                differential: [
                    "Appendicitis: RLQ pain, migration, rebound tenderness, fever",
                    "Cholecystitis: RUQ pain, fever, positive Murphy's sign, nausea",
                    "Pancreatitis: Epigastric pain radiating to back, nausea, vomiting",
                    "Bowel obstruction: Colicky pain, distension, vomiting, obstipation",
                    "Diverticulitis: LLQ pain, fever, leukocytosis, change in bowel habits",
                    "Renal colic: Flank pain radiating to groin, hematuria"
                ],
                redFlags: [
                    "Rebound tenderness/guarding (peritonitis)",
                    "Rigid abdomen (surgical emergency)",
                    "Hemodynamic instability (shock)",
                    "Fever with abdominal pain (infection)",
                    "Unable to pass flatus/stool (obstruction)",
                    "Significant abdominal distension"
                ],
                workup: ["CBC, metabolic panel, lipase", "UA", "LFTs", "CT abdomen if indicated", "Pelvic exam if applicable"],
                specialists: ["General Surgery", "Gastroenterology", "Emergency Medicine"]
            },
            'shortness of breath': {
                differential: [
                    "Cardiac: CHF, ACS, arrhythmia, pericardial effusion",
                    "Pulmonary: COPD exacerbation, asthma, pneumonia, PE",
                    "Anemia: Reduced oxygen-carrying capacity",
                    "Anxiety: Hyperventilation syndrome, panic disorder",
                    "Metabolic: Acidosis, sepsis"
                ],
                redFlags: [
                    "Hypoxemia (SpO2 < 90%)",
                    "Use of accessory muscles",
                    "Altered mental status",
                    "Chest pain with SOB",
                    "Rapid progression over hours"
                ],
                workup: ["Pulse oximetry", "CXR", "ECG", "ABG if severe", "BNP if CHF suspected"],
                specialists: ["Pulmonology", "Cardiology", "Emergency Medicine"]
            }
        };
    }

    getMedicalSystemPrompt() {
        return `You are an advanced medical AI consultant with expertise in clinical reasoning and differential diagnosis. 

CRITICAL INSTRUCTIONS:
- Provide EVIDENCE-BASED medical analysis
- Always consider LIFE-THREATENING conditions first
- Use standard medical terminology and classification
- Structure response EXACTLY as specified below
- Be comprehensive but concise
- Include clinical reasoning for each recommendation

RESPONSE STRUCTURE:

# 🩺 Clinical Analysis: [Chief Complaint]

## 📋 Patient Presentation
- **Chief Complaint:** [symptoms description]
- **Patient Context:** [age, gender, relevant history]
- **Duration & Severity:** [if provided]

## 🔍 Differential Diagnosis (Prioritized)

### 🚨 High Priority - Cannot Miss
• [Condition 1] - [Brief rationale, key features, risk factors]
• [Condition 2] - [Brief rationale, key features, risk factors]

### ⚠️ Moderate Priority  
• [Condition 3] - [Brief rationale, distinguishing features]
• [Condition 4] - [Brief rationale, distinguishing features]

### 💚 Lower Priority
• [Condition 5] - [Brief rationale, when to consider]

## 💡 Diagnostic Approach

### 🎯 Immediate Workup (First 30-60 minutes)
- **[Test 1]:** [Specific rationale and expected findings]
- **[Test 2]:** [Specific rationale and expected findings]

### 🔬 Further Evaluation (Next 24-48 hours)
- **[Test 3]:** [Rationale and clinical utility]
- **[Test 4]:** [Rationale and clinical utility]

## 🚨 Emergency Red Flags
- [Specific symptom/sign] → [Immediate action required]
- [Specific symptom/sign] → [Emergency consultation needed]

## 👥 Specialist Referral Recommendations
- **Primary:** [Specialty 1] - [Urgency and reason]
- **Secondary:** [Specialty 2] - [If initial approach inconclusive]

## 📝 Clinical Pearls & Management
- [Key clinical pearl 1 - practical tip]
- [Key clinical pearl 2 - monitoring advice]
- [Initial management while awaiting specialist evaluation]

---
*💡 Educational Note: This analysis synthesizes current medical evidence but requires verification through appropriate clinical evaluation. Always consult relevant specialists and consider individual patient factors.*`;
    }

    // Enhanced AI diagnosis with debouncing and advanced features
    async getAIDiagnosis(symptoms, patientInfo = {}) {
        // Request debouncing
        const now = Date.now();
        if (now - this.lastRequestTime < this.REQUEST_DEBOUNCE_MS) {
            console.log('⏳ Skipping duplicate AI request (debounced)');
            return this.getEnhancedFallbackResponse(symptoms, patientInfo, 'Request too frequent');
        }
        this.lastRequestTime = now;

        console.group('🏥 Enhanced Google GenAI Diagnosis Request');
        console.log('📋 Symptoms:', symptoms);
        console.log('👤 Patient Info:', patientInfo);
        console.groupEnd();

        if (!this.isConfigured || !this.ai) {
            return this.getEnhancedFallbackResponse(symptoms, patientInfo, 'AI service not configured');
        }

        try {
            const { age, gender, medicalHistory, duration, severity, medications, allergies } = patientInfo;
            const modelName = this.availableModels[this.currentModelIndex];

            // Build comprehensive medical prompt
            const systemPrompt = this.getMedicalSystemPrompt();

            const userPrompt = `PATIENT PRESENTATION:

CHIEF COMPLAINT: ${symptoms}

PATIENT CONTEXT:
${age ? `• Age: ${age}` : ''}
${gender ? `• Gender: ${gender}` : ''}
${medicalHistory ? `• Medical History: ${medicalHistory}` : ''}
${duration ? `• Duration: ${duration}` : ''}
${severity ? `• Severity: ${severity}` : ''}
${medications ? `• Current Medications: ${medications}` : ''}
${allergies ? `• Allergies: ${allergies}` : ''}

Please provide a comprehensive clinical analysis following the specified structure. Focus on evidence-based recommendations and prioritize life-threatening conditions.`;

            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

            console.log(`🚀 Sending request to ${modelName}...`);

            // Use same API as backend: getGenerativeModel() then generateContent()
            const model = this.ai.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(fullPrompt);
            const responseText = result.response.text();

            console.log(`✅ ${modelName} response received successfully`);

            return {
                success: true,
                response: responseText,
                fallback: false,
                timestamp: new Date().toISOString(),
                model: modelName,
                symptoms: symptoms,
                patientContext: patientInfo
            };

        } catch (error) {
            console.error('💥 Google GenAI error:', error);
            console.error('Error details:', {
                message: error.message,
                model: modelName,
                triedModels: triedModels,
                availableModels: this.availableModels
            });

            // Try next model if available
            try {
                await this.tryNextModel();
                return this.getAIDiagnosis(symptoms, patientInfo);
            } catch (fallbackError) {
                console.error('💥 All models failed, using enhanced medical fallback');
                return this.getEnhancedFallbackResponse(symptoms, patientInfo, error.message);
            }
        }
    }

    // Advanced medical analysis for complex cases
    async getAdvancedMedicalAnalysis(casePresentation) {
        if (!this.isConfigured || !this.ai) {
            return {
                success: false,
                error: 'AI service unavailable',
                fallback: true
            };
        }

        try {
            const modelName = this.availableModels[this.currentModelIndex];

            const prompt = `
As a senior medical consultant, perform an in-depth analysis of this complex case:

CASE PRESENTATION:
${casePresentation}

Please provide:
1. COMPREHENSIVE DIFFERENTIAL DIAGNOSIS (Prioritized list with probabilities)
2. DIAGNOSTIC REASONING (Your clinical thought process step-by-step)
3. CRITICAL TESTS (Labs/imaging that would be most informative with rationale)
4. TREATMENT CONSIDERATIONS (Initial management strategies)
5. CONSULTATION RECOMMENDATIONS (Which specialists to involve and when)
6. PROGNOSTIC FACTORS (What affects short-term and long-term outcomes)
7. PATIENT COMMUNICATION (How to discuss findings and uncertainties with patient)

Format with detailed explanations and clinical reasoning. Use medical evidence where available.
`;

            // Use same API as backend: getGenerativeModel() then generateContent()
            const model = this.ai.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            return {
                success: true,
                response: responseText,
                model: modelName,
                timestamp: new Date().toISOString(),
                analysisType: 'advanced_medical_analysis'
            };

        } catch (error) {
            console.error('Advanced medical analysis error:', error);
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    getEnhancedFallbackResponse(symptoms, patientInfo = {}, error = null) {
        const inputLower = symptoms.toLowerCase();
        const knowledgeBase = this.getMedicalKnowledgeBase();

        let responseKey = 'headache';
        if (inputLower.includes('chest') || inputLower.includes('heart')) {
            responseKey = 'chest pain';
        } else if (inputLower.includes('abdominal') || inputLower.includes('stomach')) {
            responseKey = 'abdominal pain';
        } else if (inputLower.includes('breath') || inputLower.includes('sob') || inputLower.includes('dyspnea')) {
            responseKey = 'shortness of breath';
        }

        const knowledge = knowledgeBase[responseKey];
        const { age, gender, medicalHistory, duration, severity } = patientInfo;

        let context = [];
        if (age) context.push(`${age} year old`);
        if (gender) context.push(gender);
        if (medicalHistory) context.push(`PMH: ${medicalHistory}`);
        if (duration) context.push(`Duration: ${duration}`);
        if (severity) context.push(`Severity: ${severity}`);

        const contextText = context.length > 0 ? `\n- **Patient Context:** ${context.join(', ')}` : '';

        let response = `# 🩺 Clinical Analysis: ${symptoms}\n\n`;

        if (error) {
            response += `*Note: AI service temporarily unavailable. Using enhanced medical knowledge base.*\n\n`;
        }

        response += `## 📋 Patient Presentation\n`;
        response += `- **Chief Complaint:** ${symptoms}${contextText}\n\n`;

        response += `## 🔍 Differential Diagnosis\n`;
        response += `### 🚨 High Priority - Cannot Miss\n`;
        knowledge.differential.slice(0, 2).forEach((dx, index) => {
            response += `• ${dx}\n`;
        });

        response += `\n### ⚠️ Moderate Priority\n`;
        knowledge.differential.slice(2, 4).forEach((dx, index) => {
            response += `• ${dx}\n`;
        });

        response += `\n### 💚 Lower Priority\n`;
        knowledge.differential.slice(4, 6).forEach((dx, index) => {
            response += `• ${dx}\n`;
        });

        response += `\n## 🚨 Emergency Red Flags\n`;
        knowledge.redFlags.forEach((flag, index) => {
            response += `• ${flag}\n`;
        });

        response += `\n## 💡 Diagnostic Approach\n`;
        response += `### 🎯 Immediate Workup\n`;
        knowledge.workup.forEach((test, index) => {
            response += `- ${test}\n`;
        });

        response += `\n## 👥 Specialist Referral\n`;
        response += `- **Primary:** ${knowledge.specialists[0]}\n`;
        if (knowledge.specialists[1]) {
            response += `- **Secondary:** ${knowledge.specialists[1]}\n`;
        }

        response += `\n## 📝 Clinical Pearls\n`;
        response += `• Always rule out life-threatening conditions first\n`;
        response += `• Consider patient's risk factors and comorbidities\n`;
        response += `• Time-sensitive conditions require immediate intervention\n`;
        response += `• Document thorough history and physical examination findings\n`;

        response += `\n---\n`;
        response += `*💡 Educational Note: This enhanced fallback analysis is based on medical knowledge base. Always verify through appropriate clinical evaluation and consult specialists.*`;

        return {
            success: !error,
            response: response,
            error: error,
            fallback: true,
            model: 'enhanced-medical-knowledge-base',
            timestamp: new Date().toISOString(),
            symptoms: symptoms,
            patientContext: patientInfo
        };
    }

    async testConnection() {
        if (!this.isConfigured) {
            return {
                success: false,
                error: 'Service not configured. Check VITE_GEMINI_API_KEY',
                step: 'configuration'
            };
        }

        console.group('🧪 Testing Enhanced Google GenAI SDK Connection');

        try {
            const modelName = this.availableModels[this.currentModelIndex];
            console.log(`🔬 Testing model: ${modelName}`);

            // Use same API as backend: getGenerativeModel() then generateContent()
            const model = this.ai.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Medical system diagnostic check: Respond with 'Enhanced Medical AI System - Operational' and current capabilities summary.");
            const responseText = result.response.text();

            console.log(`✅ ${modelName} SUCCESS!`);
            console.log(`📝 Response: "${responseText}"`);
            console.groupEnd();

            return {
                success: true,
                response: responseText,
                model: modelName,
                step: 'google_genai_connection',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Google GenAI test failed:', error);

            try {
                await this.tryNextModel();
                return this.testConnection();
            } catch (fallbackError) {
                console.groupEnd();
                return {
                    success: false,
                    error: 'All Google GenAI models failed: ' + error.message,
                    step: 'google_genai_connection'
                };
            }
        }
    }

    async getMedicalEducation(topic) {
        if (!this.isConfigured || !this.ai) {
            return {
                success: true,
                response: this.getFallbackMedicalEducation(topic),
                fallback: true
            };
        }

        try {
            const modelName = this.availableModels[this.currentModelIndex];

            const prompt = `Create comprehensive medical education content about: ${topic}

Structure with:
1. LEARNING OBJECTIVES (3-5 key takeaways)
2. PATHOPHYSIOLOGY (Underlying disease mechanisms)
3. CLINICAL PRESENTATION (Typical signs and symptoms)
4. DIAGNOSTIC CRITERIA (How the condition is diagnosed)
5. TREATMENT APPROACHES (Current evidence-based guidelines)
6. PROGNOSIS & COMPLICATIONS (Expected outcomes and risks)
7. PREVENTION STRATEGIES (If applicable)
8. PATIENT RESOURCES (Reliable sources for further information)

Use markdown formatting with clear headings. Include recent guidelines if available.`;

            // Use same API as backend: getGenerativeModel() then generateContent()
            const model = this.ai.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            return {
                success: true,
                response: responseText,
                fallback: false,
                model: modelName,
                topic: topic,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Medical education AI error:', error);
            return {
                success: true,
                response: this.getFallbackMedicalEducation(topic),
                fallback: true,
                error: error.message
            };
        }
    }

    getFallbackMedicalEducation(topic) {
        return `# ${topic} - Medical Education

## Learning Objectives
* Understand the basic concepts of ${topic}
* Recognize common clinical presentations
* Learn initial diagnostic approaches

## Overview
${topic} represents an important medical condition that requires proper evaluation and management. This content is temporarily unavailable via AI services.

## Recommended Resources
• UpToDate - Comprehensive clinical resource
• Mayo Clinic - Patient-friendly information
• CDC/NIH guidelines - Evidence-based recommendations
• Professional society guidelines

*Note: AI-generated medical education content is temporarily unavailable. Please consult the above reliable medical sources for comprehensive information about ${topic}.*`;
    }

    // List available models for debugging and selection
    async listModels() {
        try {
            if (!this.ai) {
                console.warn('AI not initialized');
                return [];
            }

            // Note: The @google/generative-ai SDK doesn't have a direct listModels method
            // We'll return our predefined available models
            console.log('🚀 Available Models in Service:', this.availableModels);

            return this.availableModels.map(model => ({
                name: model,
                available: true,
                description: this.getModelDescription(model)
            }));
        } catch (error) {
            console.error('Error listing models:', error);
            return [];
        }
    }

    getModelDescription(modelName) {
        const descriptions = {
            'gemini-2.5-flash-exp': 'Latest Flash model with expanded capabilities - Fast and efficient',
            'gemini-2.5-pro-exp': 'Latest Pro model with expanded reasoning - Most capable',
            'gemini-2.0-flash': 'Fast and versatile for general medical queries',
            'gemini-2.0-flash-thinking-exp': 'Enhanced reasoning capabilities for complex cases',
            'gemini-2.0-pro': 'Advanced reasoning for detailed medical analysis',
            'gemini-1.5-flash': 'Reliable and fast for standard medical queries',
            'gemini-1.5-pro': 'Pro-level analysis with extensive context window'
        };

        return descriptions[modelName] || 'General medical AI model';
    }

    // Set specific model for use
    setModel(modelIndex) {
        if (modelIndex >= 0 && modelIndex < this.availableModels.length) {
            this.currentModelIndex = modelIndex;
            console.log(`🎯 Model set to: ${this.availableModels[modelIndex]}`);
            return true;
        }
        return false;
    }

    // Get current model info
    getCurrentModel() {
        return {
            name: this.availableModels[this.currentModelIndex],
            index: this.currentModelIndex,
            description: this.getModelDescription(this.availableModels[this.currentModelIndex])
        };
    }

    // Simple specialty matching - direct prompt without medical system prompt
    async matchSymptomsToSpecialty(symptoms, availableSpecialties, patientInfo = {}) {
        if (!this.isConfigured || !this.ai) {
            return {
                success: false,
                error: 'AI service not configured',
                fallback: true
            };
        }

        // Validate that specialties are provided
        if (!availableSpecialties || availableSpecialties.length === 0) {
            console.error('❌ No available specialties provided to matchSymptomsToSpecialty');
            return {
                success: false,
                error: 'No available specialties from database. Please ensure CSV data is loaded.',
                fallback: true
            };
        }

        try {
            const modelName = this.availableModels[this.currentModelIndex];
            const { age, gender } = patientInfo;
            
            // Use up to 50 specialties to ensure we include enough options
            const specialtyList = availableSpecialties.slice(0, 50).join(', ');
            
            console.log(`🤖 Matching symptoms to specialty using ${availableSpecialties.length} available specialties from CSV`);

            const prompt = `You are a medical AI assistant helping to match patient symptoms to the most appropriate medical specialty from our database.

PATIENT SYMPTOMS: ${symptoms}
${age ? `PATIENT AGE: ${age}` : ''}
${gender ? `PATIENT GENDER: ${gender}` : ''}

AVAILABLE SPECIALTIES (from our CSV database - you MUST choose from this list):
${specialtyList}

INSTRUCTIONS:
1. Analyze the patient's symptoms carefully
2. Consider the patient's age if provided
3. Identify the SINGLE MOST APPROPRIATE specialty from the list above
4. Respond with ONLY the specialty name (exactly as it appears in the list above, matching the case)
5. If the exact specialty is not in the list, choose the CLOSEST match from the available specialties
6. Do NOT include any explanation, just the specialty name

Example responses:
- "CARDIOLOGY"
- "PEDIATRICS"
- "FAMILY PRACTICE"

Your response (specialty name only):`;

            // Use same API as backend: getGenerativeModel() then generateContent()
            const model = this.ai.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            return {
                success: true,
                response: responseText,
                fallback: false,
                model: modelName,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Specialty matching error:', error);
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    // Predict consultation fee using Gemini AI based on specialty and region
    async predictConsultationFee(specialty, region, experience = null) {
        if (!this.isConfigured || !this.ai) {
            return {
                success: false,
                fee: this.getFallbackFee(specialty),
                fallback: true
            };
        }

        try {
            const modelName = this.availableModels[this.currentModelIndex];
            
            const prompt = `You are a healthcare cost estimation AI. Predict the average consultation fee for a medical specialist.

SPECIALTY: ${specialty}
REGION/LOCATION: ${region}
${experience ? `EXPERIENCE: ${experience} years` : ''}

Based on current US healthcare market rates for ${specialty} in ${region}, provide:
1. A realistic average consultation fee in USD (just the number, no currency symbol)
2. Consider factors like:
   - Specialty complexity and demand
   - Regional cost of living
   - Typical insurance reimbursement rates
   - Market rates for this specialty

Respond with ONLY a number between 50 and 500 representing the average consultation fee in USD.
Example responses: 150, 200, 275, 120

Your response (number only):`;

            // Use same API as backend: getGenerativeModel() then generateContent()
            const model = this.ai.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            let fee = parseInt(responseText.trim().replace(/[^0-9]/g, ''));
            
            // Validate and clamp the fee
            if (isNaN(fee) || fee < 50) fee = this.getFallbackFee(specialty);
            if (fee > 500) fee = 500;
            if (fee < 50) fee = 50;

            console.log(`💰 Gemini predicted consultation fee: $${fee} for ${specialty} in ${region}`);

            return {
                success: true,
                fee: fee,
                fallback: false,
                model: modelName,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error predicting consultation fee:', error);
            return {
                success: false,
                fee: this.getFallbackFee(specialty),
                fallback: true,
                error: error.message
            };
        }
    }

    getFallbackFee(specialty) {
        // Fallback fees based on specialty
        const specialtyFees = {
            'CARDIOLOGY': 250,
            'NEUROLOGY': 280,
            'ORTHOPEDIC SURGERY': 300,
            'DERMATOLOGY': 200,
            'PULMONOLOGY': 240,
            'GASTROENTEROLOGY': 220,
            'ONCOLOGY': 350,
            'UROLOGY': 230,
            'GYNECOLOGY': 200,
            'OPHTHALMOLOGY': 180,
            'OTOLARYNGOLOGY': 210,
            'PSYCHIATRY': 200,
            'PEDIATRICS': 150,
            'FAMILY PRACTICE': 120,
            'INTERNAL MEDICINE': 180
        };

        const specialtyUpper = (specialty || '').toUpperCase();
        for (const [key, fee] of Object.entries(specialtyFees)) {
            if (specialtyUpper.includes(key) || key.includes(specialtyUpper)) {
                return fee;
            }
        }

        return 180; // Default average
    }
}

// Create singleton instance
const googleAIService = new GoogleAIService();

// Export functions
export const getAIDiagnosis = (symptoms, patientInfo) => googleAIService.getAIDiagnosis(symptoms, patientInfo);
export const testAIConnection = () => googleAIService.testConnection();
export const getMedicalEducation = (topic) => googleAIService.getMedicalEducation(topic);
export const getAdvancedMedicalAnalysis = (casePresentation) => googleAIService.getAdvancedMedicalAnalysis(casePresentation);
export const matchSymptomsToSpecialty = (symptoms, availableSpecialties, patientInfo) => googleAIService.matchSymptomsToSpecialty(symptoms, availableSpecialties, patientInfo);
export const predictConsultationFee = (specialty, region, experience) => googleAIService.predictConsultationFee(specialty, region, experience);
export const listModels = () => googleAIService.listModels();
export const setAIModel = (modelIndex) => googleAIService.setModel(modelIndex);
export const getCurrentModel = () => googleAIService.getCurrentModel();

export default googleAIService;