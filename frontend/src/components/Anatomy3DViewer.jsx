import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaInfoCircle, FaExpand, FaCompress, FaArrowsAlt } from 'react-icons/fa';

/**
 * Anatomy 3D Viewer Component using Google Model Viewer
 * Displays 3D anatomical models for medical specialties
 */
const Anatomy3DViewer = ({ specialty, onClose }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showInfo, setShowInfo] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingError, setLoadingError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const modelViewerRef = useRef(null);

    // Ensure model-viewer web component is loaded
    useEffect(() => {
        // Check if model-viewer is already defined
        if (customElements.get('model-viewer')) {
            return;
        }

        // If not loaded, wait for script to load
        const checkModelViewer = setInterval(() => {
            if (customElements.get('model-viewer')) {
                clearInterval(checkModelViewer);
            }
        }, 100);

        // Cleanup
        return () => clearInterval(checkModelViewer);
    }, []);

    // Get model path or Sketchfab embed for specialty
    const modelConfig = React.useMemo(() => {
        // Sketchfab embed map (you can add more models here)
        const sketchfabMap = {
            'Cardiology': {
                embedUrl: 'https://sketchfab.com/models/21d346f72230432e8ed5fe448b03cca5/embed',
                title: 'Human Heart Internal Structure 3D Model',
                author: 'Haiqa Arif',
                modelUrl: 'https://sketchfab.com/3d-models/human-heart-internal-structure-3d-model-21d346f72230432e8ed5fe448b03cca5',
                type: 'sketchfab'
            },
            // Add more Sketchfab models here as you find them
            // 'Neurology': {
            //     embedUrl: 'https://sketchfab.com/models/XXXXX/embed',
            //     title: 'Brain 3D Model',
            //     type: 'sketchfab'
            // }
        };

        // Local GLB file map (fallback if no Sketchfab embed)
        const localModelMap = {
            'General Medicine': '/models/full-body.glb',
            'Family Medicine': '/models/full-body.glb',
            'Radiology': '/models/cross-section.glb',
            'Cardiology': '/models/heart.glb',
            'Neurology': '/models/brain.glb',
            'Psychiatry': '/models/brain-detailed.glb',
            'Oncology': '/models/organ-system.glb',
            'Pediatrics': '/models/pediatric-body.glb',
            'Orthopedics': '/models/skeleton.glb',
            'Dermatology': '/models/skin-layers.glb',
            'Gastroenterology': '/models/digestive-system.glb',
            'Endocrinology': '/models/endocrine-glands.glb',
            'Pulmonology': '/models/lungs.glb',
            'Nephrology': '/models/kidneys.glb',
            'Urology': '/models/urinary-system.glb',
            'Hematology': '/models/blood-cells.glb',
            'Rheumatology': '/models/joints.glb',
            'Infectious Diseases': '/models/immune-system.glb',
            'Emergency Medicine': '/models/full-body.glb',
            'Obstetrics/Gynecology': '/models/female-reproductive.glb',
            'Ophthalmology': '/models/eye.glb',
            'Otolaryngology': '/models/ent-system.glb',
            'Anesthesiology': '/models/airway.glb',
            'Pathology': '/models/cellular-anatomy.glb',
            'Surgery': '/models/surgical-anatomy.glb'
        };

        // Check if Sketchfab embed exists for this specialty
        if (sketchfabMap[specialty?.name]) {
            return sketchfabMap[specialty?.name];
        }

        // Fallback to local GLB file
        return {
            src: localModelMap[specialty?.name] || '/models/full-body.glb',
            type: 'local'
        };
    }, [specialty?.name]);

    const modelPath = modelConfig.type === 'local' ? modelConfig.src : null;
    const sketchfabEmbed = modelConfig.type === 'sketchfab' ? modelConfig : null;

    const modelAlt = `${specialty?.name} 3D Anatomy Model`;

    // Reset loading state when specialty changes
    useEffect(() => {
        setIsLoading(true);
        setLoadingProgress(0);
        setLoadingError(null);
    }, [specialty?.name]);

    // Handle model loading events (only for local GLB files)
    useEffect(() => {
        // Skip if using Sketchfab embed
        if (sketchfabEmbed) {
            setIsLoading(false);
            return;
        }

        const modelViewer = modelViewerRef.current;
        if (!modelViewer || !modelPath) return;

        // Wait a bit for model-viewer to initialize
        const initTimeout = setTimeout(() => {
            const handleLoad = () => {
                setIsLoading(false);
                setLoadingProgress(100);
                console.log('✅ Model loaded successfully:', modelPath);
                // Force model to be visible
                if (modelViewer) {
                    modelViewer.style.display = 'block';
                    modelViewer.style.visibility = 'visible';
                    modelViewer.style.opacity = '1';
                }
            };

            const handleError = (error) => {
                setIsLoading(false);
                setLoadingError('Failed to load model. File may be too large or corrupted.');
                console.error('❌ Model loading error:', error);
                console.error('Model path:', modelPath);
            };

            const handleProgress = (event) => {
                if (event.detail && event.detail.totalProgress !== undefined) {
                    const progress = Math.round(event.detail.totalProgress * 100);
                    setLoadingProgress(progress);
                    console.log(`📊 Loading progress: ${progress}%`);
                }
            };

            // Check if already loaded
            if (modelViewer.loaded) {
                handleLoad();
            } else {
                modelViewer.addEventListener('load', handleLoad);
                modelViewer.addEventListener('error', handleError);
                modelViewer.addEventListener('progress', handleProgress);
            }

            // Timeout after 90 seconds for large models (201MB can take time)
            const timeout = setTimeout(() => {
                if (isLoading && !modelViewer.loaded) {
                    setLoadingError('Model is taking too long to load. Large models (200MB+) may take 1-2 minutes. Please wait or try a smaller model.');
                    console.warn('⚠️ Model loading timeout after 90 seconds');
                }
            }, 90000);

            return () => {
                modelViewer.removeEventListener('load', handleLoad);
                modelViewer.removeEventListener('error', handleError);
                modelViewer.removeEventListener('progress', handleProgress);
                clearTimeout(timeout);
            };
        }, 100);

        return () => {
            clearTimeout(initTimeout);
        };
    }, [specialty?.name, modelPath, isLoading, sketchfabEmbed]);

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            const viewer = document.querySelector('.anatomy-viewer-container');
            if (viewer.requestFullscreen) {
                viewer.requestFullscreen();
            } else if (viewer.webkitRequestFullscreen) {
                viewer.webkitRequestFullscreen();
            } else if (viewer.msRequestFullscreen) {
                viewer.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    // Handle fullscreen change events
    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div className="anatomy-viewer-modal">
            <div className="anatomy-viewer-container">
                <div className="anatomy-viewer-header">
                    <div className="anatomy-viewer-title">
                        <h2>
                            {specialty?.icon && <span className="specialty-icon-header">{specialty.icon}</span>}
                            {specialty?.name} - 3D Anatomy Visualizer
                        </h2>
                        <p className="anatomy-viewer-description">{specialty?.description}</p>
                    </div>
                    <div className="anatomy-viewer-actions">
                        <button
                            className="anatomy-viewer-btn"
                            onClick={() => setShowInfo(!showInfo)}
                            title="Toggle Information"
                        >
                            <FaInfoCircle />
                        </button>
                        <button
                            className="anatomy-viewer-btn"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {isFullscreen ? <FaCompress /> : <FaExpand />}
                        </button>
                        <button
                            className="anatomy-viewer-btn close-btn"
                            onClick={onClose}
                            title="Close Viewer"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className="anatomy-viewer-content">
                    {showInfo && (
                        <div className="anatomy-viewer-info">
                            <div className="info-card">
                                <h3>Interactive Controls</h3>
                                <ul>
                                    <li><strong>Rotate:</strong> Click and drag</li>
                                    <li><strong>Zoom:</strong> Scroll or pinch</li>
                                    <li><strong>Pan:</strong> Right-click and drag (or Shift + drag)</li>
                                    <li><strong>AR View:</strong> Click AR button on mobile devices</li>
                                </ul>
                            </div>
                            {specialty?.cases && specialty.cases.length > 0 && (
                                <div className="info-card">
                                    <h3>Typical Cases</h3>
                                    <ul>
                                        {specialty.cases.slice(0, 3).map((caseItem, index) => (
                                            <li key={index}>{caseItem}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="anatomy-viewer-model">
                        {sketchfabEmbed ? (
                            // Use Sketchfab embed
                            <div className="sketchfab-embed-wrapper" style={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <iframe
                                    title={sketchfabEmbed.title || modelAlt}
                                    frameBorder="0"
                                    allowFullScreen
                                    mozAllowFullScreen="true"
                                    webkitAllowFullScreen="true"
                                    allow="autoplay; fullscreen; xr-spatial-tracking"
                                    xr-spatial-tracking
                                    execution-while-out-of-viewport
                                    execution-while-not-rendered
                                    web-share
                                    src={sketchfabEmbed.embedUrl}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                    onLoad={() => {
                                        setIsLoading(false);
                                        setLoadingProgress(100);
                                        console.log('✅ Sketchfab model loaded:', sketchfabEmbed.title);
                                    }}
                                    onError={(error) => {
                                        setIsLoading(false);
                                        setLoadingError('Failed to load Sketchfab model.');
                                        console.error('❌ Sketchfab loading error:', error);
                                    }}
                                />
                                {!isLoading && (
                                    <p style={{
                                        fontSize: '13px',
                                        fontWeight: 'normal',
                                        margin: '5px',
                                        color: '#4A4A4A',
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '10px',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        padding: '5px 10px',
                                        borderRadius: '4px'
                                    }}>
                                        <a
                                            href={sketchfabEmbed.modelUrl}
                                            target="_blank"
                                            rel="nofollow"
                                            style={{
                                                fontWeight: 'bold',
                                                color: '#1CAAD9',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            {sketchfabEmbed.title}
                                        </a>
                                        {sketchfabEmbed.author && (
                                            <>
                                                {' by '}
                                                <a
                                                    href={`https://sketchfab.com/${sketchfabEmbed.author.toLowerCase().replace(/\s+/g, '')}`}
                                                    target="_blank"
                                                    rel="nofollow"
                                                    style={{
                                                        fontWeight: 'bold',
                                                        color: '#1CAAD9',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    {sketchfabEmbed.author}
                                                </a>
                                            </>
                                        )}
                                        {' on '}
                                        <a
                                            href="https://sketchfab.com"
                                            target="_blank"
                                            rel="nofollow"
                                            style={{
                                                fontWeight: 'bold',
                                                color: '#1CAAD9',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            Sketchfab
                                        </a>
                                    </p>
                                )}
                            </div>
                        ) : (
                            // Use local GLB file with model-viewer
                            <model-viewer
                                ref={modelViewerRef}
                                src={modelPath}
                                alt={modelAlt}
                                camera-controls
                                auto-rotate
                                auto-rotate-delay="1000"
                                ar
                                ar-modes="webxr scene-viewer quick-look"
                                ar-scale="auto"
                                interaction-policy="allow-when-focused"
                                shadow-intensity="1"
                                exposure="1"
                                environment-image="neutral"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#f5f5f5'
                                }}
                                loading="eager"
                                reveal="auto"
                            >
                            {isLoading && (
                                <div className="model-loading" slot="poster" style={{ 
                                    display: isLoading ? 'flex' : 'none',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 10
                                }}>
                                    <div style={{ textAlign: 'center', margin: 'auto' }}>
                                        <div className="loading-spinner"></div>
                                        <p>Loading 3D Model...</p>
                                        {loadingProgress > 0 && (
                                            <div style={{ marginTop: '16px', width: '200px', margin: '16px auto 0' }}>
                                                <div style={{ 
                                                    width: '100%', 
                                                    height: '8px', 
                                                    backgroundColor: '#e0e0e0', 
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${loadingProgress}%`,
                                                        height: '100%',
                                                        backgroundColor: '#667eea',
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                                <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                                    {loadingProgress}%
                                                </p>
                                            </div>
                                        )}
                                        <p style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                                            Large models may take 30-60 seconds to load...
                                        </p>
                                    </div>
                                </div>
                            )}
                            {loadingError && (
                                <div className="model-error" slot="error" style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 20
                                }}>
                                    <p>⚠️ {loadingError}</p>
                                    <p className="error-hint">Model path: {modelPath}</p>
                                    <p className="error-hint">Please try a different specialty or check browser console for details.</p>
                                    <button 
                                        onClick={() => {
                                            setIsLoading(true);
                                            setLoadingError(null);
                                            setLoadingProgress(0);
                                            if (modelViewerRef.current) {
                                                modelViewerRef.current.src = modelPath;
                                            }
                                        }}
                                        style={{
                                            marginTop: '16px',
                                            padding: '8px 16px',
                                            backgroundColor: '#667eea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                        </model-viewer>
                        )}
                        {isLoading && !loadingError && !sketchfabEmbed && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(245, 245, 245, 0.98)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                pointerEvents: 'none'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div className="loading-spinner"></div>
                                    <p style={{ marginTop: '16px', color: '#666', fontSize: '16px', fontWeight: '500' }}>Loading 3D Model...</p>
                                    {loadingProgress > 0 && (
                                        <div style={{ marginTop: '16px', width: '200px', margin: '0 auto' }}>
                                            <div style={{ 
                                                width: '100%', 
                                                height: '8px', 
                                                backgroundColor: '#e0e0e0', 
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${loadingProgress}%`,
                                                    height: '100%',
                                                    backgroundColor: '#667eea',
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                            <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                                {loadingProgress}%
                                            </p>
                                        </div>
                                    )}
                                    <p style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                                        Large models may take 30-60 seconds...
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="anatomy-viewer-footer">
                    <div className="viewer-tips">
                        <FaArrowsAlt className="tip-icon" />
                        <span>Use mouse or touch to interact with the 3D model</span>
                    </div>
                    <div className="viewer-credits">
                        <span>Powered by Google Model Viewer</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Anatomy3DViewer;

