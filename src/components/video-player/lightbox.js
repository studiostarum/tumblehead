/**
 * Video Lightbox Component
 * 
 * Handles the creation and management of the video lightbox functionality.
 * This includes opening/closing the lightbox, handling scroll locking, and
 * managing the lightbox player instance.
 */

import Plyr from 'plyr';
import { 
  createPosterRemovalObserver,
  preloadVideoSource, 
  configureVideoSource, 
  ensureVideoVisibility 
} from './index';

// Use the shared observer for removing poster elements
const lightboxPosterRemovalObserver = createPosterRemovalObserver();

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
  
  // Add click handler to close when clicking outside the player
  lightboxContainer.addEventListener('click', (e) => {
    // Only close if clicking directly on the container (not on child elements)
    if (e.target === lightboxContainer) {
      closeLightbox();
    }
  });
  
  // Create the video wrapper
  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'video-inner';
  
  // Prevent clicks on the video wrapper from closing the lightbox
  videoWrapper.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Create the video element
  const video = document.createElement('video');
  video.setAttribute('data-plyr', 'true');
  video.setAttribute('playsinline', '');
  video.setAttribute('controls', '');
  video.setAttribute('muted', '');
  video.className = 'lightbox-video';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'contain';
  video.style.position = 'absolute';
  video.style.top = '0';
  video.style.left = '0';
  video.preload = 'auto';
  
  // Ensure the poster shows the first frame
  video.currentTime = 0;
  video.style.backgroundImage = 'none';
  video.style.background = 'transparent';
  
  // Append elements - removed mobile controls
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
      'play',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'fullscreen',
    ],
    resetOnEnd: true,
    clickToPlay: true,
    displayDuration: true,
    tooltips: { controls: true, seek: true },
    keyboard: { focused: true, global: true },
    fullscreen: { enabled: true, fallback: true, iosNative: true },
    hideControls: false,
    controlsTimeout: -1,
    muted: false,
    volume: 1,
    autoplay: false,
    disablePictureInPicture: true,
    loadSprite: false,
    seekTime: 10 // 10 second increments for keyboard seeking
  });
  
  // After creation, ensure no poster is shown
  if (lightboxPlayer.elements && lightboxPlayer.elements.poster) {
    // Completely remove the poster element
    lightboxPlayer.elements.poster.remove();
  }
  
  // Also modify the internal Plyr settings after initialization
  if (lightboxPlayer.config) {
    lightboxPlayer.config.hideControls = false;
    lightboxPlayer.config.controlsTimeout = -1;
  }
  
  // Make sure controls are not disabled
  if (lightboxPlayer.elements && lightboxPlayer.elements.controls) {
    lightboxPlayer.elements.controls.style.display = 'flex';
    lightboxPlayer.elements.controls.style.opacity = '1';
    lightboxPlayer.elements.controls.style.pointerEvents = 'auto';
    
    // Prevent clicks on controls from closing the lightbox
    lightboxPlayer.elements.controls.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // Prevent clicks on the player container from closing the lightbox
  if (lightboxPlayer.elements && lightboxPlayer.elements.container) {
    lightboxPlayer.elements.container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // Fix mute button functionality
  const fixMuteButton = () => {
    if (lightboxPlayer.elements && lightboxPlayer.elements.buttons && lightboxPlayer.elements.buttons.mute) {
      const muteButton = lightboxPlayer.elements.buttons.mute[0];
      if (muteButton) {
        // Clone and replace to remove any existing handlers
        const newMuteButton = muteButton.cloneNode(true);
        muteButton.parentNode.replaceChild(newMuteButton, muteButton);
        
        // Add our custom handler
        newMuteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          // Force toggle the mute state and update UI
          if (lightboxPlayer.muted) {
            // Unmute
            lightboxPlayer.muted = false;
            lightboxPlayer.volume = lightboxPlayer.volume > 0 ? lightboxPlayer.volume : 0.5;
            newMuteButton.setAttribute('aria-label', 'Mute');
            newMuteButton.setAttribute('title', 'Mute');
          } else {
            // Mute
            lightboxPlayer.muted = true;
            newMuteButton.setAttribute('aria-label', 'Unmute');
            newMuteButton.setAttribute('title', 'Unmute');
          }
          
          // Also update any display classes on the button
          newMuteButton.classList.toggle('plyr__control--pressed', lightboxPlayer.muted);
          
          // Force update the icon if needed
          const icon = newMuteButton.querySelector('.icon--not-pressed');
          const pressedIcon = newMuteButton.querySelector('.icon--pressed');
          
          if (icon && pressedIcon) {
            if (lightboxPlayer.muted) {
              icon.style.display = 'none';
              pressedIcon.style.display = 'block';
            } else {
              icon.style.display = 'block';
              pressedIcon.style.display = 'none';
            }
          }
        }, true);
      }
    }
  };
  
  // Fix the mute button immediately and also when state changes
  fixMuteButton();
  lightboxPlayer.on('ready', fixMuteButton);
  lightboxPlayer.on('loadeddata', fixMuteButton);
  
  // Add keyboard shortcut support
  document.addEventListener('keydown', (e) => {
    if (!lightboxPlayer || !document.querySelector('.video-lightbox-container.lightbox-mode')) return;
    
    // Add keyboard shortcuts for seeking
    if (e.key === 'ArrowRight') {
      lightboxPlayer.forward(10); // Forward 10 seconds
    } else if (e.key === 'ArrowLeft') {
      lightboxPlayer.rewind(10); // Rewind 10 seconds
    } else if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === ' ' || e.key === 'k') {
      // Space or K key for play/pause
      if (lightboxPlayer.playing) {
        lightboxPlayer.pause();
      } else {
        lightboxPlayer.play();
      }
    }
  });
  
  return { backdrop, closeButton };
}

