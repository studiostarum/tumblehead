/**
 * Video initialization and management utilities
 */
import Plyr from 'plyr';

// Track initialized players to prevent duplicates
const initializedVideos = new Set();
const players = [];

/**
 * Initialize or reinitialize videos with lazy loading using Plyr
 */
export function initializeVideos() {
  const videos = document.querySelectorAll('video[data-lazy-load="true"]');
  console.log('Initializing videos:', videos.length);
  
  videos.forEach(video => {
    // Only initialize videos that haven't been processed yet
    if (!initializedVideos.has(video)) {
      // If video has a data-src attribute, set it as the source
      if (video.getAttribute('data-src') && !video.src) {
        video.src = video.getAttribute('data-src');
        video.setAttribute('data-loaded', 'true');
      }
      
      // Create a Plyr instance for the video
      try {
        const player = new Plyr(video, {
          controls: [
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'fullscreen'
          ],
          clickToPlay: true,
          muted: video.hasAttribute('muted'),
          autoplay: video.hasAttribute('autoplay')
        });
        
        players.push(player);
        initializedVideos.add(video);
        
        // Handle video visibility for better performance
        if (typeof IntersectionObserver !== 'undefined') {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                if (player && video.hasAttribute('autoplay')) {
                  player.play().catch(err => console.log('Auto play failed:', err));
                }
              } else {
                if (player && !player.paused) {
                  player.pause();
                }
              }
            });
          }, { threshold: 0.1 });
          
          observer.observe(video);
        }
      } catch (error) {
        console.error('Error initializing Plyr:', error);
      }
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
      // Check if we have any filter instances
      if (!filterInstances || !filterInstances.length) {
        console.log('No filter instances found, skipping CMS filter setup');
        return;
      }

      // Wait for the first filter instance to be ready
      const [filterInstance] = filterInstances;
      
      if (!filterInstance || !filterInstance.listInstance) {
        console.log('Filter instance not properly initialized, skipping setup');
        return;
      }

      console.log('Filter instance initialized:', filterInstance);

      // Reset any existing filter state
      if (filterInstance.resetFilters) {
        await filterInstance.resetFilters();
      }

      // The `renderitems` event runs whenever the list renders items after filtering
      filterInstance.listInstance.on('renderitems', (renderedItems) => {
        console.log('Items rendered:', renderedItems.length);
        
        // Only initialize videos if we have items
        if (renderedItems.length > 0) {
          // Wait a bit to ensure DOM is updated
          setTimeout(initializeVideos, 200);
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
  
  // Clean up Plyr instances on page unload
  window.addEventListener('beforeunload', () => {
    players.forEach(player => {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    });
  });
} 