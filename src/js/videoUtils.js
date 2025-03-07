/**
 * Video initialization and management utilities
 */

/**
 * Initialize or reinitialize videos with lazy loading
 */
export function initializeVideos() {
  const videos = document.querySelectorAll('video[data-lazy-load="true"]');
  console.log('Initializing videos:', videos.length);
  videos.forEach(video => {
    if (!video.hasAttribute('data-loaded')) {
      video.src = video.getAttribute('data-src');
      video.setAttribute('data-loaded', 'true');
      video.play().catch(function(error) {
        console.log("Video play failed:", error);
      });
    }
  });
}

/**
 * Setup Finsweet CMS Filter integration for videos
 */
export function setupFinsweetVideoIntegration() {
  // Initialize videos on page load
  document.addEventListener('DOMContentLoaded', initializeVideos);

  // Re-initialize videos after Finsweet CMS filter changes
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    'cmsfilter',
    async (filterInstances) => {
      // Wait for the first filter instance to be ready
      const [filterInstance] = filterInstances;
      console.log('Filter instance initialized:', filterInstance);

      // Reset any existing filter state
      if (filterInstance && filterInstance.resetFilters) {
        await filterInstance.resetFilters();
      }

      // The `renderitems` event runs whenever the list renders items after filtering
      filterInstance.listInstance.on('renderitems', (renderedItems) => {
        console.log('Items rendered:', renderedItems.length);
        
        // Only initialize videos if we have items
        if (renderedItems.length > 0) {
          setTimeout(initializeVideos, 100);
        }
      });

      // Also listen for beforerender to catch any issues
      filterInstance.listInstance.on('beforerender', (items) => {
        console.log('Before render, items to show:', items.length);
      });
    },
  ]);

  // Add a global error handler for Finsweet
  window.addEventListener('fs-cmsfilter-error', (event) => {
    console.error('Finsweet CMS Filter error:', event.detail);
  });
} 