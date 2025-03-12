/**
 * Simplified Plyr implementation for Webflow
 */
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { createIcons, Play, X } from 'lucide';

// Track initialized players to prevent duplicates
const initializedVideos = new Set();
const players = [];
let lightboxPlayer = null;
let scrollPosition = 0;

// Create backdrop element for lightbox mode
function createBackdrop() {
  const backdrop = document.createElement('div');
  backdrop.className = 'video-lightbox-backdrop';
  document.body.appendChild(backdrop);
  
  // Close lightbox when backdrop is clicked
  backdrop.addEventListener('click', closeLightbox);
  
  return backdrop;
}

// Lock page scrolling while maintaining position
function lockScroll() {
  // Store current scroll position
  scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  // Add styles to lock scrolling
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
  
  // Add a class for additional CSS control
  document.body.classList.add('scroll-locked');
  
  // iOS specific fix
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.documentElement.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
  }
}

// Unlock page scrolling and restore position
function unlockScroll() {
  // Remove scroll locking styles
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  
  // Remove class
  document.body.classList.remove('scroll-locked');
  
  // iOS specific fix
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.documentElement.style.height = '';
    document.documentElement.style.overflow = '';
  }
  
  // Restore scroll position
  window.scrollTo(0, scrollPosition);
}

// Create the lightbox container
function createLightboxContainer() {
  // Create the main container
  const lightboxContainer = document.createElement('div');
  lightboxContainer.className = 'video-lightbox-container';
  
  // Create the video wrapper
  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'video-inner';
  
  // Create the video element
  const video = document.createElement('video');
  video.setAttribute('data-plyr', 'true');
  video.setAttribute('playsinline', '');
  
  // Append elements
  videoWrapper.appendChild(video);
  lightboxContainer.appendChild(videoWrapper);
  
  // Hide initially
  lightboxContainer.style.display = 'none';
  
  // Add to body
  document.body.appendChild(lightboxContainer);
  
  return { container: lightboxContainer, video };
}

// Create close button for lightbox
function createCloseButton() {
  const closeButton = document.createElement('button');
  closeButton.className = 'lightbox-close';
  closeButton.setAttribute('aria-label', 'Close video');
  closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });
  
  return closeButton;
}

// Add a play button to preview mode
function addPreviewPlayButton(container) {
  const playButton = document.createElement('button');
  playButton.className = 'preview-play-button';
  playButton.setAttribute('aria-label', 'Play video');
  playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
  
  container.appendChild(playButton);
  
  // Track previews with buttons
  container.setAttribute('data-has-preview-button', 'true');
  
  return playButton;
}

// Initialize the lightbox player if not already initialized
function initLightboxPlayer() {
  // If we already have a lightbox setup, just return
  if (document.querySelector('.video-lightbox-container') && lightboxPlayer) {
    return { backdrop: document.querySelector('.video-lightbox-backdrop'), closeButton: document.querySelector('.lightbox-close') };
  }
  
  // Create backdrop
  const backdrop = createBackdrop();
  
  // Create the lightbox container and video
  const { container: lightboxContainer, video } = createLightboxContainer();
  
  // Create close button
  const closeButton = createCloseButton();
  lightboxContainer.appendChild(closeButton);
  
  // Initialize Plyr on the lightbox video
  lightboxPlayer = new Plyr(video, {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'mute',
      'volume',
      'fullscreen',
    ],
    resetOnEnd: true,
    clickToPlay: true
  });
  
  // When video ends, close lightbox
  lightboxPlayer.on('ended', () => {
    closeLightbox();
  });
  
  return { backdrop, closeButton };
}

