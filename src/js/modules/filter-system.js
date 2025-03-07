import { initVideoLightbox } from './video-lightbox';

/**
 * Initialize the Finsweet CMS Filter system with video reinitializing
 */
export function initFilterSystem() {
    // Wait for Finsweet CMS Filter to be loaded
    const checkFinsweet = setInterval(() => {
        if (window.FsAttributes && window.FsAttributes.cmsfilter) {
            clearInterval(checkFinsweet);
            setupFilterListeners();
        }
    }, 100);

    // Set a maximum wait time of 5 seconds
    setTimeout(() => {
        clearInterval(checkFinsweet);
        if (!window.FsAttributes || !window.FsAttributes.cmsfilter) {
            console.warn('Finsweet CMS Filter not loaded after 5 seconds');
        }
    }, 5000);
}

/**
 * Set up listeners for Finsweet filter events
 */
function setupFilterListeners() {
    // Listen for the Finsweet filter-complete event
    document.addEventListener('finsweet:cmsfilter:filteringcomplete', () => {
        console.log('Filtering complete, reinitializing video players...');
        
        // Reinitialize video lightbox to add play buttons to newly visible videos
        setTimeout(() => {
            initVideoLightbox();
        }, 100);
    });
} 