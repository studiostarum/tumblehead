/**
 * Webflow Plyr Integration
 * 
 * This file handles the integration between Webflow CMS and the Plyr video player.
 * It provides functions for initializing videos from Webflow CMS collections
 * and handling CMS-specific events like pagination and filtering.
 */

import videoPlayer from '.';
const { initVideoPlayer, initializePlyrVideos, logDebug } = videoPlayer;

// Debug mode - set to false to disable all console logs
const DEBUG_MODE = false;

// Flag to prevent multiple initializations during page load
let hasInitialized = false;

// Default aspect ratio options
const ASPECT_RATIO_OPTIONS = {
  '16:9': '56.25%',
  '4:3': '75%',
  '1:1': '100%',
  '9:16': '177.78%'
};

/**
 * Set up aspect ratio for a video container
 * @param {HTMLElement} container The video container element
 */
function setupAspectRatio(container) {
  const videoElement = container.querySelector('video[data-plyr="true"]');
  if (!videoElement) return;

  // Get aspect ratio from data attribute or default to 16:9
  const aspectRatio = videoElement.getAttribute('data-aspect-ratio') || '16:9';
  
  // Set the aspect ratio attribute on the container
  container.setAttribute('data-aspect-ratio', aspectRatio);
  
  // If custom aspect ratio, calculate and set the custom value
  if (aspectRatio === 'custom') {
    const customRatio = videoElement.getAttribute('data-custom-ratio');
    if (customRatio) {
      // Calculate percentage from ratio (e.g., "3:4" -> 133.33%)
      const [width, height] = customRatio.split(':').map(Number);
      const percentage = (height / width) * 100;
      container.style.setProperty('--custom-aspect-ratio', `${percentage}%`);
    }
  }

  // Also set up lightbox content aspect ratio if it exists
  const lightboxContent = document.querySelector('.video-lightbox-content');
  if (lightboxContent) {
    lightboxContent.setAttribute('data-aspect-ratio', aspectRatio);
    if (aspectRatio === 'custom') {
      const customRatio = videoElement.getAttribute('data-custom-ratio');
      if (customRatio) {
        const [width, height] = customRatio.split(':').map(Number);
        const percentage = (height / width) * 100;
        lightboxContent.style.setProperty('--custom-aspect-ratio', `${percentage}%`);
      }
    }
  }
}

/**
 * Initialize all videos when Webflow page loads
 */
function initOnWebflowLoad() {
  // Initialize only once during page load
  if (hasInitialized) {
    logDebug('Plyr videos already initialized, skipping duplicate initialization');
    return;
  }
  
  hasInitialized = true;
  
  // Initialize on DOM ready - with single execution guarantee
  document.addEventListener('DOMContentLoaded', () => {
    logDebug('Initializing Plyr videos for Webflow');
    
    // Set up aspect ratios for all video containers
    document.querySelectorAll('.video-container').forEach(setupAspectRatio);
    
    initVideoPlayer();
  }, { once: true });
  
  // Initialize on Webflow page change (if using Webflow interactions) - with single execution guarantee
  window.addEventListener('Webflow.ready', () => {
    logDebug('Webflow ready, initializing Plyr videos');
    
    // Set up aspect ratios for all video containers
    document.querySelectorAll('.video-container').forEach(setupAspectRatio);
    
    initializePlyrVideos();
  }, { once: true });
}

/**
 * Setup CMS integration for dynamic content
 */
function setupCMSIntegration() {
  // Webflow's native pagination
  const paginationLinks = document.querySelectorAll('.w-pagination-wrapper a');
  paginationLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Wait for new content to load
      setTimeout(initializePlyrVideos, 500);
    });
  });
  
  // Webflow's load more button
  const loadMoreButton = document.querySelector('.w-pagination-next');
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => {
      // Wait for new content to load
      setTimeout(initializePlyrVideos, 500);
    });
  }
  
  // Finsweet CMS Filter integration
  if (window.fsAttributes) {
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push([
      'cmsfilter',
      (filterInstances) => {
        if (!filterInstances || !filterInstances.length) return;
        
        const [filterInstance] = filterInstances;
        if (!filterInstance || !filterInstance.listInstance) return;
        
        // The `renderitems` event runs whenever the list renders items after filtering
        filterInstance.listInstance.on('renderitems', () => {
          setTimeout(initializePlyrVideos, 100);
        });
      },
    ]);
  }
  
  // Finsweet CMS Load integration for "load more" functionality
  if (window.fsAttributes) {
    window.fsAttributes.push([
      'cmsload',
      (loadInstances) => {
        if (!loadInstances || !loadInstances.length) return;
        
        const [loadInstance] = loadInstances;
        if (!loadInstance) return;
        
        // Initialize when new items are loaded
        loadInstance.on('afterload', () => {
          setTimeout(initializePlyrVideos, 100);
        });
      },
    ]);
  }
  
  // MutationObserver fallback for other dynamic content changes
  const observer = new MutationObserver((mutations) => {
    let shouldInit = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && 
              (node.querySelector('video[data-plyr="true"]') || 
               node.querySelector('[data-plyr-provider]'))) {
            shouldInit = true;
            break;
          }
        }
        if (shouldInit) break;
      }
    }
    
    if (shouldInit) {
      setTimeout(initializePlyrVideos, 100);
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });
}

/**
 * Initialize the Webflow-Plyr integration
 */
export function initWebflowPlyrIntegration() {
  initOnWebflowLoad();
  setupCMSIntegration();
  
  // Expose for external use (e.g., from the Webflow Designer code)
  window.initializePlyr = initializePlyrVideos;
}

// Auto-initialize on script load
initWebflowPlyrIntegration(); 