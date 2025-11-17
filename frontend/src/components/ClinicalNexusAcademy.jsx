import React, { useState } from 'react';
import {
    FaBookOpen,
    FaQuestionCircle,
    FaUserFriends,
    FaPlay,
    FaStar,
    FaClock,
    FaUsers,
    FaGraduationCap,
    FaChartLine,
    FaTrophy,
    FaChevronRight,
    FaTimes,
    FaExpand,
    FaCompress
} from 'react-icons/fa';
import '../ClinicalNexusAcademy.css';

const ClinicalNexusAcademy = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('cases');
    const [selectedCase, setSelectedCase] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(true); // Default to full screen

    const features = [
        {
            icon: <FaBookOpen />,
            title: "Case Library",
            description: "500+ real clinical cases with step-by-step guidance",
            color: "#8B5CF6",
            count: "527 Cases"
        },
        {
            icon: <FaQuestionCircle />,
            title: "Interactive Quizzes",
            description: "Test your knowledge with adaptive learning paths",
            color: "#10B981",
            count: "1.2K Quizzes"
        },
        {
            icon: <FaUserFriends />,
            title: "Mentor Support",
            description: "1-on-1 guidance from experienced clinicians",
            color: "#EC4899",
            count: "245 Mentors"
        },
        {
            icon: <FaGraduationCap />,
            title: "Grand Rounds",
            description: "Live peer-to-peer case discussions",
            color: "#3B82F6",
            count: "Live Weekly"
        }
    ];

    const caseStudies = [
        {
            id: 1,
            title: "Acute Chest Pain - Emergency Medicine",
            difficulty: "Intermediate",
            duration: "45 min",
            rating: 4.8,
            participants: 1247,
            specialty: "Cardiology",
            description: "Manage a 58-year-old male presenting with acute chest pain and risk factors for CAD."
        },
        {
            id: 2,
            title: "Pediatric Fever Workup",
            difficulty: "Beginner",
            duration: "30 min",
            rating: 4.6,
            participants: 892,
            specialty: "Pediatrics",
            description: "Evaluate and manage a 3-year-old with high fever and no localizing signs."
        },
        {
            id: 3,
            title: "Neurological Deficit - Stroke Protocol",
            difficulty: "Advanced",
            duration: "60 min",
            rating: 4.9,
            participants: 567,
            specialty: "Neurology",
            description: "Rapid assessment and management of acute ischemic stroke in the ED."
        }
    ];

    const quizzes = [
        {
            id: 1,
            title: "ECG Interpretation Mastery",
            questions: 25,
            time: "20 min",
            topic: "Cardiology",
            completed: "78%"
        },
        {
            id: 2,
            title: "Antibiotic Stewardship",
            questions: 15,
            time: "15 min",
            topic: "Infectious Diseases",
            completed: "45%"
        },
        {
            id: 3,
            title: "Fluid & Electrolytes",
            questions: 20,
            time: "25 min",
            topic: "Nephrology",
            completed: "62%"
        }
    ];

    return (
        <div className={`clinical-nexus-academy ${isFullScreen ? 'full-screen' : ''}`}>
            {/* Enhanced Header Section */}
            <div className="cna-header">
                <div className="cna-hero">
                    <div className="hero-content">
                        <div className="hero-badge-container">
                            <div className="audience-badge">
                                <FaUsers className="badge-icon" />
                                For Students & Residents
                            </div>
                            <div className="progress-badge">
                                <FaChartLine className="badge-icon" />
                                Track Your Progress
                            </div>
                        </div>
                        <h1 className="cna-title">
                            Clinical Nexus <span className="title-accent">Academy</span>
                        </h1>
                        <p className="cna-subtitle">
                            Where Clinical Reasoning Meets Immersive Learning
                        </p>
                        <p className="cna-description">
                            Step into our virtual teaching hospital with <strong>500+ real cases</strong>,
                            <strong> AI-powered simulations</strong>, and <strong>live grand rounds</strong>.
                            Transform theoretical knowledge into clinical mastery through hands-on case simulations
                            and expert mentorship.
                        </p>
                        <div className="hero-stats">
                            <div className="stat">
                                <div className="stat-number">15K+</div>
                                <div className="stat-label">Active Learners</div>
                            </div>
                            <div className="stat">
                                <div className="stat-number">98%</div>
                                <div className="stat-label">Satisfaction Rate</div>
                            </div>
                            <div className="stat">
                                <div className="stat-number">500+</div>
                                <div className="stat-label">Real Cases</div>
                            </div>
                            <div className="stat">
                                <div className="stat-number">24/7</div>
                                <div className="stat-label">Access</div>
                            </div>
                        </div>
                        <div className="hero-actions">
                            <button className="hero-btn primary">
                                <FaPlay /> Start Learning Journey
                            </button>
                            <button className="hero-btn secondary">
                                Explore Curriculum
                            </button>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="floating-cards">
                            <div className="floating-card card-1">
                                <FaBookOpen />
                                <span>Interactive Cases</span>
                            </div>
                            <div className="floating-card card-2">
                                <FaQuestionCircle />
                                <span>Adaptive Quizzes</span>
                            </div>
                            <div className="floating-card card-3">
                                <FaUserFriends />
                                <span>Expert Mentors</span>
                            </div>
                            <div className="floating-card card-4">
                                <FaGraduationCap />
                                <span>Live Rounds</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="features-section">
                <h2 className="section-title">Your Learning Pathways</h2>
                <p className="section-subtitle">
                    Choose your adventure in clinical mastery - from foundational skills to advanced specialty training
                </p>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card" style={{ borderLeftColor: feature.color }}>
                            <div className="feature-icon" style={{ color: feature.color }}>
                                {feature.icon}
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                            <div className="feature-count">{feature.count}</div>
                            <button className="feature-action-btn" style={{ backgroundColor: feature.color }}>
                                Explore <FaChevronRight />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="main-content">
                <div className="content-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cases')}
                    >
                        <FaBookOpen /> Case Studies
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('quizzes')}
                    >
                        <FaQuestionCircle /> Quizzes
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'mentors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mentors')}
                    >
                        <FaUserFriends /> Find Mentors
                    </button>
                </div>

                {/* Cases Tab */}
                {activeTab === 'cases' && (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h3>Interactive Case Library</h3>
                            <p>Practice clinical decision-making with real patient scenarios</p>
                        </div>
                        <div className="cases-grid">
                            {caseStudies.map((caseStudy) => (
                                <div key={caseStudy.id} className="case-card">
                                    <div className="case-header">
                                        <div className="case-specialty">{caseStudy.specialty}</div>
                                        <div className={`case-difficulty ${caseStudy.difficulty.toLowerCase()}`}>
                                            {caseStudy.difficulty}
                                        </div>
                                    </div>
                                    <h4 className="case-title">{caseStudy.title}</h4>
                                    <p className="case-description">{caseStudy.description}</p>
                                    <div className="case-meta">
                                        <div className="meta-item">
                                            <FaClock />
                                            {caseStudy.duration}
                                        </div>
                                        <div className="meta-item">
                                            <FaStar />
                                            {caseStudy.rating}
                                        </div>
                                        <div className="meta-item">
                                            <FaUsers />
                                            {caseStudy.participants}
                                        </div>
                                    </div>
                                    <button className="start-case-btn">
                                        <FaPlay /> Start Case
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quizzes Tab */}
                {activeTab === 'quizzes' && (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h3>Knowledge Assessment</h3>
                            <p>Test your understanding with adaptive quizzes and track your progress</p>
                        </div>
                        <div className="quizzes-grid">
                            {quizzes.map((quiz) => (
                                <div key={quiz.id} className="quiz-card">
                                    <div className="quiz-header">
                                        <div className="quiz-topic">{quiz.topic}</div>
                                        <div className="quiz-progress">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: quiz.completed }}
                                                ></div>
                                            </div>
                                            <span>{quiz.completed}</span>
                                        </div>
                                    </div>
                                    <h4 className="quiz-title">{quiz.title}</h4>
                                    <div className="quiz-meta">
                                        <div className="meta-item">
                                            <FaQuestionCircle />
                                            {quiz.questions} questions
                                        </div>
                                        <div className="meta-item">
                                            <FaClock />
                                            {quiz.time}
                                        </div>
                                    </div>
                                    <button className="start-quiz-btn">
                                        Continue Quiz
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mentors Tab */}
                {activeTab === 'mentors' && (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h3>Expert Mentorship</h3>
                            <p>Connect with experienced clinicians for personalized guidance</p>
                        </div>
                        <div className="mentors-section">
                            <div className="mentor-card featured">
                                <div className="mentor-avatar">
                                    <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Mentor" />
                                    <div className="online-indicator"></div>
                                </div>
                                <div className="mentor-info">
                                    <h4>Dr. Sarah Chen, MD</h4>
                                    <p className="mentor-specialty">Cardiology • 15 years experience</p>
                                    <p className="mentor-bio">
                                        Former Chief Resident at Johns Hopkins. Specialized in interventional cardiology and medical education.
                                    </p>
                                    <div className="mentor-stats">
                                        <div className="stat">
                                            <FaStar className="stat-icon" />
                                            <span>4.9/5 (247 reviews)</span>
                                        </div>
                                        <div className="stat">
                                            <FaUsers className="stat-icon" />
                                            <span>1.2K students mentored</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="connect-btn">
                                    Request Session
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="cta-section">
                <div className="cta-content">
                    <FaTrophy className="cta-icon" />
                    <h2>Begin Your Clinical Mastery Journey</h2>
                    <p>Join thousands of healthcare professionals transforming their clinical reasoning skills</p>
                    <div className="cta-buttons">
                        <button className="cta-primary">
                            <FaChartLine /> Start Learning Path
                        </button>
                        <button className="cta-secondary">
                            Browse All Cases
                        </button>
                    </div>
                </div>
            </div>

            {/* Control Buttons */}
            <div className="academy-controls">
                <button
                    className="control-btn"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                    {isFullScreen ? <FaCompress /> : <FaExpand />}
                </button>
                <button
                    className="control-btn close-btn"
                    onClick={onClose}
                    title="Close Academy"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default ClinicalNexusAcademy;