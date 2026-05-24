/**
 * Metro Sathi — GPS Tracker Module
 * Handles live location tracking, distance calculations, and station proximity logic.
 */

window.GPSTracker = (() => {
    let watchId = null;
    let isTracking = false;
    
    // Config
    const APPROACHING_THRESHOLD_METERS = 400; // Trigger "approaching" 400m before the station
    const ARRIVED_THRESHOLD_METERS = 100; // Consider arrived within 100m
    const GPS_LOST_TIMEOUT = 15000; // 15 seconds without update = GPS lost (underground)
    
    // State
    let currentSegmentStations = [];
    let currentIndex = 0;
    let deboardIndex = 0;
    let lastPositionTime = 0;
    let gpsLostTimer = null;
    let timeBasedInterval = null;
    
    // Callbacks
    let callbacks = {
        onPositionUpdate: () => {},
        onStationPassed: () => {},
        onApproachingDeboard: () => {},
        onArrived: () => {},
        onGPSLost: () => {},
        onGPSRestored: () => {},
        onError: () => {}
    };

    /**
     * Start tracking the user along a specific route segment.
     * @param {Array} segmentStations - Array of station names in order of travel
     * @param {string} lineName - The name of the metro line
     * @param {Object} cbs - Callback functions
     * @param {number} startIndex - Optional station index to resume from
     */
    function start(segmentStations, lineName, cbs, startIndex = 0) {
        if (!navigator.geolocation) {
            if (cbs.onError) cbs.onError("Geolocation is not supported by your browser.");
            return;
        }

        // Merge callbacks
        callbacks = { ...callbacks, ...cbs };
        
        // Setup state
        currentSegmentStations = segmentStations.map(station => {
            const coords = MetroData.getStationCoordinates(lineName, station);
            return {
                name: station,
                lat: coords ? coords.lat : null,
                lng: coords ? coords.lng : null
            };
        });
        
        currentIndex = startIndex;
        deboardIndex = currentSegmentStations.length - 1;
        isTracking = true;

        // Start watching position
        watchId = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            handleError,
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
        
        startGpsMonitor();
    }

    /**
     * Stop tracking.
     */
    function stop() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        isTracking = false;
        clearTimeout(gpsLostTimer);
        clearInterval(timeBasedInterval);
    }

    /**
     * Handle new GPS coordinates from the browser.
     */
    function handlePositionUpdate(position) {
        lastPositionTime = Date.now();
        
        // If we were in underground mode, we're back!
        if (timeBasedInterval) {
            clearInterval(timeBasedInterval);
            timeBasedInterval = null;
            callbacks.onGPSRestored();
        }
        
        // Reset GPS monitor
        startGpsMonitor();

        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        callbacks.onPositionUpdate({ lat: userLat, lng: userLng, accuracy });

        checkProximity(userLat, userLng);
    }
    
    /**
     * Compare user's location against upcoming stations.
     */
    function checkProximity(userLat, userLng) {
        if (currentIndex > deboardIndex) return; // Journey complete

        // Next station to reach
        const targetStation = currentSegmentStations[currentIndex + 1];
        if (!targetStation || !targetStation.lat) return;

        const distanceToTarget = calculateHaversineDistance(userLat, userLng, targetStation.lat, targetStation.lng);

        // Are we at the next station?
        if (distanceToTarget <= ARRIVED_THRESHOLD_METERS) {
            currentIndex++;
            callbacks.onStationPassed(targetStation.name, currentIndex);
            
            if (currentIndex === deboardIndex) {
                callbacks.onArrived(targetStation.name);
                stop();
            }
        } 
        // Are we approaching the deboard station?
        else if (currentIndex === deboardIndex - 1 && distanceToTarget <= APPROACHING_THRESHOLD_METERS) {
            callbacks.onApproachingDeboard(currentSegmentStations[deboardIndex].name);
        }
    }

    /**
     * Monitor for GPS signal loss (e.g. going underground).
     */
    function startGpsMonitor() {
        clearTimeout(gpsLostTimer);
        gpsLostTimer = setTimeout(() => {
            if (isTracking) {
                callbacks.onGPSLost();
                startUndergroundFallback();
            }
        }, GPS_LOST_TIMEOUT);
    }

    /**
     * Time-based estimation when underground (approx 2 mins per stop).
     */
    function startUndergroundFallback() {
        if (timeBasedInterval) clearInterval(timeBasedInterval);
        
        timeBasedInterval = setInterval(() => {
            if (currentIndex >= deboardIndex) {
                stop();
                return;
            }
            
            currentIndex++;
            callbacks.onStationPassed(currentSegmentStations[currentIndex].name, currentIndex);
            
            if (currentIndex === deboardIndex - 1) {
                callbacks.onApproachingDeboard(currentSegmentStations[deboardIndex].name);
            } else if (currentIndex === deboardIndex) {
                callbacks.onArrived(currentSegmentStations[deboardIndex].name);
                stop();
            }
        }, 120000); // 2 minutes
    }

    function handleError(error) {
        console.warn('GPS Error:', error.message);
        // Only trigger error callback if we haven't started time-based fallback yet
        if (!timeBasedInterval) {
            callbacks.onError(error.message);
        }
    }

    /**
     * Calculate distance between two coordinate points in meters.
     * Haversine formula.
     */
    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    // Public API
    return {
        start,
        stop,
        isTracking: () => isTracking,
        getCurrentIndex: () => currentIndex
    };
})();
