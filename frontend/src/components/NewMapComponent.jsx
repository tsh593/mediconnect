import React, { useEffect, useState } from 'react';

/**
 * Simple, Reliable Map Component using OpenStreetMap
 * Completely recreated with a simpler, more reliable approach
 */
const NewMapComponent = ({ providers, center, zoom = 13, height = '500px', searchLocation = null, selectedProvider = null }) => {
    const [mapBounds, setMapBounds] = useState(null);
    const [mapUrl, setMapUrl] = useState('');
    const [geocodedLocation, setGeocodedLocation] = useState(null);
    const [geocodingLocation, setGeocodingLocation] = useState(false);

    const [geocodedProviders, setGeocodedProviders] = useState([]);
    const [geocodingProviders, setGeocodingProviders] = useState(false);

    // Geocode provider addresses that don't have valid coordinates
    useEffect(() => {
        const geocodeProviderAddresses = async () => {
            if (!providers || providers.length === 0) return;

            const providersToGeocode = providers.filter(p => {
                if (!p.coordinates || !p.coordinates.lat || !p.coordinates.lng) return true;
                if (isNaN(p.coordinates.lat) || isNaN(p.coordinates.lng)) return true;
                return false;
            });

            if (providersToGeocode.length === 0) {
                setGeocodedProviders([]);
                return;
            }

            setGeocodingProviders(true);
            const geocoded = [];

            // Rate limit: 1 request per second (OpenStreetMap requirement)
            for (let i = 0; i < providersToGeocode.length; i++) {
                const provider = providersToGeocode[i];
                const address = provider.address || provider.location || '';
                if (!address) continue;

                // Add delay between requests (except first one)
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds between requests
                }

                try {
                    console.log(`🗺️ Geocoding provider address (${i + 1}/${providersToGeocode.length}): ${address}`);
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                        {
                            headers: {
                                'User-Agent': 'MediConnect-Map/1.0',
                                'Accept-Language': 'en'
                            }
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.length > 0) {
                            geocoded.push({
                                ...provider,
                                coordinates: {
                                    lat: parseFloat(data[0].lat),
                                    lng: parseFloat(data[0].lon)
                                }
                            });
                            console.log(`✅ Geocoded ${provider.name}: [${data[0].lat}, ${data[0].lon}]`);
                        } else {
                            console.warn(`⚠️ No geocoding results for ${provider.name} at ${address}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error geocoding ${provider.name}:`, error);
                }
            }

            setGeocodedProviders(geocoded);
            setGeocodingProviders(false);
        };

        geocodeProviderAddresses();
    }, [providers]);

    // Filter providers with valid coordinates (exclude Fairfax if multiple providers)
    const validProviders = React.useMemo(() => {
        if (!providers || providers.length === 0) return [];
        
        // Combine original providers with geocoded ones
        const allProviders = providers.map(p => {
            const geocoded = geocodedProviders.find(gp => gp.id === p.id);
            return geocoded || p;
        });
        
        const filtered = allProviders.filter(p => {
            if (!p.coordinates || !p.coordinates.lat || !p.coordinates.lng) return false;
            if (isNaN(p.coordinates.lat) || isNaN(p.coordinates.lng)) return false;
            return true;
        });

        // If we have multiple providers, exclude Fairfax coordinates
        if (filtered.length > 1) {
            return filtered.filter(p => {
                const isFairfax = Math.abs(p.coordinates.lat - 38.8462) < 0.001 && 
                                 Math.abs(p.coordinates.lng + 77.3064) < 0.001;
                if (isFairfax) {
                    console.warn(`⚠️ Excluding Fairfax coordinate for ${p.name} (${p.location || p.address})`);
                }
                return !isFairfax;
            });
        }

        return filtered;
    }, [providers, geocodedProviders]);

    // Always geocode search location when provided (to ensure correct map center)
    useEffect(() => {
        const geocodeSearchLocation = async (location) => {
            if (!location || location.trim() === '') return;
            
            // Check if we already have geocoded location for this search location
            const locationKey = location.trim().toLowerCase();
            if (geocodedLocation && geocodedLocation.address && 
                geocodedLocation.address.toLowerCase().includes(locationKey)) {
                console.log(`📍 Using cached geocoded location for: ${location}`);
                return;
            }
            
            setGeocodingLocation(true);
            try {
                console.log(`🗺️ Geocoding search location: ${location}`);
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
                    {
                        headers: {
                            'User-Agent': 'MediConnect-Map/1.0',
                            'Accept-Language': 'en'
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const coords = {
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon),
                            address: data[0].display_name
                        };
                        setGeocodedLocation(coords);
                        console.log(`✅ Geocoded "${location}": [${coords.lat}, ${coords.lng}]`);
                    } else {
                        console.warn(`⚠️ No geocoding results for: ${location}`);
                    }
                } else {
                    console.error(`❌ Geocoding failed for ${location}: ${response.status}`);
                }
            } catch (error) {
                console.error('Error geocoding location:', error);
            } finally {
                setGeocodingLocation(false);
            }
        };

        // Always geocode search location when provided (prioritize search location over center prop)
        if (searchLocation) {
            geocodeSearchLocation(searchLocation);
        }
    }, [searchLocation]); // Only depend on searchLocation, not validProviders

    // Calculate bounds from valid providers or use geocoded location
    useEffect(() => {
        // HIGHEST PRIORITY: If a provider is selected, center on that provider with all markers
        if (selectedProvider && selectedProvider.coordinates && selectedProvider.coordinates.lat && selectedProvider.coordinates.lng) {
            const { lat, lng } = selectedProvider.coordinates;
            console.log(`🎯 Centering map on selected doctor: ${selectedProvider.name} at [${lat}, ${lng}]`);
            
            // Smaller bbox to zoom in closer on the selected provider
            const bbox = `${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}`;
            
            // Include ALL provider markers, not just the selected one
            const markerParams = validProviders.map(p => `marker=${p.coordinates.lat},${p.coordinates.lng}`).join('&');
            
            const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&${markerParams}`;
            setMapUrl(url);
            console.log(`📍 Centered on ${selectedProvider.name}, showing ${validProviders.length} total markers`);
            return;
        }
        
        // PRIORITY 1: Use valid providers if available and they match the search location
        if (validProviders.length > 0) {
            // Check if providers match the search location (validate they're in the right city)
            const searchLocationLower = (searchLocation || '').toLowerCase();
            const providersMatchLocation = validProviders.some(p => {
                const location = (p.location || p.address || '').toLowerCase();
                return searchLocationLower && location.includes(searchLocationLower.split(',')[0].trim());
            });
            
            // If providers match search location, use them
            if (providersMatchLocation || !searchLocation) {
                const lats = validProviders.map(p => p.coordinates.lat);
                const lngs = validProviders.map(p => p.coordinates.lng);
                
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);

                // Add padding (10% on each side)
                const latPadding = (maxLat - minLat) * 0.1 || 0.01;
                const lngPadding = (maxLng - minLng) * 0.1 || 0.01;

                const bounds = {
                    minLat: minLat - latPadding,
                    maxLat: maxLat + latPadding,
                    minLng: minLng - lngPadding,
                    maxLng: maxLng + lngPadding
                };

                setMapBounds(bounds);
                
                // Create OpenStreetMap embed URL with bounds and ALL markers
                const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
                const avgLat = (minLat + maxLat) / 2;
                const avgLng = (minLng + maxLng) / 2;
                
                // Build markers string for all providers
                // OpenStreetMap embed URL format: marker=lat1,lng1&marker=lat2,lng2&marker=lat3,lng3
                const markerParams = validProviders.map(p => `marker=${p.coordinates.lat},${p.coordinates.lng}`).join('&');
                
                // Use OpenStreetMap export/embed with multiple markers
                // Each marker is added as a separate parameter
                const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&${markerParams}`;
                setMapUrl(url);
                
                console.log(`📍 Added ${validProviders.length} markers to map`);
                console.log(`📍 Map bounds: ${bbox}`);
                console.log(`📍 Map center: [${avgLat.toFixed(6)}, ${avgLng.toFixed(6)}]`);
                console.log(`📍 Showing ${validProviders.length} providers`);
                return;
            } else {
                // Providers don't match search location - use geocoded search location instead
                console.warn(`⚠️ Provider coordinates don't match search location "${searchLocation}". Using geocoded search location.`);
            }
        }
        
        // PRIORITY 2: Use geocoded search location (always prefer this over center prop)
        if (geocodedLocation) {
            const { lat, lng } = geocodedLocation;
            const bbox = `${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}`;
            
            // Add markers for valid providers if we have any (even if they don't match)
            let markerParams = `marker=${lat},${lng}`;
            if (validProviders.length > 0) {
                const providerMarkers = validProviders.map(p => `marker=${p.coordinates.lat},${p.coordinates.lng}`).join('&');
                markerParams += `&${providerMarkers}`;
            }
            
            const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&${markerParams}`;
            setMapUrl(url);
            console.log(`📍 Map showing geocoded search location: ${searchLocation} at [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
            if (validProviders.length > 0) {
                console.log(`📍 Also showing ${validProviders.length} provider markers`);
            }
            return;
        }
        
        // PRIORITY 3: Use provided center as last resort (but log warning if search location exists)
        if (center) {
            if (searchLocation && !geocodingLocation) {
                console.warn(`⚠️ Using center prop [${center[0]}, ${center[1]}] but search location "${searchLocation}" was not geocoded yet.`);
            }
            const [lat, lng] = center;
            const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`;
            const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
            setMapUrl(url);
        }
    }, [validProviders, center, geocodedLocation, searchLocation, selectedProvider, geocodingLocation]);

    // Render address overlay if selectedProvider is set
    const renderAddressOverlay = () => {
        if (!selectedProvider) return null;

        const address = selectedProvider.address || selectedProvider.location || 'Address not available';

        return (
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                zIndex: 1000,
                maxWidth: '90%',
                border: '2px solid #0ea5e9'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {selectedProvider.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {selectedProvider.specialty}
                    </div>
                    <div style={{ fontSize: '12px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <svg 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#0ea5e9" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span style={{ fontWeight: '500' }}>{address}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (!mapUrl) {
        // Default map if no URL is set yet
        const defaultCenter = center && center.length === 2 ? center : [40.7128, -74.0060];
        const defaultUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${defaultCenter[1] - 0.01},${defaultCenter[0] - 0.01},${defaultCenter[1] + 0.01},${defaultCenter[0] + 0.01}&layer=mapnik&marker=${defaultCenter[0]},${defaultCenter[1]}`;
        
        return (
            <div style={{
                height,
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div>Loading map...</div>
                {(geocodingLocation || geocodingProviders) && (
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {geocodingLocation && 'Geocoding location...'}
                        {geocodingProviders && `Geocoding ${providers?.length || 0} provider(s)...`}
                    </div>
                )}
                <iframe
                    src={defaultUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0.5
                    }}
                    title="Loading Map"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height, width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
            {/* OpenStreetMap iframe */}
            <iframe
                src={mapUrl}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    pointerEvents: 'auto'
                }}
                title="Doctor Locations Map"
                allowFullScreen
                loading="lazy"
                onError={(e) => {
                    console.error('❌ Map iframe failed to load:', e);
                }}
                onLoad={() => {
                    console.log('✅ Map iframe loaded successfully');
                }}
            />

            {/* Render address overlay */}
            {renderAddressOverlay()}
            
            {/* Loading indicator */}
            {(geocodingLocation || geocodingProviders) && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    zIndex: 1001,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #e5e7eb',
                        borderTop: '2px solid #4f46e5',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }}></div>
                    <span>
                        {geocodingLocation && 'Geocoding location...'}
                        {geocodingProviders && `Geocoding ${providers?.length || 0} provider(s)...`}
                    </span>
                </div>
            )}

            {/* Provider list overlay */}
            {validProviders.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    maxWidth: '300px',
                    maxHeight: 'calc(100% - 24px)',
                    overflowY: 'auto',
                    zIndex: 1000,
                    fontSize: '13px'
                }}>
                    <div style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '12px', 
                        color: '#1f2937',
                        fontSize: '15px',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📍</span>
                        <span>Doctor Locations ({validProviders.length})</span>
                    </div>
                    
                    {validProviders.map((provider, index) => {
                        // Function to center map on this provider's location
                        const centerOnProvider = () => {
                            if (provider.coordinates && provider.coordinates.lat && provider.coordinates.lng) {
                                setSelectedProvider(provider);
                                console.log(`📍 Centering map on ${provider.name} at [${provider.coordinates.lat}, ${provider.coordinates.lng}]`);
                            }
                        };

                        return (
                            <div 
                                key={provider.id || index}
                                style={{ 
                                    marginBottom: '14px', 
                                    paddingBottom: '14px', 
                                    borderBottom: index < validProviders.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: selectedProvider?.id === provider.id ? '2px solid #4f46e5' : '1px solid transparent',
                                    backgroundColor: selectedProvider?.id === provider.id ? '#eef2ff' : 'transparent'
                                }}
                                onClick={centerOnProvider}
                                onMouseEnter={(e) => {
                                    if (selectedProvider?.id !== provider.id) {
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                        e.currentTarget.style.borderColor = '#4f46e5';
                                        e.currentTarget.style.transform = 'translateX(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedProvider?.id !== provider.id) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                    }
                                }}
                            >
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '10px',
                                marginBottom: '6px'
                            }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: '#ef4444',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    flexShrink: 0
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: '#374151', fontSize: '14px', marginBottom: '4px' }}>
                                        {provider.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                        {provider.specialty || 'General Practice'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                        {provider.location || provider.address || 'Location not available'}
                                    </div>
                                    {provider.rating && (
                                        <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                                            ⭐ {Number(provider.rating).toFixed(1)}/5
                                        </div>
                                    )}
                                    {provider.addressGenerated && (
                                        <div style={{ 
                                            fontSize: '10px', 
                                            color: '#f59e0b', 
                                            marginTop: '4px',
                                            backgroundColor: '#fef3c7',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            display: 'inline-block',
                                            fontWeight: '500'
                                        }}>
                                            🤖 AI-Generated Address
                                        </div>
                                    )}
                                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', fontFamily: 'monospace' }}>
                                        {provider.coordinates.lat.toFixed(6)}, {provider.coordinates.lng.toFixed(6)}
                                    </div>
                                    <div style={{ 
                                        fontSize: '11px', 
                                        color: '#4f46e5', 
                                        marginTop: '8px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span>📍</span>
                                        <span>{selectedProvider?.id === provider.id ? 'Centered on map' : 'Click to center on map'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {/* Status overlay */}
            {(geocodingProviders || geocodingLocation) && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    maxWidth: '280px'
                }}>
                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '6px', fontWeight: '600' }}>
                        {geocodingProviders ? '🗺️ Geocoding addresses...' : '📍 Geocoding location...'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {geocodingProviders 
                            ? 'Finding coordinates for doctor addresses'
                            : `Finding coordinates for ${searchLocation}`
                        }
                    </div>
                </div>
            )}

            {/* Info if no valid providers but showing search location */}
            {validProviders.length === 0 && geocodedLocation && !geocodingLocation && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    maxWidth: '280px'
                }}>
                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '6px', fontWeight: '600' }}>
                        📍 Showing: {searchLocation}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {geocodedLocation.address || `Map centered on ${searchLocation}`}
                    </div>
                    {providers && providers.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>
                            {providers.length} doctor{providers.length > 1 ? 's' : ''} found, addresses being geocoded
                        </div>
                    )}
                </div>
            )}

            {/* Info if no valid providers and no geocoded location */}
            {validProviders.length === 0 && !geocodedLocation && !geocodingLocation && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    textAlign: 'center',
                    zIndex: 1000,
                    maxWidth: '300px'
                }}>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>📍</div>
                    <div style={{ fontSize: '16px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>
                        No locations available
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {searchLocation ? `Geocoding ${searchLocation}...` : 'Doctor addresses may not have valid coordinates'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewMapComponent;