// Open a video in lightbox mode
function openLightbox(container, originalPlayer) {
  // Get video source from the original player
  const originalVideo = container.querySelector('video');
  if (!originalVideo) return;
  
  const videoSrc = originalVideo.querySelector('source')?.src || originalVideo.src;
  if (!videoSrc) return;
  
  // Initialize the lightbox if needed
  const { backdrop, closeButton } = initLightboxPlayer();
  
  // Get the lightbox container
  const lightboxContainer = document.querySelector('.video-lightbox-container');
  if (!lightboxContainer) return;
  
  // Get poster if available
  const poster = originalVideo.poster;
  
  // Get the current playback position and state of the original video
  const currentTime = originalPlayer ? originalPlayer.currentTime : 0;
  const wasPlaying = originalPlayer ? !originalPlayer.paused : false;
  
  // Set the source and poster for the lightbox video
  const lightboxVideo = lightboxContainer.querySelector('video');
  if (!lightboxVideo) return;
  
  if (videoSrc) {
    if (!lightboxVideo.querySelector('source')) {
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
      
      lightboxVideo.appendChild(source);
    } else {
      lightboxVideo.querySelector('source').src = videoSrc;
    }
    
    // Apply poster if available
    if (poster) {
      lightboxVideo.poster = poster;
    }
  }
  
  // Lock scroll position
  lockScroll();
  
  // Show the lightbox
  lightboxContainer.style.display = 'block';
  lightboxContainer.classList.add('lightbox-mode');
  
  // Activate backdrop and close button
  backdrop.classList.add('active');
  closeButton.classList.add('active');
  
  // Note: We don't pause the original video anymore
  // Let the original video continue playing
  
  // Update the lightbox player source and play
  if (lightboxPlayer) {
    lightboxPlayer.source = {
      type: 'video',
      sources: [
        {
          src: videoSrc,
          type: videoSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4'
        }
      ]
    };
    
    // Play with a slight delay to allow animation, 
    // and start from the same position as the original video
    setTimeout(() => {
      // Set the same timestamp as the original video
      lightboxPlayer.currentTime = currentTime;
      
      // Match muted state with original player
      lightboxPlayer.muted = false; // Always unmuted in lightbox
      
      lightboxPlayer.play().catch(err => {
        console.log('Autoplay prevented in lightbox:', err);
      });
    }, 400);
  }
  
  // Listen for ESC key
  document.addEventListener('keydown', handleEscKey);
}

// Close lightbox and return to preview mode
function closeLightbox() {
  const lightboxContainer = document.querySelector('.video-lightbox-container');
  const backdrop = document.querySelector('.video-lightbox-backdrop');
  const closeButton = document.querySelector('.lightbox-close');
  
  if (!lightboxContainer) return;
  
  // Pause the lightbox video only
  if (lightboxPlayer) {
    lightboxPlayer.pause();
  }
  
  // Hide the lightbox
  lightboxContainer.style.display = 'none';
  lightboxContainer.classList.remove('lightbox-mode');
  
  // Deactivate backdrop and close button
  if (backdrop) backdrop.classList.remove('active');
  if (closeButton) closeButton.classList.remove('active');
  
  // Unlock scroll position and restore it
  unlockScroll();
  
  // Remove ESC key listener
  document.removeEventListener('keydown', handleEscKey);
  
  // Note: We don't restart the original video
  // or change its state in any way
}

// Handle ESC key to close lightbox
function handleEscKey(e) {
  if (e.key === 'Escape') {
    closeLightbox();
  }
}

// Find the player instance for a container
function findPlayerForContainer(container) {
  const videoEl = container.querySelector('video');
  if (!videoEl) return null;
  
  return players.find(p => p.elements.original === videoEl);
}

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
          
          // Apply poster if specified
          if (video.getAttribute('data-poster')) {
            video.poster = video.getAttribute('data-poster');
          }
        }
      }
      
      // Initialize Plyr
      const plyrOptions = {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'fullscreen',
        ],
        resetOnEnd: true,
        clickToPlay: true,
        muted: video.hasAttribute('data-muted') || false,
        autoplay: video.hasAttribute('data-autoplay') || false,
      };
      
      // Create Plyr instance
      const player = new Plyr(video, plyrOptions);
      
      // Set initialized status
      video.setAttribute('data-plyr-initialized', 'true');
      initializedVideos.add(video);
      players.push(player);
      
      // Find container and add preview mode
      const videoContainer = findVideoContainer(video);
      if (videoContainer) {
        // Initial state: preview mode
        videoContainer.classList.add('preview-mode');
        
        // Add play button if not already there
        if (!videoContainer.getAttribute('data-has-preview-button')) {
          const playButton = addPreviewPlayButton(videoContainer);
          
          // Click to open lightbox
          playButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(videoContainer, player);
          });
          
          // Container click also opens lightbox
          videoContainer.addEventListener('click', (e) => {
            if (videoContainer.classList.contains('preview-mode')) {
              e.preventDefault();
              openLightbox(videoContainer, player);
            }
          });
        }
        
        // Mute for preview mode and start playing
        player.muted = true;
        player.currentTime = 0;
        player.play().catch(() => {
          // Autoplay may be blocked by browser policy
          console.log('Autoplay prevented by browser policy');
        });
      }
    }
  });
}

// Find the video container for a video
function findVideoContainer(video) {
  let element = video.parentElement;
  
  // Look for video-inner first
  while (element && !element.classList.contains('video-inner')) {
    element = element.parentElement;
  }
  
  // If found video-inner, get its parent video-container
  if (element && element.classList.contains('video-inner')) {
    return element.parentElement;
  }
  
  // If not found, look for video-container directly
  element = video.parentElement;
  while (element && !element.classList.contains('video-container')) {
    element = element.parentElement;
  }
  
  return element;
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
  // Initialize Lucide icons
  createIcons({
    icons: {
      Play,
      X
    }
  });
  
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