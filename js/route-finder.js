/**
 * Metro Sathi — Route Finder Module
 * BFS shortest-path algorithm with segment grouping and platform resolution.
 */

const RouteFinder = (() => {

    /**
     * Find the shortest route between two stations.
     * @param {string} fromStation - Source station name
     * @param {string} toStation - Destination station name
     * @param {boolean} includeUpcoming - Whether to include inactive lines
     * @returns {{ segments: Array, totalStops: number, totalInterchanges: number, estimatedMinutes: number } | null}
     */
    function findRoute(fromStation, toStation, includeUpcoming = false) {
        if (fromStation === toStation) return null;
        if (!MetroData.isValidStation(fromStation) || !MetroData.isValidStation(toStation)) return null;

        // Get all graph nodes for source and destination
        const sourceEntries = MetroData.getStationLines(fromStation);
        const destEntries = MetroData.getStationLines(toStation);

        if (sourceEntries.length === 0 || destEntries.length === 0) return null;

        // Filter out inactive lines if toggle is off
        let validSourceEntries = sourceEntries;
        let validDestEntries = destEntries;
        if (!includeUpcoming) {
            validSourceEntries = sourceEntries.filter(e => MetroData.getLine(e.line).is_active);
            validDestEntries = destEntries.filter(e => MetroData.getLine(e.line).is_active);
        }

        if (validSourceEntries.length === 0 || validDestEntries.length === 0) return null;

        // Create start and end node keys
        const startKeys = validSourceEntries.map(e => MetroData.makeNodeKey(fromStation, e.line));
        const endKeys = new Set(validDestEntries.map(e => MetroData.makeNodeKey(toStation, e.line)));

        // BFS
        const queue = [];
        const visited = new Set();
        const parent = {};

        startKeys.forEach(key => {
            queue.push(key);
            visited.add(key);
            parent[key] = null;
        });

        let foundKey = null;

        while (queue.length > 0) {
            const current = queue.shift();

            if (endKeys.has(current)) {
                foundKey = current;
                break;
            }

            const neighbors = MetroData.graph[current] || [];
            for (const neighbor of neighbors) {
                if (!includeUpcoming && !MetroData.getLine(neighbor.line).is_active) {
                    continue; // Skip inactive lines if toggle is off
                }

                if (!visited.has(neighbor.nodeKey)) {
                    visited.add(neighbor.nodeKey);
                    parent[neighbor.nodeKey] = current;
                    queue.push(neighbor.nodeKey);
                }
            }
        }

        if (!foundKey) return null;

        // Reconstruct path
        const path = [];
        let current = foundKey;
        while (current !== null) {
            path.unshift(MetroData.parseNodeKey(current));
            current = parent[current];
        }

        // Build segments from path
        const segments = buildSegments(path);

        // Calculate totals
        let totalStops = 0;
        let totalInterchanges = segments.length - 1;

        segments.forEach(seg => {
            totalStops += seg.stops;
        });

        const estimatedMinutes = totalStops * 2 + totalInterchanges * 3; // ~2 min/stop + ~3 min per interchange

        return {
            segments,
            totalStops,
            totalInterchanges,
            estimatedMinutes
        };
    }

    /**
     * Group the raw path (station-line pairs) into line segments.
     * Each segment = consecutive stations on the same line.
     * @param {Array<{station: string, line: string}>} path
     * @returns {Array} Segment objects
     */
    function buildSegments(path) {
        if (path.length === 0) return [];

        const segments = [];
        let currentSegment = null;

        for (let i = 0; i < path.length; i++) {
            const { station, line } = path[i];

            if (!currentSegment || currentSegment.line !== line) {
                // Start a new segment
                if (currentSegment) {
                    finalizeSegment(currentSegment);
                    segments.push(currentSegment);
                }
                currentSegment = {
                    line: line,
                    stations: [station],
                    boardAt: station,
                    deboardAt: station
                };
            } else {
                // Continue current segment
                currentSegment.stations.push(station);
                currentSegment.deboardAt = station;
            }
        }

        // Finalize last segment
        if (currentSegment) {
            finalizeSegment(currentSegment);
            segments.push(currentSegment);
        }

        return segments;
    }

    /**
     * Enrich a raw segment with direction, platform, line info.
     * @param {Object} segment
     */
    function finalizeSegment(segment) {
        const lineData = MetroData.getLine(segment.line);
        const boardIndex = MetroData.getStationIndex(segment.line, segment.boardAt);
        const deboardIndex = MetroData.getStationIndex(segment.line, segment.deboardAt);

        // Direction
        const direction = MetroData.getDirection(segment.line, boardIndex, deboardIndex);
        segment.direction = direction.key;
        segment.directionLabel = direction.label;

        // Platform at boarding station
        segment.platform = MetroData.getPlatform(segment.line, segment.boardAt, direction.key);

        // Line metadata
        segment.color = lineData.color;
        segment.isActive = lineData.is_active;

        // Stop count (exclude boarding station)
        segment.stops = segment.stations.length - 1;

        // Intermediate stations (everything between board and deboard)
        segment.intermediateStations = segment.stations.slice(1, -1);

        // Estimated time for this segment
        segment.estimatedMinutes = segment.stops * 2;
    }

    // Public API
    return {
        findRoute
    };
})();
