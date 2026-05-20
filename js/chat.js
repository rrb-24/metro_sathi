/**
 * Metro Sathi — Chat Controller
 * Manages the interactive step-by-step route guidance.
 */

const Chat = (() => {
    let routeData = null;
    let fromStation = '';
    let toStation = '';
    let currentSegmentIndex = 0;
    
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

    function init() {
        chatView = document.getElementById('chat-view');
        messagesContainer = document.getElementById('chat-messages');
        optionsContainer = document.getElementById('chat-options');
        searchPanel = document.querySelector('.search-panel');
        lineLegend = document.querySelector('.line-legend');
        routeResultsView = document.getElementById('route-results');
        
        document.getElementById('chat-back-btn').addEventListener('click', closeChat);
        document.getElementById('chat-route-btn').addEventListener('click', showFullRoute);
        document.getElementById('route-back-btn').addEventListener('click', backToChatFromRoute);
    }

    /**
     * Start a new chat session for a route.
     */
    function startChat(result, from, to) {
        if (!chatView) init();

        routeData = result;
        fromStation = from;
        toStation = to;
        currentSegmentIndex = 0;

        // Reset UI
        messagesContainer.innerHTML = '';
        optionsContainer.innerHTML = '';
        
        // Hide search, show chat
        searchPanel.classList.add('hidden');
        lineLegend.classList.add('hidden');
        routeResultsView.classList.add('hidden');
        routeResultsView.classList.remove('active');
        
        chatView.classList.remove('hidden');
        chatView.classList.add('active');

        // Start state machine
        transitionTo(STATES.TICKET_CHECK);
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
                            addBotMessage(`Okay, please navigate to the ticket counter and get a ticket to **${toStation}**.`);
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
                addBotMessage(`Awesome. Your stop is **${segment.deboardAt}**.`);
                addBotMessage(`It is **${segment.stops} stop${segment.stops !== 1 ? 's' : ''}** away and will take about **${segment.estimatedMinutes} minutes**.`);
                
                setTimeout(() => {
                    addBotMessage(`Have you reached ${segment.deboardAt} and stepped off the train?`);
                    setOptions([
                        { text: 'Yes, I have deboarded', action: () => {
                            handleUserReply('Yes, I have deboarded');
                            // Check if there's another segment
                            if (currentSegmentIndex < routeData.segments.length - 1) {
                                currentSegmentIndex++;
                                transitionTo(STATES.BOARDING); // It handles interchange inherently
                            } else {
                                transitionTo(STATES.DESTINATION);
                            }
                        }},
                        { text: 'No, still riding', action: () => {
                            handleUserReply('No, still riding');
                            addBotMessage(`Relax and enjoy the ride! Just tap the button when you step off at **${segment.deboardAt}**.`);
                            setOptions([
                                { text: 'I have deboarded now', action: () => {
                                    handleUserReply('I have deboarded now');
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
                break;

            case STATES.DESTINATION:
                addBotMessage(`You have arrived at **${toStation}**. Have a wonderful day in Bengaluru!`);
                setOptions([
                    { text: 'Plan another journey', action: () => {
                        handleUserReply('Plan another journey');
                        closeChat();
                    }}
                ]);
                break;
        }
    }

    /**
     * UI Helpers
     */
    function addBotMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg chat-msg--bot';
        msgDiv.innerHTML = `<div class="chat-msg__bubble">${formatText(text)}</div>`;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function handleUserReply(text, nextState = null) {
        // Remove options immediately
        optionsContainer.innerHTML = '';
        
        // Add user message bubble
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg chat-msg--user';
        msgDiv.innerHTML = `<div class="chat-msg__bubble">${formatText(text)}</div>`;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();

        // Proceed to next state if provided
        if (nextState) {
            setTimeout(() => {
                transitionTo(nextState);
            }, 600);
        }
    }

    function setOptions(options) {
        optionsContainer.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-option-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', opt.action);
            optionsContainer.appendChild(btn);
        });
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function formatText(text) {
        // Simple markdown bolding **text** -> <strong>text</strong>
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    /**
     * View Toggles
     */
    function closeChat() {
        chatView.classList.remove('active');
        chatView.classList.add('hidden');
        routeResultsView.classList.remove('active');
        routeResultsView.classList.add('hidden');
        
        searchPanel.classList.remove('hidden');
        lineLegend.classList.remove('hidden');
    }

    function showFullRoute() {
        chatView.classList.remove('active');
        chatView.classList.add('hidden');
        routeResultsView.classList.remove('hidden');
        routeResultsView.classList.add('active');
    }

    function backToChatFromRoute() {
        routeResultsView.classList.remove('active');
        routeResultsView.classList.add('hidden');
        chatView.classList.remove('hidden');
        chatView.classList.add('active');
    }

    return {
        startChat
    };
})();
