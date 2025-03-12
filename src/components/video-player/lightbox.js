/**
 * Video Lightbox Component
 * 
 * Handles the creation and management of the video lightbox functionality.
 * This includes opening/closing the lightbox, handling scroll locking, and
 * managing the lightbox player instance.
 */

import Plyr from 'plyr';

// Track lightbox state
let lightboxPlayer = null;
let scrollPosition = 0;
let originalBodyStyles = {
  overflow: '',
  paddingRight: '',
  position: '',
  top: '',
  width: '',
  height: ''
};

/**
 * Calculate scrollbar width
 * @returns {number} Width of the scrollbar in pixels
 */
function getScrollbarWidth() {
  // Create a temporary div with scrollbar
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  
  // Create inner div
  const inner = document.createElement('div');
  outer.appendChild(inner);
  
  // Calculate scrollbar width (outer width - inner width)
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  
  // Clean up
  outer.parentNode.removeChild(outer);
  
  return scrollbarWidth;
}

/**
 * Lock page scrolling while maintaining position
 */
function lockScroll() {
  // Store current scroll position
  scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  // Save original styles
  originalBodyStyles.overflow = document.body.style.overflow;
  originalBodyStyles.position = document.body.style.position;
  originalBodyStyles.top = document.body.style.top;
  originalBodyStyles.width = document.body.style.width;
  originalBodyStyles.paddingRight = document.body.style.paddingRight;
  
  // Calculate and add scrollbar width compensation
  const scrollbarWidth = getScrollbarWidth();
  
  // Add padding to compensate for missing scrollbar if a scrollbar is present
  if (window.innerWidth > document.documentElement.clientWidth) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
  
  // Add styles to lock scrolling
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
  
  // Add a class for additional CSS control
  document.body.classList.add('scroll-locked');
  
  // iOS specific fix
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    originalBodyStyles.height = document.documentElement.style.height;
    originalBodyStyles.overflow = document.documentElement.style.overflow;
    
    document.documentElement.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
  }
}

/**
 * Unlock page scrolling and restore position
 */
function unlockScroll() {
  // Remove scroll locking styles
  document.body.style.overflow = originalBodyStyles.overflow;
  document.body.style.position = originalBodyStyles.position;
  document.body.style.top = originalBodyStyles.top;
  document.body.style.width = originalBodyStyles.width;
  document.body.style.paddingRight = originalBodyStyles.paddingRight;
  
  // Remove class
  document.body.classList.remove('scroll-locked');
  
  // iOS specific fix
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.documentElement.style.height = originalBodyStyles.height;
    document.documentElement.style.overflow = originalBodyStyles.overflow;
  }
  
  // Restore scroll position
  window.scrollTo(0, scrollPosition);
}

/**
 * Create the backdrop element for lightbox mode
 * @returns {HTMLElement} The created backdrop element
 */
function createBackdrop() {
  const backdrop = document.createElement('div');
  backdrop.className = 'video-lightbox-backdrop';
  document.body.appendChild(backdrop);
  
  // Close lightbox when backdrop is clicked
  backdrop.addEventListener('click', closeLightbox);
  
  return backdrop;
}

/**
 * Create the lightbox container and video element
 * @returns {Object} Object containing the container and video elements
 */
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

/**
 * Create close button for lightbox
 * @returns {HTMLButtonElement} The created close button
 */
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

/**
 * Initialize the lightbox player if not already initialized
 * @returns {Object} Object containing the backdrop and close button elements
 */
function initLightboxPlayer() {
  // If we already have a lightbox setup, just return
  if (document.querySelector('.video-lightbox-container') && lightboxPlayer) {
    return { 
      backdrop: document.querySelector('.video-lightbox-backdrop'), 
      closeButton: document.querySelector('.lightbox-close') 
    };
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

/**
 * Open a video in lightbox mode
 * @param {HTMLElement} container The video container element
 * @param {Plyr} originalPlayer The original Plyr instance
 */
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

/**
 * Close lightbox and return to preview mode
 */
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
}

/**
 * Handle ESC key to close lightbox
 * @param {KeyboardEvent} e The keyboard event
 */
function handleEscKey(e) {
  if (e.key === 'Escape') {
    closeLightbox();
  }
}

/**
 * Initialize the lightbox component
 */
function init() {
  // Clean up any existing lightbox
  const existingBackdrop = document.querySelector('.video-lightbox-backdrop');
  const existingLightbox = document.querySelector('.video-lightbox-container');
  
  if (existingBackdrop) {
    existingBackdrop.remove();
  }
  
  if (existingLightbox) {
    existingLightbox.remove();
  }
  
  // Initialize new lightbox elements (they will be hidden initially)
  initLightboxPlayer();
}

// Export the lightbox functionality
export const initLightbox = {
  init,
  openLightbox,
  closeLightbox
}; 