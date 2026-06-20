/**
 * Metro Sathi — Chat Controller
 * Manages the interactive step-by-step route guidance.
/**
 * Metro Sathi — Chat Controller
 * Manages the interactive step-by-step route guidance.
 */

const Chat = (() => {
    let routeData = null;
    let fromStation = '';
    let toStation = '';
    let currentSegmentIndex = 0;
    let currentLiveCard = null;
    let currentView = 'chat';
    
    // DOM Elements
    let chatView, messagesContainer, optionsContainer;
    let searchPanel, lineLegend, routeResultsView;
    
    // States
    const STATES = {
        TICKET_CHECK: 'TICKET_CHECK',
        BOARDING: 'BOARDING',
        JOURNEY: 'JOURNEY',
        DESTINATION: 'DESTINATION'
    };
    
    let currentState = null;

    /**
     * Session Persistence
     */
    function saveSession() {
        if (!routeData) return;
        const session = {
            routeData,
            fromStation,
            toStation,
            currentSegmentIndex,
            currentState,
            chatHTML: messagesContainer.innerHTML,
            gpsIndex: window.GPSTracker && window.GPSTracker.isTracking() ? window.GPSTracker.getCurrentIndex() : 0,
            currentView: currentView
        };
        sessionStorage.setItem('metroSathiSession', JSON.stringify(session));
    }

    function clearSession() {
        sessionStorage.removeItem('metroSathiSession');
    }

    let globalListenersBound = false;

    function restoreSession(session) {
        init();
        if (typeof UI !== 'undefined' && UI.toggleChatTheme) UI.toggleChatTheme(true);
        
        routeData = session.routeData;
        fromStation = session.fromStation;
        toStation = session.toStation;
        currentSegmentIndex = session.currentSegmentIndex;
        currentState = session.currentState;
        
        if (messagesContainer) messagesContainer.innerHTML = session.chatHTML;
        if (messagesContainer) currentLiveCard = messagesContainer.querySelector('.live-route-card');
        currentView = session.currentView || 'chat';
        
        if (searchPanel) searchPanel.classList.add('hidden');
        if (lineLegend) lineLegend.classList.add('hidden');
        
        if (currentView === 'route') {
            if (chatView) {
                chatView.classList.remove('active');
                chatView.classList.add('hidden');
            }
            if (routeResultsView) {
                routeResultsView.classList.remove('hidden');
                routeResultsView.classList.add('active');
            }
        } else {
            if (routeResultsView) {
                routeResultsView.classList.remove('active');
                routeResultsView.classList.add('hidden');
            }
            if (chatView) {
                chatView.classList.remove('hidden');
                chatView.classList.add('active');
            }
        }
        
        if (typeof UI !== 'undefined' && UI.renderRoute) {
            UI.renderRoute(session.routeData);
        }
        
        scrollToBottom();
        resumeStateLogic(session.gpsIndex);
    }

    function resumeStateLogic(gpsIndex) {
        if (!routeData || !routeData.segments[currentSegmentIndex]) return;
        const segment = routeData.segments[currentSegmentIndex];
        const isFinalSegment = currentSegmentIndex === routeData.segments.length - 1;
        
        switch (currentState) {
            case STATES.TICKET_CHECK:
                setOptions([
                    { text: 'Yes, I have it', action: () => handleUserReply('Yes, I have it', STATES.BOARDING) },
                    { text: 'No, not yet', action: () => {
                        handleUserReply('No, not yet');
                        addBotMessage(`Okay! You can navigate to the ticket counter to get a ticket to **${toStation}**.<br><br>💡 **Pro Tip:** Skip the queue and get a 5% discount by buying a QR ticket instantly on WhatsApp. <a href="https://wa.me/918105556677?text=Hi" target="_blank" style="color: #007bff; font-weight: bold; text-decoration: underline;">Click here to open Namma Metro WhatsApp</a>`);
                        setOptions([
                            { text: 'I have purchased the ticket now', action: () => handleUserReply('I have purchased the ticket now', STATES.BOARDING) }
                        ]);
                    }}
                ]);
                break;
            case STATES.BOARDING:
                setOptions([
                    { text: 'Yes, I am on the train', action: () => handleUserReply('Yes, I am on the train', STATES.JOURNEY) },
                    { text: 'No, waiting for it', action: () => {
                        handleUserReply('No, waiting for it');
                        addBotMessage(`No problem. Please wait safely at the platform. Let me know when you board.`);
                        setOptions([
                            { text: 'I have boarded', action: () => handleUserReply('I have boarded', STATES.JOURNEY) }
                        ]);
                    }}
                ]);
                break;
            case STATES.JOURNEY:
                if (window.GPSTracker) {
                    GPSTracker.start(segment.stations, segment.line, {
                        onPositionUpdate: (pos) => {
                            updateLiveCardGPSIndicator(pos.accuracy);
                        },
                        onStationPassed: (stationName, index) => {
                            markStationPassedInLiveCard(index);
                        },
                        onApproachingDeboard: (stationName) => {
                            addCampaignAlert('Get ready!', `Your stop **${stationName}** is next. Please move towards the doors.`, 'primary', 'campaign');
                        },
                        onArrived: (stationName) => {
                            addCampaignAlert('You have arrived!', `Welcome to **${stationName}**. Please deboard now.`, 'secondary', 'train');
                            setOptions([
                                { text: 'I have deboarded', action: () => {
                                    handleUserReply('I have deboarded');
                                    if (window.GPSTracker) GPSTracker.stop();
                                    if (currentSegmentIndex < routeData.segments.length - 1) {
                                        currentSegmentIndex++;
                                        transitionTo(STATES.BOARDING);
                                    } else {
                                        transitionTo(STATES.DESTINATION);
                                    }
                                }}
                            ]);
                        },
                        onError: (msg) => {
                            addBotMessage(`Could not track location: ${msg}. Let me know when you arrive.`);
                            showManualDeboardOptions(segment.deboardAt, isFinalSegment);
                        }
                    }, gpsIndex);
                } else {
                    showManualDeboardOptions(segment.deboardAt, isFinalSegment);
                }
                break;
            case STATES.DESTINATION:
                if (optionsContainer) optionsContainer.innerHTML = '';
                const compContainer = document.getElementById('chat-completion-container');
                if (compContainer) compContainer.classList.remove('hidden');
                break;
        }
    }


    function init() {
        chatView = document.getElementById('chat-view');
        messagesContainer = document.getElementById('chat-messages');
        optionsContainer = document.getElementById('chat-options');
        searchPanel = document.getElementById('home-hero-and-search');
        lineLegend = document.querySelector('.line-legend');
        routeResultsView = document.getElementById('route-results');
        
        const backBtn = document.getElementById('chat-back-btn');
        if (backBtn) backBtn.addEventListener('click', closeChat);
        
        const routeBtn = document.getElementById('chat-route-btn');
        if (routeBtn) routeBtn.addEventListener('click', showFullRoute);
        
        const routeBackBtn = document.getElementById('route-back-btn');
        if (routeBackBtn) {
            routeBackBtn.addEventListener('click', backToChatFromRoute);
        }

        const completionBtn = document.getElementById('chat-completion-btn');
        if (completionBtn) {
            completionBtn.addEventListener('click', () => {
                handleUserReply('Plan another journey');
                closeChat();
            });
        }

        // Global shell elements bound only once
        if (!globalListenersBound) {
            const headerBackBtn = document.getElementById('chat-header-back-btn');
            if (headerBackBtn) headerBackBtn.addEventListener('click', closeChat);
            globalListenersBound = true;
        }
    }

    /**
     * Start a new chat session for a route.
     */
    function startChat(result, from, to) {
        init();

        routeData = result;
        fromStation = from;
        toStation = to;
        currentSegmentIndex = 0;

        // Reset UI
        if (messagesContainer) messagesContainer.innerHTML = '';
        if (optionsContainer) optionsContainer.innerHTML = '';
        
        // Hide completion container
        const compContainer = document.getElementById('chat-completion-container');
        if (compContainer) compContainer.classList.add('hidden');

        // Hide search, show chat
        if (searchPanel) searchPanel.classList.add('hidden');
        if (lineLegend) lineLegend.classList.add('hidden');
        if (routeResultsView) {
            routeResultsView.classList.add('hidden');
            routeResultsView.classList.remove('active');
        }
        
        if (chatView) {
            chatView.classList.remove('hidden');
            chatView.classList.add('active');
        }

        if (typeof UI !== 'undefined' && UI.toggleChatTheme) UI.toggleChatTheme(true);

        // Start state machine
        transitionTo(STATES.TICKET_CHECK);

        // Transition URL path to chat guide view
        if (typeof Router !== 'undefined') {
            Router.navigate('/chat-guide');
        }
    }

    /**
     * State Machine Transition Logic
     */
    function transitionTo(newState, payload = null) {
        currentState = newState;
        optionsContainer.innerHTML = ''; // Clear old options

        const segment = routeData.segments[currentSegmentIndex];

        switch (newState) {
            case STATES.TICKET_CHECK:
                addBotMessage(`Hi! Let's start your journey from **${fromStation}** to **${toStation}**.`);
                setTimeout(() => {
                    addBotMessage(`Before we begin, have you purchased your ticket?`);
                    setOptions([
                        { text: 'Yes, I have it', action: () => handleUserReply('Yes, I have it', STATES.BOARDING) },
                        { text: 'No, not yet', action: () => {
                            handleUserReply('No, not yet');
                            addBotMessage(`Okay! You can navigate to the ticket counter to get a ticket to **${toStation}**.<br><br>💡 **Pro Tip:** Skip the queue and get a 5% discount by buying a QR ticket instantly on WhatsApp. <a href="https://wa.me/918105556677?text=Hi" target="_blank" style="color: #007bff; font-weight: bold; text-decoration: underline;">Click here to open Namma Metro WhatsApp</a>`);
                            setOptions([
                                { text: 'I have purchased the ticket now', action: () => handleUserReply('I have purchased the ticket now', STATES.BOARDING) }
                            ]);
                        }}
                    ]);
                }, 800);
                break;

            case STATES.BOARDING:
                let boardPrefix = currentSegmentIndex === 0 ? "Great!" : `You are now at **${segment.boardAt}**.`;
                addBotMessage(`${boardPrefix} Go to **Platform ${segment.platform}** and board the **${segment.line} Line** train heading towards **${segment.directionLabel.replace('Towards ', '')}**.`);
                
                setTimeout(() => {
                    addBotMessage(`Have you boarded the train?`);
                    setOptions([
                        { text: 'Yes, I am on the train', action: () => handleUserReply('Yes, I am on the train', STATES.JOURNEY) },
                        { text: 'No, waiting for it', action: () => {
                            handleUserReply('No, waiting for it');
                            addBotMessage(`No problem. Please wait safely at the platform. Let me know when you board.`);
                            setOptions([
                                { text: 'I have boarded', action: () => handleUserReply('I have boarded', STATES.JOURNEY) }
                            ]);
                        }}
                    ]);
                }, 800);
                break;

            case STATES.JOURNEY:
                const isFinalSegment = currentSegmentIndex === routeData.segments.length - 1;

                if (isFinalSegment) {
                    addBotMessage(`Awesome! We are on the final stretch to **${segment.deboardAt}**.`);
                } else {
                    addBotMessage(`Awesome! Since we need to switch lines later, your stop on this train will be the interchange at **${segment.deboardAt}**.`);
                }

                addBotMessage(`It is **${segment.stops} stop${segment.stops !== 1 ? 's' : ''}** away and will take about **${segment.estimatedMinutes} minutes**.`);
                
                // Add the live route card
                currentLiveCard = createLiveRouteCard(segment);
                messagesContainer.appendChild(currentLiveCard);
                scrollToBottom();

                // Start GPS tracking
                if (window.GPSTracker) {
                    GPSTracker.start(segment.stations, segment.line, {
                        onPositionUpdate: (pos) => {
                            updateLiveCardGPSIndicator(pos.accuracy);
                        },
                        onStationPassed: (stationName, index) => {
                            markStationPassedInLiveCard(index);
                        },
                        onApproachingDeboard: (stationName) => {
                            addCampaignAlert('Get ready!', `Your stop **${stationName}** is next. Please move towards the doors.`, 'primary', 'campaign');
                        },
                        onArrived: (stationName) => {
                            addCampaignAlert('You have arrived!', `Welcome to **${stationName}**. Please deboard now.`, 'secondary', 'train');
                            setOptions([
                                { text: 'I have deboarded', action: () => {
                                    handleUserReply('I have deboarded');
                                    if (window.GPSTracker) GPSTracker.stop();
                                    if (currentSegmentIndex < routeData.segments.length - 1) {
                                        currentSegmentIndex++;
                                        transitionTo(STATES.BOARDING);
                                    } else {
                                        transitionTo(STATES.DESTINATION);
                                    }
                                }}
                            ]);
                        },
                        onGPSLost: () => {
                            addBotMessage(`📡 GPS signal lost (likely underground). I'll estimate your position based on timing.`);
                            updateLiveCardGPSIndicator('lost');
                        },
                        onGPSRestored: () => {
                            updateLiveCardGPSIndicator('restored');
                        },
                        onError: (msg) => {
                            // Fallback to manual flow
                            addBotMessage(`Could not track location: ${msg}. Let me know when you arrive.`);
                            showManualDeboardOptions(segment.deboardAt, isFinalSegment);
                        }
                    });
                } else {
                    // Fallback
                    showManualDeboardOptions(segment.deboardAt, isFinalSegment);
                }
                break;

            case STATES.DESTINATION:
                addBotMessage(`You have arrived at **${toStation}**. Have a wonderful day in Bengaluru!`);
                optionsContainer.innerHTML = '';
                const compContainer = document.getElementById('chat-completion-container');
                if (compContainer) compContainer.classList.remove('hidden');
                break;
        }
    }

    /**
     * UI Helpers
     */
    function showManualDeboardOptions(deboardAt, isFinalSegment) {
        setTimeout(() => {
            if (!isFinalSegment) {
                addBotMessage(`Please deboard the train when you arrive at **${deboardAt}**.`);
            }
            addBotMessage(`Have you reached **${deboardAt}** and stepped off the train?`);
            setOptions([
                { text: 'Yes, I have deboarded', action: () => {
                    handleUserReply('Yes, I have deboarded');
                    if (window.GPSTracker) GPSTracker.stop();
                    if (currentSegmentIndex < routeData.segments.length - 1) {
                        currentSegmentIndex++;
                        transitionTo(STATES.BOARDING);
                    } else {
                        transitionTo(STATES.DESTINATION);
                    }
                }},
                { text: 'No, still riding', action: () => {
                    handleUserReply('No, still riding');
                    addBotMessage(`Relax and enjoy the ride! Just tap the button when you step off at **${deboardAt}**.`);
                    setOptions([
                        { text: 'I have deboarded now', action: () => {
                            handleUserReply('I have deboarded now');
                            if (window.GPSTracker) GPSTracker.stop();
                            if (currentSegmentIndex < routeData.segments.length - 1) {
                                currentSegmentIndex++;
                                transitionTo(STATES.BOARDING);
                            } else {
                                transitionTo(STATES.DESTINATION);
                            }
                        }}
                    ]);
                }}
            ]);
        }, 1000);
    }

    function getLineBgColorClass(line) {
        const upper = line.toUpperCase();
        if (upper.includes('GREEN')) return 'bg-secondary';
        if (upper.includes('PURPLE')) return 'bg-primary';
        if (upper.includes('YELLOW')) return 'bg-amber-600';
        if (upper.includes('PINK')) return 'bg-pink-600';
        if (upper.includes('BLUE')) return 'bg-blue-600';
        return 'bg-slate-600';
    }

    function getLineFixedColorClass(line) {
        const upper = line.toUpperCase();
        if (upper.includes('GREEN')) return 'bg-secondary-fixed';
        if (upper.includes('PURPLE')) return 'bg-primary-fixed';
        if (upper.includes('YELLOW')) return 'bg-amber-100';
        if (upper.includes('PINK')) return 'bg-pink-100';
        if (upper.includes('BLUE')) return 'bg-blue-100';
        return 'bg-slate-300';
    }

    function getLineBadgeClasses(line) {
        const upper = line.toUpperCase();
        if (upper.includes('GREEN')) {
            return { bg: 'bg-secondary-container', text: 'text-on-secondary-container' };
        }
        if (upper.includes('PURPLE')) {
            return { bg: 'bg-primary-container', text: 'text-on-primary-container' };
        }
        if (upper.includes('YELLOW')) {
            return { bg: 'bg-amber-100', text: 'text-amber-800' };
        }
        if (upper.includes('PINK')) {
            return { bg: 'bg-pink-100', text: 'text-pink-800' };
        }
        if (upper.includes('BLUE')) {
            return { bg: 'bg-blue-100', text: 'text-blue-800' };
        }
        return { bg: 'bg-slate-100', text: 'text-slate-800' };
    }

    function getLineTextColorClass(line) {
        const upper = line.toUpperCase();
        if (upper.includes('GREEN')) return 'text-secondary';
        if (upper.includes('PURPLE')) return 'text-primary';
        if (upper.includes('YELLOW')) return 'text-amber-600';
        if (upper.includes('PINK')) return 'text-pink-600';
        if (upper.includes('BLUE')) return 'text-blue-600';
        return 'text-slate-600';
    }

    function createLiveRouteCard(segment) {
        const div = document.createElement('div');
        div.className = 'chat-bubble-in flex flex-col items-start w-full md:max-w-[90%] live-route-card';
        
        let stationsHtml = '';
        segment.stations.forEach((stationName, idx) => {
            let initialOpacity = 'opacity-40';
            let initialDesc = 'Scheduled';
            if (idx === 0) {
                initialOpacity = 'opacity-100';
                initialDesc = 'Boarding';
            }
            
            stationsHtml += `
                <div class="relative live-card-station ${initialOpacity}" data-index="${idx}">
                    <span class="absolute -left-[26px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 station-dot bg-slate-300" style="transition: all 0.3s ease;"></span>
                    <p class="font-label-md text-on-surface font-semibold">${formatStation(stationName)}</p>
                    <p class="text-label-sm text-on-surface-variant station-desc">${initialDesc}</p>
                </div>
            `;
        });

        const badgeClasses = getLineBadgeClasses(segment.line);
        const textColorClass = getLineTextColorClass(segment.line);

        div.innerHTML = `
            <div class="bg-white rounded-xl border border-outline-variant p-6 shadow-sm w-full">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-2">
                        <span class="${badgeClasses.bg} ${badgeClasses.text} text-label-sm px-3 py-1 rounded-full font-bold">
                            ${segment.line} LINE
                        </span>
                        <div class="flex items-center gap-1 ${textColorClass} text-label-sm font-bold">
                            <span class="w-2 h-2 rounded-full pulse-indicator ${getLineBgColorClass(segment.line)}"></span>
                            <span id="gps-status-indicator">📡 Locating...</span>
                        </div>
                    </div>
                    <span class="text-on-surface-variant text-label-sm">Train: T-241</span>
                </div>
                <h2 class="text-headline-md font-headline-md text-on-surface mb-2">Heading to ${formatStation(segment.deboardAt)}</h2>
                <p class="text-body-md text-on-surface-variant mb-6">${segment.stops} stop${segment.stops !== 1 ? 's' : ''} away • ~${segment.estimatedMinutes} minutes</p>
                
                <!-- Vertical Journey Line -->
                <div class="relative pl-8">
                    <!-- Gray background line -->
                    <div class="absolute left-3 top-2 bottom-2 w-1.5 rounded-full opacity-20 ${getLineBgColorClass(segment.line)}"></div>
                    <!-- Live progress line -->
                    <div class="absolute left-3 top-2 w-1.5 rounded-full live-card-progress-line ${getLineBgColorClass(segment.line)}" style="height: 0%; transition: height 0.5s ease;"></div>
                    
                    <div class="flex flex-col gap-8">
                        ${stationsHtml}
                    </div>
                </div>
            </div>
        `;

        return div;
    }

    function formatStation(name) {
        // Simple HTML escape
        const div = document.createElement('div');
        div.textContent = name;
        return div.innerHTML;
    }

    function markStationPassedInLiveCard(index) {
        if (!currentLiveCard) return;
        const segment = routeData.segments[currentSegmentIndex];
        if (!segment) return;
        
        const stations = currentLiveCard.querySelectorAll('.live-card-station');
        stations.forEach((st) => {
            const stIdx = parseInt(st.dataset.index);
            const dot = st.querySelector('.station-dot');
            const desc = st.querySelector('.station-desc');
            
            st.classList.remove('opacity-100', 'opacity-60', 'opacity-40');
            
            if (stIdx < index) {
                // Departed station
                st.classList.add('opacity-60');
                if (dot) {
                    dot.className = 'absolute -left-[26px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 station-dot ' + getLineBgColorClass(segment.line);
                    dot.style.backgroundColor = ''; // clear inline style
                }
                if (desc) desc.textContent = 'Departed';
            } else if (stIdx === index) {
                // Current station
                st.classList.add('opacity-100');
                if (dot) {
                    dot.className = 'absolute -left-[26px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 station-dot bounce-train ' + getLineBgColorClass(segment.line);
                    dot.style.backgroundColor = ''; // clear inline style
                }
                if (desc) desc.textContent = 'Next Station';
            } else {
                // Upcoming station
                st.classList.add('opacity-40');
                if (dot) {
                    dot.className = 'absolute -left-[26px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 station-dot bg-slate-300';
                    dot.style.backgroundColor = ''; // clear inline style
                }
                if (desc) desc.textContent = 'Expected';
            }
        });
        
        // Update progress line height
        const progressLine = currentLiveCard.querySelector('.live-card-progress-line');
        if (progressLine && stations.length > 1) {
            const pct = (index / (stations.length - 1)) * 100;
            progressLine.style.height = `${pct}%`;
        }

        // Scroll current station into view if needed
        const currentSt = stations[index];
        if (currentSt) {
            currentSt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function updateLiveCardGPSIndicator(status) {
        if (!currentLiveCard) return;
        const ind = currentLiveCard.querySelector('#gps-status-indicator');
        if (!ind) return;
        
        const segment = routeData.segments[currentSegmentIndex];
        const textColorClass = segment ? getLineTextColorClass(segment.line) : 'text-secondary';

        // Clear existing color classes
        ind.className = '';
        
        if (status === 'lost') {
            ind.innerHTML = '⏱️ Estimating...';
            ind.className = 'text-amber-600';
        } else {
            ind.innerHTML = '📍 Live tracking';
            ind.className = textColorClass;
        }
    }

    function addBotMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-bubble-in flex flex-col items-start max-w-[85%] mb-2';
        msgDiv.style.opacity = '1';
        msgDiv.style.transform = 'translateY(0px)';
        msgDiv.innerHTML = `
            <div class="bg-white p-4 rounded-2xl rounded-tl-none border border-outline-variant text-on-surface shadow-sm">
                <p class="font-body-md text-body-md leading-relaxed">${formatText(text)}</p>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
        saveSession();
    }

    function addCampaignAlert(title, text, type, iconName) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-bubble-in flex flex-col items-start w-full max-w-[85%] mb-2';
        msgDiv.style.opacity = '1';
        msgDiv.style.transform = 'translateY(0px)';
        
        let borderClass = 'border-primary';
        let bgClass = 'bg-surface-container-high';
        let iconColor = 'text-primary';

        if (type === 'secondary') {
            borderClass = 'border-secondary';
            bgClass = 'bg-secondary-container';
            iconColor = 'text-secondary';
        }
        
        msgDiv.innerHTML = `
            <div class="${bgClass} border-l-4 ${borderClass} p-4 rounded-lg flex gap-4 items-start shadow-sm w-full">
                <span class="material-symbols-outlined ${iconColor}" style="font-variation-settings: 'FILL' 1;">${iconName}</span>
                <div>
                    <p class="font-label-md text-on-surface font-semibold">${title}</p>
                    <p class="text-body-md text-on-surface-variant">${formatText(text)}</p>
                </div>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
        saveSession();
    }

    function handleUserReply(text, nextState = null) {
        // Remove options immediately
        optionsContainer.innerHTML = '';
        
        // Add user message bubble
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-bubble-out flex flex-col items-end self-end max-w-[85%] mb-2';
        msgDiv.style.opacity = '1';
        msgDiv.style.transform = 'translateY(0px)';
        msgDiv.innerHTML = `
            <div class="bg-primary p-4 rounded-2xl rounded-tr-none text-on-primary shadow-sm">
                <p class="font-body-md text-body-md leading-relaxed">${formatText(text)}</p>
            </div>
            <span class="text-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">done_all</span> Delivered
            </span>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
        saveSession();

        // Proceed to next state if provided
        if (nextState) {
            if (nextState === STATES.JOURNEY) {
                // Synchronous transition to preserve user gesture for GPS prompt
                transitionTo(nextState);
            } else {
                setTimeout(() => {
                    transitionTo(nextState);
                }, 600);
            }
        }
    }

    function setOptions(options) {
        optionsContainer.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            if (opt.text === 'Plan another journey') {
                btn.className = 'w-full bg-white hover:bg-surface-container border-2 border-primary text-primary py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 group font-headline-md text-headline-md shadow-sm';
                btn.innerHTML = `
                    <span class="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">refresh</span>
                    <span>Plan another journey</span>
                `;
            } else {
                btn.className = 'chat-option-btn';
                btn.textContent = opt.text;
            }
            btn.addEventListener('click', opt.action);
            optionsContainer.appendChild(btn);
        });
        saveSession();
    }

    function scrollToBottom() {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
    }

    function formatText(text) {
        // Simple markdown bolding **text** -> <strong>text</strong>
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    /**
     * View Toggles
     */
    function closeChat() {
        clearSession();
        if (window.GPSTracker) GPSTracker.stop();
        if (typeof UI !== 'undefined' && UI.toggleChatTheme) UI.toggleChatTheme(false);
        
        if (typeof Router !== 'undefined') {
            Router.navigate('/home');
        }
    }

    function showFullRoute() {
        currentView = 'route';
        if (chatView) {
            chatView.classList.remove('active');
            chatView.classList.add('hidden');
        }
        if (routeResultsView) {
            routeResultsView.classList.remove('hidden');
            routeResultsView.classList.add('active');
        }
        saveSession();
    }

    function backToChatFromRoute() {
        currentView = 'chat';
        if (routeResultsView) {
            routeResultsView.classList.remove('active');
            routeResultsView.classList.add('hidden');
        }
        if (chatView) {
            chatView.classList.remove('hidden');
            chatView.classList.add('active');
        }
        saveSession();
    }

    return {
        restoreSession,
        startChat,
        closeChat
    };
})();
