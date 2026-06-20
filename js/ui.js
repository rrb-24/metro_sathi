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
        const statusText = is_active ? 'Operational' : 'Under Construction';

        const LINE_METADATA = {
            'PURPLE': {
                corridor: 'East-West Corridor',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVGrOZM1NkeXomhfV1u6hBiWDSXYPlO918U77R15-D218LzbCza7QOwa5f4nmWAz67RVDFHgO6hT7APDsryFbjiB6YmS-wmCFsitBYeewoXLhXvNSWU3iBadNGpmtLegDL8TnU8PInZOgMNFxHJSEMrBw47mM1jtKW45DJyKBtxHzvlzZU_RV0Wy4iLetmTLfzHOni_pLI8VTzOn_MuGTvngQ-byLEQEnaa5O7n-lE4eEKt6Nj-s005Fa015vv-9G5kVCoZp4tKIRI',
                overview: 'A vital artery of Bengaluru\'s transit system, the Purple Line spans the city\'s east-west corridor, seamlessly connecting major residential hubs to the high-tech commercial districts of Whitefield and Indiranagar.',
                topologyDesc: 'Navigate the journey from East to West. The Purple Line serves as the backbone of Bengaluru\'s commute, featuring the city\'s deepest underground station at Majestic.',
                interchanges: [
                    { name: 'Majestic (Nadaprabhu Kempegowda)', desc: 'Connects Purple Line with the Green Line and Indian Railways.', icon: 'hub' },
                    { name: 'MG Road', desc: 'Strategic hub connecting the central business district and upcoming Yellow Line extensions.', icon: 'shopping_cart' }
                ],
                overviewSections: [
                    { title: 'Interchange Connectivity', content: '<p class="text-body-md font-body-md text-on-surface-variant mb-2">The Purple Line has key interchange points:</p><ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Nadaprabhu Kempegowda (Majestic) → Interchange with Green Line</li><li>Future expansions may add more connectivity</li></ul>' },
                    { title: 'Infrastructure & Technology', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Combination of underground and elevated sections</li><li>Earthquake-resistant structures</li><li>Advanced signaling systems (Urbalis 200 ATC)</li><li>Third rail traction system (750V DC)</li></ul>' },
                    { title: 'Key Areas Covered', content: '<p class="text-body-md font-body-md text-on-surface-variant mb-2">Major locations along the Purple Line include:</p><ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Whitefield</li><li>Indiranagar</li><li>MG Road</li><li>Cubbon Park</li><li>Majestic</li><li>City Railway Station</li><li>Kengeri / Challaghatta</li></ul>' },
                    { title: 'Timings & Frequency', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Operating Hours: 5:00 AM to 12:00 AM</li><li>Peak Frequency: ~4 minutes</li><li>End-to-End Travel Time: ~80 minutes</li></ul>' },
                    { title: 'Nearby Attractions', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>MG Road shopping district</li><li>Cubbon Park</li><li>Vidhana Soudha</li><li>KR Market</li><li>Commercial Street</li></ul>' }
                ]
            },
            'GREEN': {
                corridor: 'North-South Corridor',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwVJj7fFA-qaxGwUQyuKkmVjD0ZbOJ4z_UU2lOhl0Ml2nIn72RhE1-O8GOi9nS7k5x5yBS7VkwiSzbREZGRD0uVrABMr64fAZX2wRRiCoUFet6cOJgfiVPnCltxSdF6htpI1zZs6eMzdL0Bc8toO37EwTg0AqaUELnjuZUo_INjr06mywFputeYGvHF6vIXP1lKSXN_VTn-vLL2J_KzoqRVOpG0nM1EoSeeXsldyWo6cYHQUm9BE7z7bQusyWx-hAs65HBz9iBfw6l',
                overview: 'Connecting Madavara in the north to Silk Institute in the south, the Green Line spans major industrial zones, heritage markets, and dense residential pockets, providing rapid transit across the city\'s vertical axis.',
                topologyDesc: 'Navigate the journey from North to South. The Green Line spans the industrial north to residential south, bridging commercial hubs and traditional street markets.',
                interchanges: [
                    { name: 'Nadaprabhu Kempegowda (Majestic)', desc: 'Connects Green Line with the Purple Line, KSR railway terminal, and main bus stand.', icon: 'hub' },
                    { name: 'Yeshwanthpur', desc: 'Major railway junction interchange connecting long-distance train travelers directly to the city transit network.', icon: 'train' }
                ],
                overviewSections: [
                    { title: 'Interchange Connectivity', content: '<p class="text-body-md font-body-md text-on-surface-variant mb-2">The Green Line has key interchange points:</p><ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Nadaprabhu Kempegowda (Majestic) → Interchange with Purple Line</li><li>Yeshwanthpur → Interchange with Indian Railways</li></ul>' },
                    { title: 'Infrastructure & Technology', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Double-track transit system</li><li>Continuous automatic train control (CATC)</li><li>Elevated viaduct structures and underground corridor sections in central hubs</li></ul>' },
                    { title: 'Key Areas Covered', content: '<p class="text-body-md font-body-md text-on-surface-variant mb-2">Major locations along the Green Line include:</p><ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Yeshwanthpur</li><li>Peenya</li><li>Chickpet</li><li>Majestic</li><li>Jayanagar</li><li>Banashankari</li><li>Silk Institute</li></ul>' },
                    { title: 'Timings & Frequency', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Operating Hours: 5:00 AM to 11:30 PM</li><li>Peak Frequency: ~5 minutes</li><li>End-to-End Travel Time: ~60 minutes</li></ul>' },
                    { title: 'Nearby Attractions', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>ISKCON Temple</li><li>Chickpet Markets</li><li>Lalbagh Botanical Garden</li><li>Banashankari Temple</li></ul>' }
                ]
            },
            'YELLOW': {
                corridor: 'Electronic City Corridor',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPm5aKuqrXt6VWvsDdVMWg_3SUrh5wP-oDv8zpksaNcsl43licTnthEdE9fLfRRuPpaWQqcVNpl4DNZkzT_ZWQHzZZS5g3kc3rLD8UtVsc6ikEagX1r8tZSw-BDWAXs3MmMjrF21Z7JEuuiqeLxdCECbTEEM29bRDhZLFsgH1Y7TX8JDo4MaM5ya0yvfZ-UhVlykcvc-u1pakb2x8HoeSgogHpXx_aluTHzqUgcg5Lu7qYzfkEqPBO0ByNcFZEo7hxgCsE0iZvHJae',
                overview: 'Connecting RV Road to Bommasandra, the upcoming Yellow Line is designed to link south-central residential neighborhoods directly to Electronic City, Bengaluru\'s massive technology manufacturing hub.',
                topologyDesc: 'Navigate the route to Electronic City. The Yellow Line serves as the tech corridor backbone, linking south-central transit junctions directly to manufacturing districts.',
                interchanges: [
                    { name: 'RV Road', desc: 'Connects Yellow Line with the Green Line for seamless transfers between southern lines.', icon: 'hub' },
                    { name: 'Silk Board', desc: 'Upcoming mega interchange station connecting the Yellow Line with Blue Line bus and rail networks.', icon: 'alt_route' }
                ],
                overviewSections: [
                    { title: 'Interchange Connectivity', content: '<p class="text-body-md font-body-md text-on-surface-variant mb-2">The Yellow Line will connect with other key routes:</p><ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>RV Road → Interchange with Green Line</li><li>Silk Board → Future interchange with Blue Line</li></ul>' },
                    { title: 'Infrastructure & Technology', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Driverless train capability (GoA4)</li><li>State-of-the-art CBTC signaling</li><li>Elevated viaducts and high-capacity coaches</li></ul>' },
                    { title: 'Key Areas Covered', content: '<p class="text-body-md font-body-md text-on-surface-variant mb-2">Major locations covered include:</p><ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>RV Road</li><li>BTM Layout</li><li>Silk Board</li><li>HSR Layout</li><li>Electronic City</li><li>Bommasandra</li></ul>' },
                    { title: 'Timings & Frequency', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>Planned Operating Hours: 5:30 AM to 11:00 PM</li><li>Planned Peak Frequency: ~6 minutes</li><li>Estimated End-to-End Travel Time: ~35 minutes</li></ul>' },
                    { title: 'Nearby Attractions', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>BTM Lake Park</li><li>Forum Mall Koramangala</li><li>Electronic City IT Parks</li></ul>' }
                ]
            }
        };

        const meta = LINE_METADATA[lineId] || {
            corridor: 'Transit Expansion Corridor',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVGrOZM1NkeXomhfV1u6hBiWDSXYPlO918U77R15-D218LzbCza7QOwa5f4nmWAz67RVDFHgO6hT7APDsryFbjiB6YmS-wmCFsitBYeewoXLhXvNSWU3iBadNGpmtLegDL8TnU8PInZOgMNFxHJSEMrBw47mM1jtKW45DJyKBtxHzvlzZU_RV0Wy4iLetmTLfzHOni_pLI8VTzOn_MuGTvngQ-byLEQEnaa5O7n-lE4eEKt6Nj-s005Fa015vv-9G5kVCoZp4tKIRI',
            overview: `An integral transit corridor connecting Bengaluru neighborhoods, currently under development to expand city-wide metro accessibility on the ${lineData.line_name} Line.`,
            topologyDesc: `Route topology details all stations along the corridor. You can set any station as your trip start or end point instantly using the buttons below.`,
            interchanges: [
                { name: 'Majestic Hub', desc: 'Central transit interchange connectivity.', icon: 'hub' }
            ],
            overviewSections: [
                { title: 'Expansion Connectivity', content: `<p class="text-body-md font-body-md text-on-surface-variant mb-2">This corridor is marked as ${statusText.toLowerCase()} in Namma Metro schedules.</p>` },
                { title: 'Technology', content: '<ul class="text-body-md font-body-md text-on-surface-variant leading-relaxed space-y-2 list-disc pl-5"><li>State-of-the-art signaling</li><li>high-capacity coaches</li><li>modern concrete elevated structures</li></ul>' }
            ]
        };

        // 1. Interchange Hubs HTML
        let hubsHtml = '';
        meta.interchanges.forEach(hub => {
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
                desc = isStart ? 'Eastern Terminal • IT Hub Access' : 'Western Terminal • Academic Zone';
                if (lineId === 'GREEN') {
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
        meta.overviewSections.forEach(sec => {
            sectionsHtml += `
                <div class="border-l-4 pl-6" style="border-color: ${lineData.color}">
                    <h3 class="font-headline-md text-headline-md text-on-surface mb-3">${escapeHtml(sec.title)}</h3>
                    <div class="text-body-md font-body-md text-on-surface-variant leading-relaxed">${sec.content}</div>
                </div>
            `;
        });

        // Render everything dynamically into lineDetailContainer
        lineDetailContainer.innerHTML = `
            <!-- Hero Section -->
            <section class="relative w-full py-20 px-gutter overflow-hidden">
                <div class="max-w-max-width mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div class="flex-1 text-center md:text-left">
                        <span class="inline-block px-4 py-1 rounded-full text-label-md font-label-md mb-6 uppercase tracking-wider bg-surface-container-high" style="background-color: ${lineData.color}15; color: ${lineData.color}">${escapeHtml(meta.corridor)}</span>
                        <h1 class="font-headline-xl text-headline-xl mb-6" style="color: ${lineData.color}">${lineData.line_name.charAt(0) + lineData.line_name.slice(1).toLowerCase()} Line</h1>
                        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                            ${escapeHtml(meta.overview)}
                        </p>
                    </div>
                    <div class="flex-1 w-full max-w-md">
                        <div class="aspect-square rounded-3xl overflow-hidden shadow-xl border border-outline-variant">
                            <img class="w-full h-full object-cover" src="${meta.image}" alt="${lineData.line_name} Line">
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
                        <div class="font-headline-md text-headline-md text-on-surface">${lineId === 'PURPLE' ? '43.49 km' : lineId === 'GREEN' ? '30.37 km' : lineId === 'YELLOW' ? '18.82 km' : 'Upcoming'}</div>
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
                                    ${escapeHtml(meta.topologyDesc)}
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
                        The ${lineData.line_name.charAt(0) + lineData.line_name.slice(1).toLowerCase()} Line represents the pinnacle of modern urban planning in Bengaluru, offering a high-frequency, reliable alternative to road congestion. It integrates historical city centers with the rapidly developing outskirts.
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

    // Public API
    return {
        initHome,
        initLines,
        initTickets,
        toggleExpand,
        renderRoute,
        showLineDetails,
        selectStationFromDetail,
        toggleChatTheme
    };
})();
