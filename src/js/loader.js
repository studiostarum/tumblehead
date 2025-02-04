/**
 * Script loader with version control
 * This small script should be directly embedded in Webflow
 */
(function() {
    const CURRENT_VERSION = '1.0.0'; // We'll update this automatically in our build process
    const STORAGE_KEY = 'th_script_version';
    const BASE_URL = 'https://cdn.jsdelivr.net/gh/studiostarum/tumblehead@main/dist';
    
    function loadResource(type, path) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            const existingElement = document.querySelector(`[data-version="${CURRENT_VERSION}"][data-resource="${path}"]`);
            if (existingElement) {
                console.log(`Resource ${path} already loaded`);
                resolve();
                return;
            }
            
            const element = document.createElement(type === 'js' ? 'script' : 'link');
            
            // Set common attributes
            element.setAttribute('data-version', CURRENT_VERSION);
            element.setAttribute('data-resource', path);
            
            if (type === 'js') {
                element.src = `${BASE_URL}/${path}?v=${CURRENT_VERSION}`;
                element.async = true;
            } else {
                element.rel = 'stylesheet';
                element.href = `${BASE_URL}/${path}?v=${CURRENT_VERSION}`;
            }
            
            // Add load and error handlers
            element.onload = () => {
                console.log(`Successfully loaded ${path}`);
                resolve();
            };
            element.onerror = () => {
                console.error(`Failed to load ${path}. Retrying with uncached version...`);
                // If load fails, try again with a timestamp
                if (type === 'js') {
                    element.src = `${BASE_URL}/${path}?v=${Date.now()}`;
                } else {
                    element.href = `${BASE_URL}/${path}?v=${Date.now()}`;
                }
                // We still resolve here as we don't want to block the chain
                resolve();
            };
            
            // Append to appropriate location
            if (type === 'js') {
                document.body.appendChild(element);
            } else {
                document.head.appendChild(element);
            }
        });
    }
    
    async function loadResources() {
        try {
            // Remove any existing script/style tags from previous versions
            document.querySelectorAll('script[data-version], link[data-version]').forEach(el => {
                if (el.getAttribute('data-version') !== CURRENT_VERSION) {
                    el.parentNode.removeChild(el);
                }
            });
            
            // Load CSS first
            await loadResource('css', 'bundle.min.css');
            // Then load JS
            await loadResource('js', 'bundle.min.js');
            
            // Store the current version
            try {
                localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
            } catch (e) {
                console.warn('LocalStorage not available');
            }
        } catch (error) {
            console.error('Error loading resources:', error);
        }
    }
    
    // Check if we need to force a refresh
    try {
        const storedVersion = localStorage.getItem(STORAGE_KEY);
        if (storedVersion !== CURRENT_VERSION) {
            // Clear application cache if version has changed
            if ('caches' in window) {
                caches.keys().then(keys => {
                    keys.forEach(key => caches.delete(key));
                });
            }
        }
    } catch (e) {
        console.warn('Cache API not available');
    }
    
    // Load all resources
    loadResources();
})(); 