/**
 * Metro Sathi — Data Module
 * Loads station JSON files, builds the metro graph and station registry.
 */

const MetroData = (() => {
    // Line file paths (relative to index.html)
    const LINE_FILES = [
        'station_details/green_line.json',
        'station_details/purple_line.json',
        'station_details/yellow_line.json',
        'station_details/pink_line.json',
        'station_details/blue_line.json'
    ];

    // Loaded line data keyed by line name
    let lines = {};

    // Master station registry: stationName → [{ line, index }]
    let stationRegistry = {};

    // Adjacency graph: stationKey → [{ station, line, isInterchange }]
    let graph = {};

    // All unique station names for autocomplete
    let allStationNames = [];

    /**
     * Load all line JSON files and build internal data structures.
     * @returns {Promise<void>}
     */
    async function load() {
        const responses = await Promise.all(
            LINE_FILES.map(f => fetch(f).then(r => r.json()))
        );

        lines = {};
        stationRegistry = {};
        graph = {};

        // 1. Parse each line
        responses.forEach(lineData => {
            const lineName = lineData.line_name;
            lines[lineName] = lineData;

            // Register each station
            lineData.stations.forEach((stationName, index) => {
                if (!stationRegistry[stationName]) {
                    stationRegistry[stationName] = [];
                }
                stationRegistry[stationName].push({ line: lineName, index });

                // Create graph node key: "STATION_NAME@LINE"
                const nodeKey = makeNodeKey(stationName, lineName);
                if (!graph[nodeKey]) {
                    graph[nodeKey] = [];
                }

                // Connect to adjacent stations on same line
                if (index > 0) {
                    const prevStation = lineData.stations[index - 1];
                    const prevKey = makeNodeKey(prevStation, lineName);
                    graph[nodeKey].push({ nodeKey: prevKey, station: prevStation, line: lineName, isInterchange: false });
                    if (!graph[prevKey]) graph[prevKey] = [];
                    graph[prevKey].push({ nodeKey: nodeKey, station: stationName, line: lineName, isInterchange: false });
                }
            });
        });

        // 2. Connect interchange stations across lines
        Object.entries(stationRegistry).forEach(([stationName, entries]) => {
            if (entries.length > 1) {
                // This station exists on multiple lines — connect them
                for (let i = 0; i < entries.length; i++) {
                    for (let j = i + 1; j < entries.length; j++) {
                        const keyA = makeNodeKey(stationName, entries[i].line);
                        const keyB = makeNodeKey(stationName, entries[j].line);
                        graph[keyA].push({ nodeKey: keyB, station: stationName, line: entries[j].line, isInterchange: true });
                        graph[keyB].push({ nodeKey: keyA, station: stationName, line: entries[i].line, isInterchange: true });
                    }
                }
            }
        });

        // 3. Connect interchange stations declared in JSON interchanges field
        // (handles cases where station names differ slightly between lines)
        Object.values(lines).forEach(lineData => {
            const lineName = lineData.line_name;
            if (!lineData.interchanges) return;

            Object.entries(lineData.interchanges).forEach(([stationName, connectedLines]) => {
                connectedLines.forEach(otherLineName => {
                    const otherLine = lines[otherLineName];
                    if (!otherLine) return;

                    // Find the matching station in the other line
                    const otherIndex = otherLine.stations.indexOf(stationName);
                    if (otherIndex === -1) return;

                    const keyA = makeNodeKey(stationName, lineName);
                    const keyB = makeNodeKey(stationName, otherLineName);

                    // Avoid duplicate edges
                    if (graph[keyA] && !graph[keyA].some(e => e.nodeKey === keyB)) {
                        graph[keyA].push({ nodeKey: keyB, station: stationName, line: otherLineName, isInterchange: true });
                    }
                    if (graph[keyB] && !graph[keyB].some(e => e.nodeKey === keyA)) {
                        graph[keyB].push({ nodeKey: keyA, station: stationName, line: lineName, isInterchange: true });
                    }
                });
            });
        });

        // 4. Build autocomplete index
        allStationNames = buildAutocompleteIndex();
    }

    /**
     * Creates a unique node key for the graph.
     */
    function makeNodeKey(stationName, lineName) {
        return `${stationName}@${lineName}`;
    }

    /**
     * Parses a node key back into station name and line.
     */
    function parseNodeKey(nodeKey) {
        const atIndex = nodeKey.lastIndexOf('@');
        return {
            station: nodeKey.substring(0, atIndex),
            line: nodeKey.substring(atIndex + 1)
        };
    }

    /**
     * Build sorted list of unique stations with their line info for autocomplete.
     * Returns array of { name, lines: [{name, color, isActive}] }
     */
    function buildAutocompleteIndex() {
        const entries = [];
        const seen = new Set();

        Object.entries(stationRegistry).forEach(([stationName, lineEntries]) => {
            if (seen.has(stationName)) return;
            seen.add(stationName);

            const stationLines = lineEntries.map(e => ({
                name: e.line,
                color: lines[e.line].color,
                isActive: lines[e.line].is_active
            }));

            entries.push({ name: stationName, lines: stationLines });
        });

        // Sort alphabetically
        entries.sort((a, b) => a.name.localeCompare(b.name));
        return entries;
    }

    /**
     * Search stations by query (fuzzy prefix match).
     * @param {string} query
     * @returns {Array} Matching station entries
     */
    function searchStations(query) {
        if (!query || query.trim().length === 0) return [];
        const q = query.toLowerCase().trim();
        return allStationNames.filter(entry =>
            entry.name.toLowerCase().includes(q)
        ).slice(0, 12); // Limit results
    }

    /**
     * Check if a station name exists in the registry.
     */
    function isValidStation(stationName) {
        return stationRegistry.hasOwnProperty(stationName);
    }

    /**
     * Get platform number for a station on a specific line traveling in a direction.
     * @param {string} lineName - e.g. "GREEN"
     * @param {string} stationName - e.g. "Nadaprabhu Kempegowda Station, Majestic"
     * @param {string} direction - "towards_start" or "towards_end"
     * @returns {number} Platform number
     */
    function getPlatform(lineName, stationName, direction) {
        const line = lines[lineName];
        if (!line) return null;

        // Check overrides first
        if (line.platforms.overrides && line.platforms.overrides[stationName]) {
            return line.platforms.overrides[stationName][direction];
        }
        // Fall back to default
        return line.platforms.default[direction];
    }

    /**
     * Get direction info when traveling on a line from one index to another.
     * @param {string} lineName
     * @param {number} fromIndex
     * @param {number} toIndex
     * @returns {{ key: string, label: string }}
     */
    function getDirection(lineName, fromIndex, toIndex) {
        const line = lines[lineName];
        if (toIndex > fromIndex) {
            return { key: 'towards_end', label: `Towards ${line.terminals.end}` };
        } else {
            return { key: 'towards_start', label: `Towards ${line.terminals.start}` };
        }
    }

    /**
     * Get line data by name.
     */
    function getLine(lineName) {
        return lines[lineName] || null;
    }

    /**
     * Get all lines.
     */
    function getAllLines() {
        return lines;
    }

    /**
     * Get station index on a specific line.
     */
    function getStationIndex(lineName, stationName) {
        const line = lines[lineName];
        if (!line) return -1;
        return line.stations.indexOf(stationName);
    }

    /**
     * Get all line entries for a station.
     */
    function getStationLines(stationName) {
        return stationRegistry[stationName] || [];
    }

    // Public API
    return {
        load,
        searchStations,
        isValidStation,
        getPlatform,
        getDirection,
        getLine,
        getAllLines,
        getStationIndex,
        getStationLines,
        makeNodeKey,
        parseNodeKey,
        get graph() { return graph; },
        get stationRegistry() { return stationRegistry; },
        get allStationNames() { return allStationNames; }
    };
})();
