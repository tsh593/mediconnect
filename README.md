# MediConnect - AI-Powered Healthcare Provider Matching Platform

**Developed by:** Koushik Vasa & Tasneem Shabana  
**Date:** November 16, 2025

## 📋 Project Overview

MediConnect is a comprehensive healthcare platform that leverages artificial intelligence to match patients with the most suitable healthcare providers. The platform processes a database of 2.8+ million healthcare providers from CMS data and uses Google's Gemini AI to provide intelligent recommendations based on symptoms, location, age, and other criteria.

### Key Features

- **AI-Powered Doctor Matching**: Uses Google Gemini AI to recommend specialists based on patient symptoms
- **Real-Time Availability**: Shows doctor availability with time slot booking system
- **Interactive Maps**: OpenStreetMap integration with street-level geocoding for provider locations
- **Appointment Management**: Book, view, and cancel appointments with email confirmations
- **Community Chat**: Real-time messaging system for healthcare discussions
- **AI Diagnostic Assistant**: Chat with AI for preliminary health information
- **3D Anatomy Viewer**: Interactive 3D models for medical education
- **Authentication System**: Supabase-powered user authentication with avatar support

---

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with Vite for fast development
- **Styling**: Custom CSS with responsive design
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: Client-side navigation
- **Icons**: React Icons (Font Awesome)

### Backend (Node.js + Express)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: File-based JSON storage + CSV processing
- **Email**: Nodemailer with Gmail SMTP
- **API**: RESTful endpoints

### AI Integration
- **Primary AI**: Google Gemini AI (gemini-1.5-flash)
- **Use Cases**:
  - Specialty recommendation based on symptoms
  - Match percentage calculation
  - Diagnostic assistance
  - Medical education content

---

## 🛠️ Technology Stack

### Frontend Dependencies
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-icons": "^4.x",
  "@supabase/supabase-js": "^2.x",
  "uuid": "^9.x"
}
```

### Backend Dependencies
```json
{
  "express": "^4.x",
  "cors": "^2.x",
  "dotenv": "^16.x",
  "csv-parser": "^3.x",
  "nodemailer": "^6.x",
  "node-fetch": "^2.x",
  "@google/generative-ai": "^0.x"
}
```

### External APIs & Services

1. **Google Gemini AI**
   - Model: `gemini-1.5-flash`
   - Purpose: Specialty recommendation, diagnostics, match scoring
   - Required: API Key

2. **OpenStreetMap Nominatim**
   - Service: Geocoding (address → coordinates)
   - Rate Limit: 1 request/second
   - No API key required

3. **Supabase**
   - Authentication & user management
   - Real-time chat database
   - File storage for avatars
   - Required: Project URL & Anon Key

4. **Gmail SMTP**
   - Appointment confirmation emails
   - Required: Gmail account & App Password

---

## 🔑 Required API Keys & Configuration

### 1. Google Gemini AI API Key
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
**How to get:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `frontend/.env`

### 2. Supabase Configuration
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
**How to get:**
1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy Project URL and anon/public key
5. Add to `frontend/.env`

### 3. Gmail SMTP Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```
**How to get App Password:**
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → 2-Step Verification → App Passwords
3. Generate new app password for "Mail"
4. Add to `backend/.env`

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd mediconnect-main
```

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
# Add the following:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password

# Ensure CSV data file exists at:
# backend/data/cms-doctors-clinicians.csv
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
# Add the following:
# VITE_GEMINI_API_KEY=your_gemini_api_key
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Database Setup (CSV)
The project uses CMS healthcare provider data. Ensure the file exists at:
```
backend/data/cms-doctors-clinicians.csv
```

**CSV Structure:**
- 2,829,975+ provider records
- Columns: NPI, name, specialty, address, city, state, zip, phone, etc.

---

## 🚀 Running the Application

### Development Mode

#### Terminal 1 - Backend
```bash
cd backend
npm start
```
Server runs at: `http://localhost:3001`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Application runs at: `http://localhost:5173`

### Production Build
```bash
cd frontend
npm run build
```

---

## 🔌 API Endpoints

### Doctor Search
```
GET /api/doctors/search
Query Parameters:
  - location: string (e.g., "Fairfax, VA")
  - symptoms: string (e.g., "headache, fever")
  - age: number
  - specialty: string (optional)
  - limit: number (default: 10)
```

### Bookings
```
GET    /api/bookings/availability?doctorId=X&date=YYYY-MM-DD
POST   /api/bookings
GET    /api/bookings?userEmail=user@example.com
DELETE /api/bookings/:id
```

### Health Check
```
GET /health
```

---

## 📂 Project Structure

```
mediconnect-main/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Anatomy3DViewer.jsx
│   │   │   ├── AuthModal.jsx
│   │   │   ├── ChatModal.jsx
│   │   │   ├── NewMapComponent.jsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── googleGenAIService.js      # Gemini AI integration
│   │   │   ├── bookingService.js          # Appointment API
│   │   │   ├── cmsApiService.js           # Doctor search API
│   │   │   └── freeMapsService.js         # Geocoding & maps
│   │   ├── hooks/
│   │   │   └── useSupabase.js
│   │   ├── App.jsx                        # Main component
│   │   ├── main.jsx                       # Entry point
│   │   └── *.css                          # Styling
│   ├── public/
│   │   └── models/                        # 3D anatomy models
│   ├── .env                               # API keys (not committed)
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   │   └── doctorsControllerUltraStrict.js
│   ├── routes/
│   │   ├── doctors.js
│   │   ├── bookings.js
│   │   └── specialtyRoutes.js
│   ├── services/
│   │   ├── csvProcessorUltraStrict.js     # CSV data processing
│   │   ├── bookingFileStore.js            # Appointment storage
│   │   ├── emailService.js                # SMTP emails
│   │   └── specialtyRecommender.js        # AI specialty matching
│   ├── data/
│   │   ├── cms-doctors-clinicians.csv     # 2.8M+ providers
│   │   └── bookings.json                  # Appointment data
│   ├── .env                               # SMTP config (not committed)
│   ├── server.js                          # Main server
│   └── package.json
│
└── README.md
```