/**
 * Open a video in lightbox mode
 * @param {HTMLElement} container The video container element
 * @param {Plyr} originalPlayer The original Plyr instance
 */
function openLightbox(container, originalPlayer) {
  // Start observing to prevent poster elements
  lightboxPosterRemovalObserver.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['poster', 'style', 'data-poster', 'src', 'data-src', 'class'] 
  });

  // Get video source from the original player
  const originalVideo = container.querySelector('video');
  if (!originalVideo) return;
  
  const videoSrc = originalVideo.querySelector('source')?.src || originalVideo.src;
  if (!videoSrc) return;
  
  // Preload the video to avoid thumbnail generation
  preloadVideoSource(videoSrc);
  
  // Lock scroll position first before any DOM manipulations
  lockScroll();
  
  // Initialize the lightbox if needed
  const { backdrop, closeButton } = initLightboxPlayer();
  
  // Get the lightbox container
  const lightboxContainer = document.querySelector('.video-lightbox-container');
  if (!lightboxContainer) return;
  
  // Show the lightbox UI first before attempting to load or play video
  lightboxContainer.style.display = 'block';
  lightboxContainer.classList.add('lightbox-mode');
  
  // Activate backdrop and close button
  backdrop.classList.add('active');
  closeButton.classList.add('active');
  
  // Set up the video in the lightbox
  const lightboxVideo = lightboxContainer.querySelector('video');
  if (lightboxVideo) {
    // Configure the video source
    configureVideoSource(lightboxVideo, videoSrc);
    
    // Ensure video is visible
    ensureVideoVisibility(lightboxVideo);
    
    // Once the lightbox is visible, set up the player source and play
    setTimeout(() => {
      if (lightboxPlayer) {
        // Set video source
        lightboxPlayer.source = {
          type: 'video',
          sources: [
            {
              src: videoSrc,
              type: videoSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4'
            }
          ]
        };
        
        // Unmute and prepare for playback
        lightboxPlayer.muted = false;
        lightboxPlayer.volume = 1;
        
        // Play after a short delay to allow loading
        setTimeout(() => {
          lightboxPlayer.play().catch(error => {
            // Show play button prominently if autoplay fails
            console.error('Lightbox autoplay failed:', error);
          });
        }, 100);
      }
    }, 300);
  }
}

/**
 * Close lightbox and return to preview mode
 */
function closeLightbox() {
  // Stop observing for poster elements when closing
  lightboxPosterRemovalObserver.disconnect();
  
  const lightboxContainer = document.querySelector('.video-lightbox-container');
  const backdrop = document.querySelector('.video-lightbox-backdrop');
  const closeButton = document.querySelector('.lightbox-close');
  
  if (!lightboxContainer) return;
  
  // Prevent multiple close operations
  if (lightboxContainer.classList.contains('lightbox-closing')) return;
  
  // Pause the lightbox video
  if (lightboxPlayer) {
    lightboxPlayer.pause();
  }
  
  // Add closing class for CSS transitions
  lightboxContainer.classList.add('lightbox-closing');
  
  // Start transition out
  if (backdrop) backdrop.classList.add('closing');
  if (closeButton) closeButton.classList.remove('active');
  
  // Hide after animation completes
  setTimeout(() => {
    lightboxContainer.style.display = 'none';
    lightboxContainer.classList.remove('lightbox-mode');
    lightboxContainer.classList.remove('lightbox-closing');
    
    if (backdrop) backdrop.classList.remove('active');
    if (backdrop) backdrop.classList.remove('closing');
    
    // Unlock scrolling
    unlockScroll();
  }, 400); // Match animation duration in CSS
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
  
  // Add global click handler to close popover when clicking outside
  document.addEventListener('click', (e) => {
    // Find the settings menu and button
    const settingsMenu = document.querySelector('.plyr__menu__container');
    const settingsButton = document.querySelector('.video-lightbox-container .plyr__control[data-plyr="settings"]');
    
    // Only process when settings menu is visible
    if (settingsMenu && settingsMenu.classList.contains('plyr__menu__container--open')) {
      // If click is outside both the menu and the button
      if (!settingsMenu.contains(e.target) && 
          !(settingsButton && settingsButton.contains(e.target))) {
        // Close the menu
        settingsMenu.classList.remove('plyr__menu__container--open');
        settingsMenu.style.display = 'none';
        settingsMenu.style.opacity = '0';
      }
    }
  }, true); // Use capturing phase

  // Add global handler for clicks inside the menu to close it after selecting an option
  document.addEventListener('click', (e) => {
    // Find the settings menu
    const settingsMenu = document.querySelector('.plyr__menu__container');
    
    // Check if we clicked on a menu item inside the settings menu
    const isMenuItem = e.target.closest('.plyr__menu__container .plyr__control');
    
    // If clicking a menu item that's not a submenu toggle
    if (settingsMenu && 
        settingsMenu.classList.contains('plyr__menu__container--open') && 
        isMenuItem && 
        !isMenuItem.classList.contains('plyr__control--forward') &&
        !isMenuItem.classList.contains('plyr__menu__back')) {
      
      // Allow a moment for the option to be applied, then close the menu
      setTimeout(() => {
        settingsMenu.classList.remove('plyr__menu__container--open');
        settingsMenu.style.display = 'none';
        settingsMenu.style.opacity = '0';
      }, 100);
    }
  }, true);
}

// Export the lightbox functionality
export const initLightbox = {
  init,
  openLightbox,
  closeLightbox
}; 