/**
 * Simplified Plyr implementation for Webflow
 */
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

// Track initialized players to prevent duplicates
const initializedVideos = new Set();
const players = [];

/**
 * Initialize all videos with data-plyr="true" attribute
 */
function initializePlyrVideos() {
  // Select all videos with data-plyr="true" that haven't been initialized yet
  const videos = document.querySelectorAll('video[data-plyr="true"]:not([data-plyr-initialized])');
  
  videos.forEach(video => {
    if (!initializedVideos.has(video)) {
      // If video has a data-src attribute, set it as the source
      if (video.getAttribute('data-src') && !video.src) {
        const videoSrc = video.getAttribute('data-src');
        
        // Only set src if it's a valid URL
        if (videoSrc && (videoSrc.startsWith('http') || videoSrc.startsWith('//'))) {
          // Create source element if it doesn't exist
          if (!video.querySelector('source')) {
            const source = document.createElement('source');
            source.src = videoSrc;
            
            // Try to determine type from URL
            if (videoSrc.endsWith('.mp4')) {
              source.type = 'video/mp4';
            } else if (videoSrc.endsWith('.webm')) {
              source.type = 'video/webm';
            } else if (videoSrc.endsWith('.mov')) {
              source.type = 'video/quicktime';
            } else {
              source.type = 'video/mp4'; // Default to mp4
            }
            
            video.appendChild(source);
          } else {
            // If source exists but needs updating
            const source = video.querySelector('source');
            if (source.src !== videoSrc) {
              source.src = videoSrc;
            }
          }
          
          // Set poster if available
          if (video.getAttribute('data-poster') && !video.poster) {
            video.poster = video.getAttribute('data-poster');
          }
          
          video.load();
        }
      }
      
      // Create a Plyr instance for the video
      try {
        const player = new Plyr(video, {
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'fullscreen'
          ],
          clickToPlay: true,
          muted: video.hasAttribute('muted') || video.getAttribute('data-muted') === 'true',
          autoplay: video.hasAttribute('autoplay') || video.getAttribute('data-autoplay') === 'true'
        });
        
        // Mark as initialized
        video.setAttribute('data-plyr-initialized', 'true');
        players.push(player);
        initializedVideos.add(video);
        
        // Lazy loading with Intersection Observer
        if (typeof IntersectionObserver !== 'undefined' && 
            (video.getAttribute('data-lazy-load') === 'true' || video.getAttribute('data-lazy-load') === null)) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                if (player && (video.getAttribute('data-autoplay') === 'true' || video.hasAttribute('autoplay'))) {
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
 * Initialize Plyr with Vimeo or YouTube videos
 */
function initializePlyrEmbeds() {
  // Process all elements with data-plyr-provider attribute (youtube/vimeo)
  const embeds = document.querySelectorAll('[data-plyr-provider]:not([data-plyr-initialized])');
  
  embeds.forEach(embed => {
    if (!initializedVideos.has(embed)) {
      try {
        const provider = embed.getAttribute('data-plyr-provider');
        const videoId = embed.getAttribute('data-plyr-embed-id');
        
        if (!provider || !videoId) {
          console.error('Missing provider or video ID for Plyr embed');
          return;
        }
        
        const player = new Plyr(embed, {
          provider: provider,
          plyr: {
            controls: [
              'play-large',
              'play',
              'progress',
              'current-time',
              'mute', 
              'volume',
              'fullscreen'
            ]
          }
        });
        
        // Mark as initialized
        embed.setAttribute('data-plyr-initialized', 'true');
        players.push(player);
        initializedVideos.add(embed);
      } catch (error) {
        console.error('Error initializing Plyr embed:', error);
      }
    }
  });
}

/**
 * Handle CMS collection changes and reinitialize
 */
function setupCMSIntegration() {
  // Webflow's native pagination
  const paginationLinks = document.querySelectorAll('.w-pagination-wrapper a');
  paginationLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Wait for new content to load
      setTimeout(initializePlyr, 500);
    });
  });
  
  // Webflow's load more button
  const loadMoreButton = document.querySelector('.w-pagination-next');
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => {
      // Wait for new content to load
      setTimeout(initializePlyr, 500);
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
          setTimeout(initializePlyr, 100);
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
          setTimeout(initializePlyr, 100);
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
      setTimeout(initializePlyr, 100);
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
 * Initialize all Plyr videos and embeds
 */
function initializePlyr() {
  initializePlyrVideos();
  initializePlyrEmbeds();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initializePlyr();
  setupCMSIntegration();
});

// Initialize on Webflow page change (if using Webflow interactions)
window.addEventListener('Webflow.ready', () => {
  initializePlyr();
  setupCMSIntegration();
});

// Clean up Plyr instances on page unload
window.addEventListener('beforeunload', () => {
  players.forEach(player => {
    if (player && typeof player.destroy === 'function') {
      player.destroy();
    }
  });
});

// Expose for external use
window.initializePlyr = initializePlyr; 