---

## 🎯 Core Features Explained

### 1. AI-Powered Specialty Recommendation
- **Input**: Patient symptoms, age, gender
- **Process**: Gemini AI analyzes symptoms and recommends medical specialty
- **Output**: Specialty name + confidence score
- **File**: `frontend/src/services/googleGenAIService.js`

### 2. Doctor Search & Matching
- **Database**: 2,829,975 providers from CMS
- **Filters**: Location (city/state), specialty, age-appropriate care
- **Matching**: AI-calculated match percentage (90-95% typical)
- **Results**: Top 10 providers sorted by match score
- **File**: `backend/controllers/doctorsControllerUltraStrict.js`

### 3. Geocoding & Maps
- **Service**: OpenStreetMap Nominatim API
- **Process**: Converts street addresses to GPS coordinates
- **Rate Limiting**: 1 request/second (respects API policy)
- **Caching**: Stores coordinates to minimize API calls
- **Display**: Interactive map with provider markers
- **Files**: 
  - `frontend/src/components/NewMapComponent.jsx`
  - `backend/controllers/doctorsControllerUltraStrict.js` (geocoding)

### 4. Appointment Booking System
- **Time Slots**: 09:00-17:00, 30-minute intervals
- **Conflict Prevention**: Checks for double-bookings
- **Confirmation**: Email sent via Gmail SMTP
- **Storage**: JSON file-based persistence
- **Files**:
  - `backend/services/bookingFileStore.js`
  - `backend/services/emailService.js`
  - `frontend/src/services/bookingService.js`

### 5. Real-Time Chat
- **Backend**: Supabase Realtime Database
- **Features**: User avatars, timestamps, message history
- **Authentication**: Linked to Supabase Auth
- **File**: `frontend/src/components/ChatModal.jsx`

### 6. 3D Anatomy Viewer
- **Format**: GLB (3D models)
- **Location**: `frontend/public/models/`
- **Component**: `Anatomy3DViewer.jsx`
- **Purpose**: Medical education and visualization

---

## 🔒 Security Considerations

- **Environment Variables**: Never commit `.env` files
- **API Keys**: Store securely, rotate regularly
- **SMTP Credentials**: Use App Passwords, not main password
- **Supabase RLS**: Enable Row Level Security policies
- **Input Validation**: Sanitize user inputs on backend
- **Rate Limiting**: Respect external API limits (OSM: 1 req/sec)

---

## 🐛 Debugging Tools

The application includes a built-in debug panel:

- **Access**: Click 🔧 icon in bottom-right corner
- **Features**:
  - Test AI connection
  - Test CMS API
  - Test backend connection
  - View user data
  - Check environment variables

---

## 📊 Performance Optimizations

1. **Geocoding Cache**: Stores address coordinates in memory
2. **Unique Address Detection**: Only geocodes unique addresses (5 instead of 10)
3. **CSV Loading**: Async loading with 2.8M records (3-5 seconds)
4. **Rate Limiting**: Sequential geocoding to avoid API blocks
5. **Lazy Loading**: 3D models loaded on demand

---

## 🚨 Common Issues & Solutions

### Backend Won't Start
- Ensure `cms-doctors-clinicians.csv` exists
- Check Node.js version (v16+)
- Verify `.env` file in backend directory

### No Doctors Appearing
- Check backend console for CSV loading confirmation
- Verify location matches CSV data (e.g., "Fairfax, VA")
- Test backend: `http://localhost:3001/health`

### Geocoding Fails
- Check internet connection
- Respect 1-second rate limit
- Fallback to city coordinates if street address fails

### Email Confirmations Not Sending
- Verify Gmail SMTP credentials in `backend/.env`
- Ensure App Password (not regular password)
- Check 2FA is enabled on Gmail account

### Supabase Errors
- Verify URL and anon key in `frontend/.env`
- Check Supabase project is active
- Ensure tables are created (chat, users)

---

## 📈 Future Enhancements

- [ ] Add payment processing for appointment fees
- [ ] Implement telemedicine video calls
- [ ] Multi-language support
- [ ] Insurance verification integration
- [ ] Medical records upload/storage
- [ ] Doctor review and rating system
- [ ] SMS appointment reminders
- [ ] Calendar sync (Google, Outlook)

---

## 📝 License

[Add your license information here]

---

## 🤝 Contributors

- **Koushik Vasa** - Developer
- **Tasneem Shabana** - Developer

---

## 📞 Support

For issues or questions, please contact the development team or create an issue in the repository.

---

## 🙏 Acknowledgments

- **CMS** - Healthcare provider data
- **Google** - Gemini AI API
- **Supabase** - Authentication & database
- **OpenStreetMap** - Geocoding services
- **React Team** - Frontend framework
- **Express.js** - Backend framework

