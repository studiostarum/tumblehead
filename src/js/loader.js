/**
 * Script loader with version control
 * This small script should be directly embedded in Webflow
 */
(function() {
    const CURRENT_VERSION = '1.0.0'; // We'll update this automatically in our build process
    const STORAGE_KEY = 'th_script_version';
    const SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/studiostarum/tumblehead@main/dist/bundle.min.js';
    
    function loadMainScript() {
        // Create script element
        const script = document.createElement('script');
        script.src = `${SCRIPT_URL}?v=${CURRENT_VERSION}`;
        script.async = true;
        
        // Add error handling
        script.onerror = () => {
            console.error('Failed to load main script. Retrying with uncached version...');
            // If load fails, try again with a cache buster
            script.src = `${SCRIPT_URL}?v=${Date.now()}`;
        };
        
        // Append to document
        document.body.appendChild(script);
        
        // Store the current version
        try {
            localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    }
    
    // Check if we need to force a refresh
    try {
        const storedVersion = localStorage.getItem(STORAGE_KEY);
        if (storedVersion !== CURRENT_VERSION) {
            // Clear application cache if version has changed
            caches.keys().then(keys => {
                keys.forEach(key => caches.delete(key));
            });
        }
    } catch (e) {
        console.warn('Cache API not available');
    }
    
    // Load the main script
    loadMainScript();
})(); 