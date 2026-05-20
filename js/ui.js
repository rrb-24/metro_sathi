/**
 * Metro Sathi — UI Controller
 * Handles DOM interactions, autocomplete, route rendering, and animations.
 */

const UI = (() => {
    // DOM element references
    let fromInput, toInput, fromDropdown, toDropdown;
    let fromClear, toClear, swapBtn, searchBtn, includeUpcomingToggle;
    let routeResults, routeTimeline, routeSummary;
    let errorMessage, errorText;
    let lineLegendItems;

    // State
    let selectedFrom = '';
    let selectedTo = '';
    let activeDropdown = null;
    let highlightedIndex = -1;

    /**
     * Initialize the UI — bind events after DOM is ready.
     */
    function init() {
        // Grab elements
        fromInput = document.getElementById('from-input');
        toInput = document.getElementById('to-input');
        fromDropdown = document.getElementById('from-dropdown');
        toDropdown = document.getElementById('to-dropdown');
        fromClear = document.getElementById('from-clear');
        toClear = document.getElementById('to-clear');
        swapBtn = document.getElementById('swap-btn');
        searchBtn = document.getElementById('search-btn');
        includeUpcomingToggle = document.getElementById('include-upcoming-toggle');
        routeResults = document.getElementById('route-results');
        routeTimeline = document.getElementById('route-timeline');
        routeSummary = document.getElementById('route-summary');
        errorMessage = document.getElementById('error-message');
        errorText = document.getElementById('error-text');
        lineLegendItems = document.getElementById('line-legend-items');

        // Setup autocomplete for both fields
        setupAutocomplete(fromInput, fromDropdown, 'from');
        setupAutocomplete(toInput, toDropdown, 'to');

        // Toggle upcoming lines
        includeUpcomingToggle.addEventListener('change', () => {
            // Re-trigger search if we already have a valid route
            if (selectedFrom && selectedTo && routeResults.classList.contains('active')) {
                handleSearch();
            }
            
            // If dropdowns are active, re-render them with new filter
            if (activeDropdown) {
                const isFrom = activeDropdown === fromDropdown;
                const input = isFrom ? fromInput : toInput;
                const field = isFrom ? 'from' : 'to';
                const results = MetroData.searchStations(input.value, includeUpcomingToggle.checked);
                renderDropdown(activeDropdown, results, field);
            }
        });

        // Clear buttons
        fromClear.addEventListener('click', () => {
            fromInput.value = '';
            selectedFrom = '';
            fromInput.focus();
            updateSearchButton();
        });
        toClear.addEventListener('click', () => {
            toInput.value = '';
            selectedTo = '';
            toInput.focus();
            updateSearchButton();
        });

        // Swap
        swapBtn.addEventListener('click', handleSwap);

        // Search
        searchBtn.addEventListener('click', handleSearch);

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-field')) {
                closeAllDropdowns();
            }
        });

        // Render line legend
        renderLineLegend();

        // Initial button state
        updateSearchButton();
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

            const results = MetroData.searchStations(query, includeUpcomingToggle.checked);
            renderDropdown(dropdown, results, field);
        });

        input.addEventListener('focus', () => {
            const query = input.value;
            if (query.length > 0) {
                const results = MetroData.searchStations(query, includeUpcomingToggle.checked);
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
        return `${escapeHtml(before)}<strong style="color:var(--text-primary)">${escapeHtml(match)}</strong>${escapeHtml(after)}`;
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
            // Auto-focus "To" field
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
        fromDropdown.classList.remove('active');
        toDropdown.classList.remove('active');
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

        // If we have a valid route showing, re-search
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

        const includeUpcoming = includeUpcomingToggle.checked;
        const result = RouteFinder.findRoute(selectedFrom, selectedTo, includeUpcoming);

        if (!result) {
            showError('No route found between these stations.');
            return;
        }

        renderRoute(result);
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
            ? `<span class="segment__coming-soon">⏳ Coming Soon</span>`
            : '';

        let stationsHtml = '';

        // Board station
        stationsHtml += `
            <div class="segment__station segment__station--board">
                🚉 Board at ${escapeHtml(segment.boardAt)}
                <span class="segment__station-platform">Platform ${segment.platform}</span>
            </div>
        `;

        // Intermediate stations
        if (segment.intermediateStations.length > 0) {
            if (segment.intermediateStations.length <= 3) {
                // Show all if 3 or fewer
                segment.intermediateStations.forEach(s => {
                    stationsHtml += `<div class="segment__station segment__station--intermediate">│ ${escapeHtml(s)}</div>`;
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
                            `<div class="segment__station segment__station--intermediate">│ ${escapeHtml(s)}</div>`
                        ).join('')}
                    </div>
                `;
            }
        }

        // Deboard station
        stationsHtml += `
            <div class="segment__station segment__station--deboard">
                🚉 Deboard at ${escapeHtml(segment.deboardAt)}
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
        const allLines = MetroData.getAllLines();
        lineLegendItems.innerHTML = Object.values(allLines).map(line => {
            const statusClass = line.is_active ? 'active' : 'upcoming';
            const statusText = line.is_active ? 'Active' : 'Upcoming';
            return `
                <div class="line-legend__item">
                    <span class="line-legend__dot" style="background:${line.color}"></span>
                    ${line.line_name}
                    <span class="line-legend__status line-legend__status--${statusClass}">${statusText}</span>
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
        init,
        toggleExpand
    };
})();
