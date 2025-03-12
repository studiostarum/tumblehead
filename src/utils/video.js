/**
 * Video Utilities
 * 
 * Helper functions for working with videos in the application.
 */

import { initializePlyrVideos } from '../components/video-player';

/**
 * Set up integration with Finsweet CMS for videos
 */
export function setupFinsweetVideoIntegration() {
  if (window.fsAttributes) {
    window.fsAttributes = window.fsAttributes || [];
    
    // Finsweet CMS Filter integration
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
    
    // Finsweet CMS Load integration for "load more" functionality
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
  
  // Set up MutationObserver for dynamically added videos
  setupMutationObserver();
}

/**
 * Set up a MutationObserver to watch for dynamically added videos
 */
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    let hasNewVideos = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node or its children contain video elements
            if (node.querySelector('video') || node.tagName === 'VIDEO') {
              hasNewVideos = true;
              break;
            }
          }
        }
      }
    });
    
    if (hasNewVideos) {
      // Initialize videos after a short delay
      setTimeout(initializePlyrVideos, 100);
    }
  });
  
  // Start observing the document
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
 * Get video type from URL or file extension
 * @param {string} url Video URL
 * @returns {string} Video MIME type
 */
export function getVideoTypeFromUrl(url) {
  if (!url) return 'video/mp4'; // Default
  
  const extension = url.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogg':
    case 'ogv':
      return 'video/ogg';
    case 'mov':
      return 'video/quicktime';
    default:
      return 'video/mp4'; // Default to mp4
  }
}

/**
 * Check if device supports autoplay
 * @returns {Promise<boolean>} Whether autoplay is supported
 */
export async function canAutoplay() {
  if (!document.createElement('video').play) {
    return false;
  }
  
  try {
    // Create test video
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('src', 'data:video/mp4;base64,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');
    video.muted = true;
    
    // Try to play
    await video.play();
    return true;
  } catch (error) {
    return false;
  }
}

// Export for external use
export default {
  setupFinsweetVideoIntegration,
  getVideoTypeFromUrl,
  canAutoplay
}; 