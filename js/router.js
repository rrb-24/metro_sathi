/**
 * Metro Sathi — Client-side Router
 * Manages clean URLs (History API), HTML view loading (Fetch API), and routing states.
 */

const Router = (() => {
    // Detect base directory for GitHub Pages (e.g. /metro-sathi)
    const pathSegments = window.location.pathname.split('/');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const basePath = (!isLocal && pathSegments.length > 1 && pathSegments[1] !== '') ? '/' + pathSegments[1] : '';

    // Cache to prevent reloading HTML template content
    const templateCache = {};

    // Route-to-view template name mapping
    const routes = {
        '/': 'home',
        '/home': 'home',
        '/chat-guide': 'home',
        '/metro-lines': 'metro-lines',
        '/buy-tickets': 'buy-tickets'
    };

    /**
     * Navigate to a clean URL path.
     */
    function navigate(path) {
        const fullPath = basePath + path;
        window.history.pushState(null, null, fullPath);
        loadRoute(path);
    }

    /**
     * Fetch HTML content and inject it into the app shell.
     */
    async function loadRoute(path) {
        let matchedRoute = '/';
        let selectedLineId = null;

        // Pathname parsing and sub-route matching
        if (path === '/' || path === '/home' || path === '/chat-guide') {
            matchedRoute = path === '/' ? '/home' : path;
        } else if (path === '/buy-tickets') {
            matchedRoute = '/buy-tickets';
        } else if (path === '/metro-lines') {
            matchedRoute = '/metro-lines';
        } else if (path.startsWith('/metro-lines/')) {
            matchedRoute = '/metro-lines';
            selectedLineId = path.replace('/metro-lines/', '').toUpperCase();
        } else {
            matchedRoute = '/home'; // fallback
        }

        const templateFile = `views/${routes[matchedRoute]}.html`;

        try {
            let htmlContent = templateCache[templateFile];
            if (!htmlContent) {
                // Fetch the HTML template snippet from the server
                const response = await fetch(basePath + '/' + templateFile);
                if (!response.ok) throw new Error(`Could not load template file: ${templateFile}`);
                htmlContent = await response.text();
                templateCache[templateFile] = htmlContent;
            }

            // Inject template HTML into target element
            const appContent = document.getElementById('app-content');
            appContent.innerHTML = htmlContent;

            // Highlight navbar tabs active link
            updateNavbarActive(matchedRoute);

            // Hook layout details headers/footers
            UI.toggleChatTheme(false);

            // Initialize view event bindings
            if (matchedRoute === '/home' || matchedRoute === '/chat-guide') {
                UI.initHome();
                
                if (matchedRoute === '/chat-guide') {
                    const savedSession = sessionStorage.getItem('metroSathiSession');
                    if (savedSession) {
                        try {
                            const session = JSON.parse(savedSession);
                            Chat.restoreSession(session);
                        } catch (e) {
                            console.error('Session restore failed:', e);
                            sessionStorage.removeItem('metroSathiSession');
                            navigate('/home');
                        }
                    } else {
                        navigate('/home');
                    }
                }
            } else if (matchedRoute === '/metro-lines') {
                UI.initLines(selectedLineId);
            } else if (matchedRoute === '/buy-tickets') {
                UI.initTickets();
            }

        } catch (error) {
            console.error('Template loading failed:', error);
            document.getElementById('app-content').innerHTML = `
                <div class="max-w-4xl mx-auto px-gutter py-24 text-center">
                    <p class="text-xl text-red-600 font-bold mb-4">Error loading page content</p>
                    <p class="text-on-surface-variant mb-4">${error.message}</p>
                    <pre class="text-left bg-surface-container p-4 rounded-xl text-xs overflow-auto font-mono text-error border border-outline-variant max-w-2xl mx-auto">${error.stack}</pre>
                </div>
            `;
        }
    }

    /**
     * Highlight navbar tabs active link.
     */
    function updateNavbarActive(route) {
        const navLinkHome = document.getElementById('nav-link-home');
        const navLinkLines = document.getElementById('nav-link-lines');
        const navLinkTickets = document.getElementById('nav-link-tickets');

        if (!navLinkHome || !navLinkLines || !navLinkTickets) return;

        navLinkHome.classList.remove('active');
        navLinkLines.classList.remove('active');
        navLinkTickets.classList.remove('active');

        if (route === '/home' || route === '/chat-guide') {
            navLinkHome.classList.add('active');
        } else if (route === '/metro-lines') {
            navLinkLines.classList.add('active');
        } else if (route === '/buy-tickets') {
            navLinkTickets.classList.add('active');
        }
    }

    /**
     * Initialize Router — intercept links, handle 404 redirects, popstate re-loads.
     */
    async function init() {
        // Load global Namma Metro station data
        try {
            await MetroData.load();
        } catch (err) {
            console.error('Data load error:', err);
        }

        // Check if redirected from SPA 404.html proxy
        const urlParams = new URLSearchParams(window.location.search);
        const redirectPath = urlParams.get('r');
        
        let path = window.location.pathname;

        // Clean up base path directory prefix for correct route mapping
        if (basePath && path.startsWith(basePath)) {
            path = path.slice(basePath.length);
        }

        if (redirectPath) {
            const decodedPath = decodeURIComponent(redirectPath);
            window.history.replaceState(null, null, basePath + decodedPath);
            path = decodedPath;
        }

        // Handle Back/Forward history navigation clicks
        window.addEventListener('popstate', () => {
            let currentPath = window.location.pathname;
            if (basePath && currentPath.startsWith(basePath)) {
                currentPath = currentPath.slice(basePath.length);
            }
            loadRoute(currentPath || '/');
        });

        // Intercept all local anchor link clicks for SPA path transitions
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Only intercept relative paths that start with '/'
            if (href.startsWith('/') && !href.startsWith('//')) {
                e.preventDefault();
                navigate(href);
            }
        });

        // Load the initial view
        await loadRoute(path || '/');



        console.log('Router initialized successfully!');
    }

    return {
        init,
        navigate,
        getBasePath: () => basePath
    };
})();

// Self initialize on page load
window.addEventListener('DOMContentLoaded', () => Router.init());
