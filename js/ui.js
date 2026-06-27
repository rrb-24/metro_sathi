/**
 * Metro Sathi — UI Controller
 * Handles DOM interactions, autocomplete, route rendering, tab switching, and line details.
 */

const UI = (() => {
    // DOM element references
    let fromInput, toInput, fromDropdown, toDropdown;
    let fromClear, toClear, swapBtn, searchBtn;
    let routeResults, routeTimeline, routeSummary;
    let errorMessage, errorText;
    let lineLegendItems;

    // Line Sub-views
    let metroLinesListView, metroLineDetailsView, btnBackToLinesList, lineDetailContainer;

    // State
    let selectedFrom = '';
    let selectedTo = '';
    let activeDropdown = null;
    let highlightedIndex = -1;

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (fromInput && toInput) {
            if (e.target !== fromInput && e.target !== toInput && 
                !e.target.closest('#from-dropdown') && !e.target.closest('#to-dropdown')) {
                closeAllDropdowns();
            }
        }
    });

    /**
     * Initialize Home View.
     */
    function initHome() {
        // Grab elements
        fromInput = document.getElementById('from-input');
        toInput = document.getElementById('to-input');
        fromDropdown = document.getElementById('from-dropdown');
        toDropdown = document.getElementById('to-dropdown');
        fromClear = document.getElementById('from-clear');
        toClear = document.getElementById('to-clear');
        swapBtn = document.getElementById('swap-btn');
        searchBtn = document.getElementById('search-btn');

        routeResults = document.getElementById('route-results');
        routeTimeline = document.getElementById('route-timeline');
        routeSummary = document.getElementById('route-summary');
        errorMessage = document.getElementById('error-message');
        errorText = document.getElementById('error-text');

        // Setup autocomplete for both fields
        if (fromInput && fromDropdown) setupAutocomplete(fromInput, fromDropdown, 'from');
        if (toInput && toDropdown) setupAutocomplete(toInput, toDropdown, 'to');

        // Clear buttons
        if (fromClear) {
            fromClear.addEventListener('click', () => {
                fromInput.value = '';
                selectedFrom = '';
                fromInput.focus();
                updateSearchButton();
            });
        }
        if (toClear) {
            toClear.addEventListener('click', () => {
                toInput.value = '';
                selectedTo = '';
                toInput.focus();
                updateSearchButton();
            });
        }

        // Swap
        if (swapBtn) swapBtn.addEventListener('click', handleSwap);

        // Search
        if (searchBtn) searchBtn.addEventListener('click', handleSearch);

        // Explore Bengaluru cards clicks
        document.querySelectorAll('.explore-card').forEach(card => {
            card.addEventListener('click', () => {
                const lineId = card.dataset.lineId;
                Router.navigate(`/metro-lines/${lineId.toLowerCase()}`);
            });
        });

        // Banner button click
        const promoBuyBtn = document.getElementById('promo-buy-btn');
        if (promoBuyBtn) {
            promoBuyBtn.addEventListener('click', () => {
                Router.navigate('/buy-tickets');
            });
        }

        // Explore Bengaluru directory redirect button click
        const btnHomeViewLines = document.getElementById('btn-home-view-lines');
        if (btnHomeViewLines) {
            btnHomeViewLines.addEventListener('click', () => {
                Router.navigate('/metro-lines');
            });
        }

        // Restore values if we have them
        if (fromInput && selectedFrom) fromInput.value = selectedFrom;
        if (toInput && selectedTo) toInput.value = selectedTo;

        // Initial button state
        updateSearchButton();
    }

    /**
     * Initialize Metro Lines View.
     */
    function initLines(selectedLineId) {
        // Grab elements
        metroLinesListView = document.getElementById('metro-lines-list-view');
        metroLineDetailsView = document.getElementById('metro-line-details-view');
        btnBackToLinesList = document.getElementById('btn-back-to-lines-list');
        lineDetailContainer = document.getElementById('line-detail-container');
        lineLegendItems = document.getElementById('line-legend-items');

        // Back button on details sub-view
        if (btnBackToLinesList) {
            btnBackToLinesList.addEventListener('click', (e) => {
                e.preventDefault();
                Router.navigate('/metro-lines');
            });
        }

        // Render Cards dynamically into separate sections
        const operationalContainer = document.getElementById('metro-lines-operational-container');
        const upcomingContainer = document.getElementById('metro-lines-upcoming-container');

        if (operationalContainer && upcomingContainer) {
            let operationalHtml = '';
            let upcomingHtml = '';
            const allLines = MetroData.getAllLines();

            // Sort lines by line_number_label (e.g. "Line 01", "Line 02", etc.)
            const sortedEntries = Object.entries(allLines).sort((a, b) => {
                const labelA = a[1].line_number_label || '';
                const labelB = b[1].line_number_label || '';
                return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' });
            });

            sortedEntries.forEach(([lineName, line]) => {
                const stationsCount = line.stations.length;
                if (line.is_active) {
                    operationalHtml += `
                        <div class="line-card group relative bg-surface-container-lowest border border-outline-variant rounded-xl p-8 hover:shadow-lg transition-all cursor-pointer overflow-hidden" 
                             data-line-id="${lineName}"
                             style="border-left-width: 8px; border-left-color: ${line.color};"
                             onmouseenter="this.style.boxShadow='0 10px 25px -5px ${line.color}25';"
                             onmouseleave="this.style.boxShadow='none';">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <span class="text-label-sm uppercase tracking-wider font-bold" style="color: ${line.color}">${line.line_number_label || 'Line'}</span>
                                    <h2 class="font-headline-md text-headline-md mt-1">${lineName.charAt(0) + lineName.slice(1).toLowerCase()} Line</h2>
                                </div>
                                <div class="p-3 rounded-lg text-white" style="background-color: ${line.color}">
                                    <span class="material-symbols-outlined">train</span>
                                </div>
                            </div>
                            <div class="space-y-4 mb-8">
                                <div class="flex items-center gap-3 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-lg">distance</span>
                                    <span class="text-body-md">${line.length || 'N/A'}</span>
                                </div>
                                <div class="flex items-center gap-3 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-lg">meeting_room</span>
                                    <span class="text-body-md">${stationsCount} Stations</span>
                                </div>
                            </div>
                            <button class="w-full flex items-center justify-center gap-2 py-3 border rounded-lg font-label-md transition-all"
                                    style="border-color: ${line.color}; color: ${line.color}; background-color: transparent;"
                                    onmouseenter="this.style.backgroundColor='${line.color}'; this.style.color='#ffffff';"
                                    onmouseleave="this.style.backgroundColor='transparent'; this.style.color='${line.color}';">
                                <span>View Details</span>
                                <span class="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    `;
                } else {
                    upcomingHtml += `
                        <div class="line-card group relative bg-surface-container-lowest border border-outline-variant rounded-xl p-8 hover:shadow-lg transition-all cursor-pointer overflow-hidden" 
                             data-line-id="${lineName}"
                             style="border-left-width: 8px; border-left-color: ${line.color};"
                             onmouseenter="this.style.boxShadow='0 10px 25px -5px ${line.color}25';"
                             onmouseleave="this.style.boxShadow='none';">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <span class="text-label-sm uppercase tracking-wider font-bold" style="color: ${line.color}">${line.line_number_label || 'Line'}</span>
                                    <h2 class="font-headline-md text-headline-md mt-1">${lineName.charAt(0) + lineName.slice(1).toLowerCase()} Line</h2>
                                </div>
                                <div class="p-3 rounded-lg text-white" style="background-color: ${line.color}">
                                    <span class="material-symbols-outlined">construction</span>
                                </div>
                            </div>
                            <div class="space-y-4 mb-8">
                                <div class="flex items-center gap-3 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-lg">distance</span>
                                    <span class="text-body-md">${line.length || 'N/A'}</span>
                                </div>
                                <div class="flex items-center gap-3 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-lg">meeting_room</span>
                                    <span class="text-body-md">${stationsCount} Stations</span>
                                </div>
                            </div>
                            <button class="w-full flex items-center justify-center gap-2 py-3 border rounded-lg font-label-md transition-all"
                                    style="border-color: ${line.color}; color: ${line.color}; background-color: transparent;"
                                    onmouseenter="this.style.backgroundColor='${line.color}'; this.style.color='#ffffff';"
                                    onmouseleave="this.style.backgroundColor='transparent'; this.style.color='${line.color}';">
                                <span>Planned Details</span>
                                <span class="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    `;
                }
            });
            operationalContainer.innerHTML = operationalHtml;
            upcomingContainer.innerHTML = upcomingHtml;
        }

        // Metro Lines cards clicks
        document.querySelectorAll('.line-card').forEach(card => {
            card.addEventListener('click', () => {
                const lineId = card.dataset.lineId;
                Router.navigate(`/metro-lines/${lineId.toLowerCase()}`);
            });
        });

        // Render line legend
        renderLineLegend();

        if (selectedLineId) {
            showLineDetails(selectedLineId);
        } else {
            if (metroLinesListView) metroLinesListView.classList.remove('hidden');
            if (metroLineDetailsView) metroLineDetailsView.classList.add('hidden');
        }
    }

    /**
     * Initialize Tickets View.
     */
    function initTickets() {
        // No event listeners needed as instructions are static link-driven
    }

    /**
     * Toggles visibility of global vs chat headers and footers.
     */
    function toggleChatTheme(isChatActive) {
        const globalHeader = document.getElementById('global-header');
        const globalFooter = document.getElementById('global-footer');
        const chatHeader = document.getElementById('chat-header');
        const chatFooter = document.getElementById('chat-footer');

        if (isChatActive) {
            if (globalHeader) globalHeader.classList.add('hidden');
            if (globalFooter) globalFooter.classList.add('hidden');
            if (chatHeader) chatHeader.classList.remove('hidden');
            if (chatFooter) chatFooter.classList.remove('hidden');
            document.body.classList.remove('pt-16');
        } else {
            if (globalHeader) globalHeader.classList.remove('hidden');
            if (globalFooter) globalFooter.classList.remove('hidden');
            if (chatHeader) chatHeader.classList.add('hidden');
            if (chatFooter) chatFooter.classList.add('hidden');
            document.body.classList.add('pt-16');
        }
    }

    /**
     * Show line details view.
     */
    function showLineDetails(lineId) {
        const lineData = MetroData.getLine(lineId);
        if (!lineData) return;

        // Hide list view and show details view container
        if (metroLinesListView) metroLinesListView.classList.add('hidden');
        if (metroLineDetailsView) metroLineDetailsView.classList.remove('hidden');

        const is_active = lineData.is_active;
        const statusText = is_active ? 'Operational' : 'Under Development';

        // 1. Interchange Hubs HTML
        let hubsHtml = '';
        const interchangeDetails = lineData.interchange_details || [];
        // Extract interchanges info
        let mappedInterchanges = [];
        if (lineData.interchanges && !Array.isArray(lineData.interchanges)) {
            mappedInterchanges = Object.entries(lineData.interchanges)
                .filter(([_, info]) => info && typeof info === 'object' && info.desc)
                .map(([stationName, info]) => ({
                    name: info.display_name || stationName,
                    desc: info.desc,
                    icon: info.icon || 'hub'
                }));
        } else {
            mappedInterchanges = interchangeDetails;
        }

        mappedInterchanges.forEach(hub => {
            hubsHtml += `
                <div class="flex items-center p-6 bg-surface-container-lowest border border-outline-variant rounded-2xl gap-6 transition-all group shadow-sm"
                     style="background-color: #ffffff; border-color: #e2e8f0;"
                     onmouseenter="this.style.borderColor='${lineData.color}';"
                     onmouseleave="this.style.borderColor='#e2e8f0';">
                    <div class="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors"
                         style="background-color: #f8fafc;"
                         onmouseenter="this.style.backgroundColor='${lineData.color}10';"
                         onmouseleave="this.style.backgroundColor='#f8fafc';">
                        <span class="material-symbols-outlined !text-4xl" style="color: ${lineData.color}">${hub.icon}</span>
                    </div>
                    <div>
                        <h3 class="font-headline-md text-headline-md text-on-surface mb-1">${escapeHtml(hub.name)}</h3>
                        <p class="text-on-surface-variant font-body-md text-body-md">${escapeHtml(hub.desc)}</p>
                    </div>
                </div>
            `;
        });

        // If no interchanges, show placeholder
        if (mappedInterchanges.length === 0) {
            hubsHtml = `
                <div class="col-span-full text-center py-8 text-on-surface-variant font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm">
                    No major interchange hubs along this corridor.
                </div>
            `;
        }

        // 2. Stations Timeline HTML
        let stationsHtml = '';
        lineData.stations.forEach((stationName, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === lineData.stations.length - 1;
            const connections = MetroData.getStationLines(stationName);
            const isInterchange = connections.length > 1;

            let dotClass = '';
            let styleStr = `--line-color: ${lineData.color};`;
            if (isStart || isEnd) {
                dotClass = 'active';
            } else if (isInterchange) {
                dotClass = 'interchange';
                const otherLines = connections.map(e => e.line).filter(l => l !== lineId);
                const otherLineColor = otherLines.length > 0 ? MetroData.getLine(otherLines[0]).color : '#006d34';
                styleStr += `border-color: ${otherLineColor}; box-shadow: 0 0 0 4px ${otherLineColor}20; background-color: #ffffff;`;
            }

            let desc = '';
            let titleClass = 'font-body-lg font-bold text-on-surface';
            if (isStart || isEnd) {
                desc = isStart ? `Terminal Station • Start: ${lineData.terminals.start}` : `Terminal Station • End: ${lineData.terminals.end}`;
                if (lineId === 'PURPLE') {
                    desc = isStart ? 'Eastern Terminal • IT Hub Access' : 'Western Terminal • Academic Zone';
                } else if (lineId === 'GREEN') {
                    desc = isStart ? 'Northern Terminal • Industrial Hub Access' : 'Southern Terminal • Residential Access';
                }
                titleClass = 'font-headline-md text-headline-md';
            } else if (isInterchange) {
                const otherLines = connections.map(e => e.line).filter(l => l !== lineId);
                desc = `INTERCHANGE: ${otherLines.join(', ')} Line`;
                titleClass = 'font-headline-md text-headline-md text-secondary';
            } else {
                desc = 'Intermediate Station';
            }

            stationsHtml += `
                <div class="relative">
                    <div class="absolute -left-[45px] top-1.5 w-6 h-6 journey-dot ${dotClass} rounded-full z-10" style="${styleStr}"></div>
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h4 class="${titleClass}" ${isStart || isEnd ? 'style="color: ' + lineData.color + '"' : ''}>${escapeHtml(stationName)}</h4>
                            <p class="text-label-sm font-label-sm text-on-surface-variant">${escapeHtml(desc)}</p>
                        </div>
                        <div class="flex gap-2 mt-1 md:mt-0">
                            <button class="bg-white hover:text-white border px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer" 
                                    style="border-color: ${lineData.color}40; color: ${lineData.color};"
                                    onmouseenter="this.style.backgroundColor='${lineData.color}'; this.style.color='#ffffff';"
                                    onmouseleave="this.style.backgroundColor='transparent'; this.style.color='${lineData.color}';"
                                    onclick="UI.selectStationFromDetail('from', '${escapeHtml(stationName)}')">Set as From</button>
                            <button class="bg-white hover:text-white border px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer" 
                                    style="border-color: ${lineData.color}40; color: ${lineData.color};"
                                    onmouseenter="this.style.backgroundColor='${lineData.color}'; this.style.color='#ffffff';"
                                    onmouseleave="this.style.backgroundColor='transparent'; this.style.color='${lineData.color}';"
                                    onclick="UI.selectStationFromDetail('to', '${escapeHtml(stationName)}')">Set as To</button>
                        </div>
                    </div>
                </div>
            `;
        });

        // 3. Overview Sections HTML
        let sectionsHtml = '';
        const overviewSections = lineData.overview_sections || [
            { title: 'Expansion Connectivity', content: `<p class="text-body-md font-body-md text-on-surface-variant mb-2">This corridor is marked as ${statusText.toLowerCase()} in Namma Metro schedules.</p>` },
            { title: 'Technology', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>State-of-the-art signaling</li><li>high-capacity coaches</li><li>modern concrete elevated structures</li></ul>' }
        ];
        overviewSections.forEach(sec => {
            sectionsHtml += `
                <div class="border-l-4 pl-6" style="border-color: ${lineData.color}">
                    <h3 class="font-headline-md text-headline-md text-on-surface mb-3">${escapeHtml(sec.title)}</h3>
                    <div class="text-body-md font-body-md text-on-surface-variant leading-relaxed">${sec.content}</div>
                </div>
            `;
        });

        // Render everything dynamically into lineDetailContainer
        const corridor = lineData.corridor || 'Transit Expansion Corridor';
        const overviewText = lineData.overview || `An integral transit corridor connecting Bengaluru neighborhoods, currently under development to expand city-wide metro accessibility on the ${lineData.line_name} Line.`;
        const imageSrc = lineData.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVGrOZM1NkeXomhfV1u6hBiWDSXYPlO918U77R15-D218LzbCza7QOwa5f4nmWAz67RVDFHgO6hT7APDsryFbjiB6YmS-wmCFsitBYeewoXLhXvNSWU3iBadNGpmtLegDL8TnU8PInZOgMNFxHJSEMrBw47mM1jtKW45DJyKBtxHzvlzZU_RV0Wy4iLetmTLfzHOni_pLI8VTzOn_MuGTvngQ-byLEQEnaa5O7n-lE4eEKt6Nj-s005Fa015vv-9G5kVCoZp4tKIRI';
        const topologyDesc = lineData.topology_desc || `Route topology details all stations along the corridor. You can set any station as your trip start or end point instantly using the buttons below.`;

        const badgeColor = is_active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200';

        lineDetailContainer.innerHTML = `
            <!-- Hero Section -->
            <section class="relative w-full py-20 px-gutter overflow-hidden">
                <div class="max-w-max-width mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div class="flex-1 text-center md:text-left">
                        <div class="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-6">
                            <span class="inline-block px-4 py-1 rounded-full text-label-md font-label-md uppercase tracking-wider bg-surface-container-high" style="background-color: ${lineData.color}15; color: ${lineData.color}">${escapeHtml(corridor)}</span>
                            <span class="inline-block px-4 py-1 rounded-full text-label-md font-label-md uppercase tracking-wider border font-bold ${badgeColor}">
                                ${statusText}
                            </span>
                        </div>
                        <h1 class="font-headline-xl text-headline-xl mb-6" style="color: ${lineData.color}">${lineData.line_name.charAt(0) + lineData.line_name.slice(1).toLowerCase()} Line</h1>
                        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                            ${escapeHtml(overviewText)}
                        </p>
                    </div>
                    <div class="flex-1 w-full max-w-md">
                        <div class="aspect-square rounded-3xl overflow-hidden shadow-xl border border-outline-variant">
                            <img class="w-full h-full object-cover" src="${imageSrc}" alt="${lineData.line_name} Line">
                        </div>
                    </div>
                </div>
            </section>

            <!-- Quick Stats Section -->
            <section class="max-w-max-width mx-auto px-gutter -mt-16 relative z-20">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style="background-color: ${lineData.color}15; color: ${lineData.color}">
                            <span class="material-symbols-outlined">train</span>
                        </div>
                        <div class="text-on-surface-variant font-label-md text-label-md uppercase mb-1">Stations</div>
                        <div class="font-headline-md text-headline-md text-on-surface">${lineData.stations.length} Stations</div>
                    </div>
                    <div class="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style="background-color: ${lineData.color}15; color: ${lineData.color}">
                            <span class="material-symbols-outlined">straighten</span>
                        </div>
                        <div class="text-on-surface-variant font-label-md text-label-md uppercase mb-1">Length</div>
                        <div class="font-headline-md text-headline-md text-on-surface">${lineData.length || 'Upcoming'}</div>
                    </div>
                    <div class="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style="background-color: ${lineData.color}15; color: ${lineData.color}">
                            <span class="material-symbols-outlined">alt_route</span>
                        </div>
                        <div class="text-on-surface-variant font-label-md text-label-md uppercase mb-1">Tracks</div>
                        <div class="font-headline-md text-headline-md text-on-surface">Double Track</div>
                    </div>
                </div>
            </section>

            <!-- Interchange Points Section -->
            <section class="py-24 max-w-max-width mx-auto px-gutter">
                <div class="mb-12 text-center">
                    <h2 class="font-headline-lg text-headline-lg text-on-surface mb-4">Strategic Interchange Hubs</h2>
                    <p class="text-on-surface-variant font-body-md text-body-md">Effortlessly switch between lines at these key transit nodes.</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    ${hubsHtml}
                </div>
            </section>

            <!-- Station Journey Path Section -->
            <section class="py-24 bg-surface-container-low/30 border-y border-outline-variant/50">
                <div class="max-w-max-width mx-auto px-gutter">
                    <div class="flex flex-col lg:flex-row gap-16">
                        <div class="lg:w-1/3">
                            <div class="sticky top-24">
                                <h2 class="font-headline-lg text-headline-lg text-on-surface mb-6">Route Topology</h2>
                                <p class="text-on-surface-variant font-body-md text-body-md mb-8">
                                    ${escapeHtml(topologyDesc)}
                                </p>
                                <div class="space-y-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-4 h-4 rounded-full" style="background-color: ${lineData.color}"></div>
                                        <span class="text-label-md font-label-md">${lineData.line_name.charAt(0) + lineData.line_name.slice(1).toLowerCase()} Line Station</span>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="w-4 h-4 rounded-full border-2 border-secondary bg-white"></div>
                                        <span class="text-label-md font-label-md">Interchange Node</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="lg:w-2/3">
                            <!-- Timeline container with vertical line colored by line theme -->
                            <div class="relative pl-12 space-y-12" style="--line-color: ${lineData.color}">
                                <div class="absolute left-3 top-2 bottom-2 w-1.5 rounded-full" style="background-color: ${lineData.color}"></div>
                                ${stationsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- About the Line Section -->
            <section class="py-24 max-w-max-width mx-auto px-gutter">
                <div class="max-w-3xl mx-auto">
                    <h2 class="font-headline-lg text-headline-lg text-on-surface mb-6">Detailed Overview</h2>
                    <p class="font-body-lg text-body-lg text-on-surface-variant mb-12">
                        The ${lineData.line_name.charAt(0) + lineData.line_name.slice(1).toLowerCase()} Line represents Namma Metro's commitment to high-frequency, reliable rapid transit, integrating key sectors across the metropolitan area.
                    </p>
                    <div class="space-y-12">
                        ${sectionsHtml}
                    </div>
                </div>
            </section>
        `;

        closeAllDropdowns();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Set station directly from the lines list.
     */
    function selectStationFromDetail(field, stationName) {
        if (window.GPSTracker) window.GPSTracker.stop();
        sessionStorage.removeItem('metroSathiSession');

        if (field === 'from') {
            selectedFrom = stationName;
            Router.navigate('/home');
            setTimeout(() => {
                const toInp = document.getElementById('to-input');
                if (toInp) toInp.focus();
            }, 150);
        } else {
            selectedTo = stationName;
            Router.navigate('/home');
        }
    }

    /**
     * Setup autocomplete behavior on an input.
     */
    function setupAutocomplete(input, dropdown, field) {
        input.addEventListener('input', () => {
            const query = input.value;
            if (field === 'from') selectedFrom = '';
            else selectedTo = '';
            updateSearchButton();

            const results = MetroData.searchStations(query, false);
            renderDropdown(dropdown, results, field);
        });

        input.addEventListener('focus', () => {
            const query = input.value;
            if (query.length > 0) {
                const results = MetroData.searchStations(query, false);
                renderDropdown(dropdown, results, field);
            }
        });

        input.addEventListener('keydown', (e) => {
            handleDropdownKeyboard(e, dropdown, field);
        });
    }

    /**
     * Render autocomplete dropdown items.
     */
    function renderDropdown(dropdown, results, field) {
        highlightedIndex = -1;

        if (results.length === 0 && (field === 'from' ? fromInput : toInput).value.length > 0) {
            dropdown.innerHTML = '<div class="autocomplete__no-results">No stations found</div>';
            dropdown.classList.add('active');
            activeDropdown = dropdown;
            return;
        }

        if (results.length === 0) {
            dropdown.classList.remove('active');
            activeDropdown = null;
            return;
        }

        dropdown.innerHTML = results.map((entry, idx) => {
            const lineDots = entry.lines.map(l =>
                `<span class="autocomplete__line-dot" style="background:${l.color}" title="${l.name} Line"></span>`
            ).join('');
            const lineLabels = entry.lines.map(l => l.name).join(', ');

            return `
                <div class="autocomplete__item" data-index="${idx}" data-station="${escapeHtml(entry.name)}">
                    ${lineDots}
                    <span class="autocomplete__station-name">${highlightMatch(entry.name, (field === 'from' ? fromInput : toInput).value)}</span>
                    <span class="autocomplete__line-label">${lineLabels}</span>
                </div>
            `;
        }).join('');

        // Bind click events
        dropdown.querySelectorAll('.autocomplete__item').forEach(item => {
            item.addEventListener('click', () => {
                const station = item.dataset.station;
                selectStation(field, station);
            });
        });

        dropdown.classList.add('active');
        activeDropdown = dropdown;
    }

    /**
     * Highlight matching text in station name.
     */
    function highlightMatch(name, query) {
        if (!query) return escapeHtml(name);
        const idx = name.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return escapeHtml(name);
        const before = name.substring(0, idx);
        const match = name.substring(idx, idx + query.length);
        const after = name.substring(idx + query.length);
        return `${escapeHtml(before)}<strong style="color:var(--primary)">${escapeHtml(match)}</strong>${escapeHtml(after)}`;
    }

    /**
     * Handle keyboard navigation in dropdown.
     */
    function handleDropdownKeyboard(e, dropdown, field) {
        const items = dropdown.querySelectorAll('.autocomplete__item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            updateHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < items.length) {
                const station = items[highlightedIndex].dataset.station;
                selectStation(field, station);
            } else if (selectedFrom && selectedTo) {
                handleSearch();
            }
        } else if (e.key === 'Escape') {
            closeAllDropdowns();
        }
    }

    /**
     * Update visual highlight on dropdown items.
     */
    function updateHighlight(items) {
        items.forEach((item, idx) => {
            item.classList.toggle('highlighted', idx === highlightedIndex);
        });
        // Scroll into view
        if (items[highlightedIndex]) {
            items[highlightedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Select a station from dropdown.
     */
    function selectStation(field, stationName) {
        if (field === 'from') {
            fromInput.value = stationName;
            selectedFrom = stationName;
            fromDropdown.classList.remove('active');
            setTimeout(() => toInput.focus(), 100);
        } else {
            toInput.value = stationName;
            selectedTo = stationName;
            toDropdown.classList.remove('active');
        }
        updateSearchButton();
    }

    /**
     * Close all dropdowns.
     */
    function closeAllDropdowns() {
        if (fromDropdown) fromDropdown.classList.remove('active');
        if (toDropdown) toDropdown.classList.remove('active');
        activeDropdown = null;
        highlightedIndex = -1;
    }

    /**
     * Update the search button state.
     */
    function updateSearchButton() {
        searchBtn.disabled = !(selectedFrom && selectedTo);
    }

    /**
     * Handle the swap button.
     */
    function handleSwap() {
        const tempValue = fromInput.value;
        const tempSelected = selectedFrom;

        fromInput.value = toInput.value;
        selectedFrom = selectedTo;

        toInput.value = tempValue;
        selectedTo = tempSelected;

        updateSearchButton();

        if (selectedFrom && selectedTo && routeResults.classList.contains('active')) {
            handleSearch();
        }
    }

    /**
     * Handle search button click.
     */
    function handleSearch() {
        closeAllDropdowns();
        hideError();

        if (!selectedFrom || !selectedTo) return;

        if (selectedFrom === selectedTo) {
            showError("Source and destination can't be the same station.");
            return;
        }

        if (!MetroData.isValidStation(selectedFrom)) {
            showError(`"${selectedFrom}" is not a valid station.`);
            return;
        }

        if (!MetroData.isValidStation(selectedTo)) {
            showError(`"${selectedTo}" is not a valid station.`);
            return;
        }

        const includeUpcoming = false;
        const result = RouteFinder.findRoute(selectedFrom, selectedTo, includeUpcoming);

        if (!result) {
            showError('No route found between these stations.');
            return;
        }

        renderRoute(result);
        
        // Start the interactive chat companion
        Chat.startChat(result, selectedFrom, selectedTo);
    }

    /**
     * Render the route result.
     */
    function renderRoute(result) {
        // Summary
        routeSummary.innerHTML = `
            <div class="route-summary__item">
                <div class="route-summary__value">${result.totalStops}</div>
                <div class="route-summary__label">Stops</div>
            </div>
            <div class="route-summary__item">
                <div class="route-summary__value">${result.totalInterchanges}</div>
                <div class="route-summary__label">Interchange${result.totalInterchanges !== 1 ? 's' : ''}</div>
            </div>
            <div class="route-summary__item">
                <div class="route-summary__value">~${result.estimatedMinutes}</div>
                <div class="route-summary__label">Minutes</div>
            </div>
        `;

        // Timeline
        routeTimeline.innerHTML = '';

        result.segments.forEach((segment, idx) => {
            // Interchange connector (between segments)
            if (idx > 0) {
                const interchangeStation = segment.boardAt;
                routeTimeline.innerHTML += `
                    <div class="route-interchange">
                        <div class="route-interchange__line"></div>
                        <div class="route-interchange__badge">
                            <span class="route-interchange__icon">🔄</span>
                            Change to ${segment.line} Line at ${interchangeStation}
                        </div>
                        <div class="route-interchange__line"></div>
                    </div>
                `;
            }

            // Segment card
            const segmentEl = createSegmentCard(segment);
            routeTimeline.appendChild(segmentEl);
        });

        // Show results
        routeResults.classList.add('active');

        // Scroll to results
        setTimeout(() => {
            routeResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }

    /**
     * Create a segment card DOM element.
     */
    function createSegmentCard(segment) {
        const div = document.createElement('div');
        div.className = 'route-segment';
        div.style.setProperty('--segment-color', segment.color);

        // Header
        const comingSoon = !segment.isActive
            ? `<span class="segment__coming-soon" style="background-color: var(--warning); color: #78350f;">⏳ Coming Soon</span>`
            : '';

        let stationsHtml = '';

        // Board station
        stationsHtml += `
            <div class="segment__station segment__station--board" style="--segment-color: ${segment.color}">
                Board at ${escapeHtml(segment.boardAt)}
                <span class="segment__station-platform">Platform ${segment.platform}</span>
            </div>
        `;

        // Intermediate stations
        if (segment.intermediateStations.length > 0) {
            if (segment.intermediateStations.length <= 3) {
                // Show all if 3 or fewer
                segment.intermediateStations.forEach(s => {
                    stationsHtml += `<div class="segment__station segment__station--intermediate" style="--segment-color: ${segment.color}">${escapeHtml(s)}</div>`;
                });
            } else {
                // Collapsible
                const expandId = `expand-${Math.random().toString(36).substring(2, 8)}`;
                stationsHtml += `
                    <button class="segment__expand-btn" onclick="UI.toggleExpand('${expandId}', this)">
                        ↓ ${segment.intermediateStations.length} stations <span class="chevron">▼</span>
                    </button>
                    <div id="${expandId}" class="segment__intermediate-list">
                        ${segment.intermediateStations.map(s =>
                            `<div class="segment__station segment__station--intermediate" style="--segment-color: ${segment.color}">${escapeHtml(s)}</div>`
                        ).join('')}
                    </div>
                `;
            }
        }

        // Deboard station
        stationsHtml += `
            <div class="segment__station segment__station--deboard" style="--segment-color: ${segment.color}">
                Deboard at ${escapeHtml(segment.deboardAt)}
                <span class="segment__station-platform">${segment.stops} stop${segment.stops !== 1 ? 's' : ''} · ~${segment.estimatedMinutes} min</span>
            </div>
        `;

        div.innerHTML = `
            <div class="segment__header">
                <span class="segment__line-badge" style="background:${segment.color}">
                    ${segment.line}
                </span>
                <span class="segment__direction">${segment.directionLabel}</span>
                ${comingSoon}
            </div>
            <div class="segment__stations">
                ${stationsHtml}
            </div>
        `;

        return div;
    }

    /**
     * Toggle expand/collapse of intermediate stations.
     */
    function toggleExpand(id, btn) {
        const list = document.getElementById(id);
        if (!list) return;
        list.classList.toggle('expanded');
        btn.classList.toggle('expanded');

        const stationCount = list.querySelectorAll('.segment__station').length;
        const chevron = btn.querySelector('.chevron');

        if (list.classList.contains('expanded')) {
            btn.childNodes[0].textContent = ` ↑ Hide ${stationCount} stations `;
        } else {
            btn.childNodes[0].textContent = ` ↓ ${stationCount} stations `;
        }
    }

    /**
     * Render the line legend at the bottom.
     */
    function renderLineLegend() {
        if (!lineLegendItems) return;
        const allLines = MetroData.getAllLines();
        lineLegendItems.innerHTML = Object.values(allLines).map(line => {
            const statusClass = line.is_active ? 'active' : 'upcoming';
            const statusText = line.is_active ? 'Active' : 'Upcoming';
            const statusStyle = line.is_active ? 'color: var(--secondary); background: var(--secondary-container);' : 'color: var(--warning); background: #fef3c7;';
            return `
                <div class="legend-item">
                    <span class="legend-dot" style="background:${line.color}"></span>
                    ${line.line_name}
                    <span class="legend-status" style="${statusStyle}">${statusText}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Show an error message.
     */
    function showError(message) {
        routeResults.classList.remove('active');
        errorText.textContent = message;
        errorMessage.classList.add('active');
    }

    /**
     * Hide the error message.
     */
    function hideError() {
        errorMessage.classList.remove('active');
    }

    /**
     * Escape HTML to prevent XSS.
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Initialize Support & Feedback View.
     */
    function initSupport() {
        // Nothing special to initialize on start
    }

    /**
     * Handle support form submission simulator.
     */
    function handleSupportSubmit() {
        const name = document.getElementById('support-name')?.value;
        const email = document.getElementById('support-email')?.value;
        const topic = document.getElementById('support-type')?.value;
        const message = document.getElementById('support-message')?.value;

        console.log('--- Support Form Submitted ---');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Topic:', topic);
        console.log('Message:', message);

        const formContainer = document.getElementById('support-form-container');
        const successContainer = document.getElementById('support-success-container');

        if (formContainer && successContainer) {
            formContainer.classList.add('hidden');
            successContainer.classList.remove('hidden');
        }
    }

    /**
     * Reset support form state.
     */
    function resetSupportForm() {
        const form = document.getElementById('support-form');
        if (form) form.reset();

        const formContainer = document.getElementById('support-form-container');
        const successContainer = document.getElementById('support-success-container');

        if (formContainer && successContainer) {
            successContainer.classList.add('hidden');
            formContainer.classList.remove('hidden');
        }
    }

    // Public API
    return {
        initHome,
        initLines,
        initTickets,
        initSupport,
        handleSupportSubmit,
        resetSupportForm,
        toggleExpand,
        renderRoute,
        showLineDetails,
        selectStationFromDetail,
        toggleChatTheme
    };
})();
