/**
 * Webflow Plyr Integration
 * 
 * This file handles the integration between Webflow CMS and the Plyr video player.
 * It provides functions for initializing videos from Webflow CMS collections
 * and handling CMS-specific events like pagination and filtering.
 */

import { initVideoPlayer, initializePlyrVideos } from '../../components/video-player';

/**
 * Initialize all videos when Webflow page loads
 */
function initOnWebflowLoad() {
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Plyr videos for Webflow');
    initVideoPlayer();
  });
  
  // Initialize on Webflow page change (if using Webflow interactions)
  window.addEventListener('Webflow.ready', () => {
    console.log('Webflow ready, initializing Plyr videos');
    initializePlyrVideos();
  });
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