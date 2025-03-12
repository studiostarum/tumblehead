// Import video player styles
import './styles.css';

// Import Plyr and its styles
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

// Default options for Plyr video player
const DEFAULT_OPTIONS = {
  autoplay: false,
  muted: false,
  controls: [
    'play-large',
    'play',
    'progress',
    'current-time',
    'volume',
    'fullscreen'
  ],
  loadSprite: true,
  iconUrl: 'https://cdn.plyr.io/3.7.8/plyr.svg',
  blankVideo: 'https://cdn.plyr.io/static/blank.mp4',
  keyboard: { focused: true, global: true },
  tooltips: { controls: true, seek: true },
  captions: { active: true, update: true },
  fullscreen: { 
    enabled: true, 
    fallback: true, 
    iosNative: true,
    container: null
  },
  storage: { enabled: true, key: 'plyr' }
};

// Store initialized players
const players = new Map();
// Store lightbox references
const lightboxes = new Map();

// Debug mode - set to false to disable all console logs
const DEBUG_MODE = false;

// Add page load guard to prevent lightbox opening on page load
const PAGE_LOAD_TIME = Date.now();
const PAGE_LOAD_THRESHOLD = 2500; // ms to consider as initial page load period

// Debug helper function that only logs when DEBUG_MODE is true
function logDebug(message, data) {
  if (DEBUG_MODE) {
    console.log(`%c[Plyr Video] ${message}`, 'background: #008080; color: white; padding: 2px 6px; border-radius: 2px;', data || '');
  }
}

// Function to check if we're in the initial page load period
function isInitialPageLoad() {
  return (Date.now() - PAGE_LOAD_TIME) < PAGE_LOAD_THRESHOLD;
}

/**
 * Initialize Plyr videos with preview mode and lightbox functionality
 */
export function initializePlyrVideos() {
  // Find all video containers with data-plyr attribute
  const videoContainers = document.querySelectorAll('.video-container');
  
  logDebug(`Found ${videoContainers.length} video containers`);
  
  videoContainers.forEach((container, index) => {
    const videoElement = container.querySelector('video[data-plyr="true"]');
    
    if (!videoElement) {
      logDebug(`Container ${index} has no video element with data-plyr="true"`);
      return;
    }
    
    // Skip if already initialized
    if (container.hasAttribute('data-plyr-initialized')) {
      logDebug(`Container ${index} already initialized`);
      return;
    }
    
    // Check if this is a preview mode setup
    const isPreviewMode = videoElement.getAttribute('data-preview-mode') === 'true';
    const shouldAutoplay = videoElement.getAttribute('data-autoplay') === 'true';
    const shouldMute = videoElement.getAttribute('data-muted') === 'true';
    const videoSrc = videoElement.getAttribute('data-src');
    const posterSrc = videoElement.getAttribute('data-poster');
    const usePlyrButton = videoElement.getAttribute('data-use-plyr-button') === 'true';
    
    logDebug(`Container ${index} configuration:`, { 
      isPreviewMode, 
      shouldAutoplay, 
      shouldMute, 
      usePlyrButton,
      videoSrc: videoSrc ? 'set' : 'not set',
      posterSrc: posterSrc ? 'set' : 'not set'
    });
    
    // Set up video properties
    if (videoSrc) {
      videoElement.src = videoSrc;
    }
    
    if (posterSrc) {
      videoElement.poster = posterSrc;
    }
    
    // Set muted state before autoplay to allow autoplay in browsers
    if (shouldMute) {
      videoElement.muted = true;
    }
    
    // Create custom Plyr options for preview mode
    const playerOptions = { ...DEFAULT_OPTIONS };
    
    // If in preview mode, modify controls to prevent default click behavior
    if (isPreviewMode) {
      // For preview mode, hide most controls and only keep essentials
      playerOptions.controls = ['play-large'];
      
      if (!usePlyrButton) {
        playerOptions.clickToPlay = false; // Disable default click-to-play behavior
        playerOptions.dblclickToToggleFullscreen = false; // Disable double-click to fullscreen
      }
      
      // Disable autoplay in preview mode to prevent lightbox from opening automatically
      playerOptions.autoplay = false;
    } else {
      // For non-preview mode, respect the autoplay attribute
      playerOptions.autoplay = shouldAutoplay;
    }
    
    logDebug(`Initializing Plyr for container ${index}`);
    
    // Initialize Plyr with options
    try {
      const player = new Plyr(videoElement, playerOptions);
      
      // Store reference to player
      players.set(container, player);
      
      // Mark as initialized
      container.setAttribute('data-plyr-initialized', 'true');
      
      // Set up preview mode
      if (isPreviewMode) {
        setupPreviewMode(container, player, videoElement, usePlyrButton);
        
        // Apply autoplay for preview mode separately after setup
        // This ensures event handlers are in place before autoplay happens
        if (shouldAutoplay && shouldMute) {
          // Only attempt autoplay if muted (browser restrictions)
          setTimeout(() => {
            if (!container.hasAttribute('data-lightbox-opened')) {
              logDebug(`Attempting to autoplay for container ${index}`);
              
              // Add a flag to prevent lightbox from opening during initial autoplay
              container.setAttribute('data-autoplay-in-progress', 'true');
              
              player.muted = true;
              player.play().catch((error) => {
                logDebug(`Autoplay prevented by browser for container ${index}`, error);
              }).finally(() => {
                // Remove the autoplay flag after playback starts or fails
                setTimeout(() => {
                  container.removeAttribute('data-autoplay-in-progress');
                  logDebug(`Autoplay flag removed for container ${index}`);
                }, 100);
              });
            }
          }, 300);
        }
      }
      
      logDebug(`Successfully initialized container ${index}`);
    } catch (error) {
      if (DEBUG_MODE) {
        console.error('Error initializing Plyr:', error);
      }
    }
  });
}

/**
 * Set up preview mode with lightbox functionality
 * @param {HTMLElement} container The video container
 * @param {Plyr} player The Plyr instance
 * @param {HTMLVideoElement} videoElement The video element
 * @param {boolean} usePlyrButton Whether to use Plyr's native play button
 */
function setupPreviewMode(container, player, videoElement, usePlyrButton = false) {
  // Add preview mode class
  container.classList.add('preview-mode');
  
  // Remove any existing play button first
  const existingButton = container.querySelector('.preview-play-button');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Flag to prevent initial play event from opening lightbox
  let isInitialSetup = true;
  setTimeout(() => {
    isInitialSetup = false;
    logDebug(`Initial setup complete for ${container.id || 'unnamed container'}`);
  }, 2000); // Increased timeout to ensure all initialization is complete
  
  // Set up Plyr's native controls or custom button based on option
  if (usePlyrButton) {
    logDebug(`Setting up Plyr native button for ${container.id || 'unnamed container'}`);
    
    // Use Plyr's native play button - make sure it's visible
    const plyrControls = container.querySelector('.plyr__control--overlaid');
    if (plyrControls) {
      // Force button to be visible and properly circular
      plyrControls.style.opacity = '1';
      plyrControls.style.visibility = 'visible';
      plyrControls.style.pointerEvents = 'auto';
      
      // Ensure proper positioning and circular shape
      plyrControls.style.top = '50%';
      plyrControls.style.left = '50%';
      plyrControls.style.transform = 'translate(-50%, -50%)';
      plyrControls.style.margin = '0';
      
      // Force fixed dimensions for consistent circular shape
      const buttonSize = window.innerWidth <= 480 ? '36px' : 
                         window.innerWidth <= 768 ? '42px' : '48px';
                         
      plyrControls.style.width = buttonSize;
      plyrControls.style.height = buttonSize;
      plyrControls.style.minWidth = buttonSize;
      plyrControls.style.minHeight = buttonSize;
      plyrControls.style.maxWidth = buttonSize;
      plyrControls.style.maxHeight = buttonSize;
      plyrControls.style.borderRadius = '50%';
      plyrControls.style.padding = '0';
      plyrControls.style.boxSizing = 'border-box';
      
      // Center the icon inside
      plyrControls.style.display = 'flex';
      plyrControls.style.alignItems = 'center';
      plyrControls.style.justifyContent = 'center';
      
      // Fix icon position if needed
      const iconSvg = plyrControls.querySelector('svg');
      if (iconSvg) {
        iconSvg.style.position = 'relative';
        iconSvg.style.width = '40%';
        iconSvg.style.height = '40%';
        iconSvg.style.margin = '0';
        iconSvg.style.marginLeft = '10%'; // Visually center the triangle
        iconSvg.style.top = '0';
        iconSvg.style.left = '0';
        iconSvg.style.transform = 'none';
      }
      
      // Set data attribute for tracking
      container.setAttribute('data-using-plyr-button', 'true');
      
      // Prevent Plyr's default play behavior
      player.off('play');
      player.on('play', (event) => {
        // Skip during initial setup, page load, or if autoplay is in progress
        if (isInitialSetup || isInitialPageLoad() || container.hasAttribute('data-autoplay-in-progress')) {
          logDebug('Skipping lightbox open during initial setup, page load, or autoplay');
          return;
        }
        
        // Prevent video from playing
        player.pause();
        
        // Open lightbox instead
        openVideoLightbox(container, player, videoElement);
        
        // Mark that lightbox has been opened for this container
        container.setAttribute('data-lightbox-opened', 'true');
        
        // Prevent bubbling
        event.stopPropagation();
        return false;
      });
      
      // Capture all clicks on container or Plyr button to open lightbox
      container.addEventListener('click', (event) => {
        // Skip during initial setup, page load, or if autoplay is in progress
        if (isInitialSetup || isInitialPageLoad() || container.hasAttribute('data-autoplay-in-progress')) {
          logDebug('Skipping container click during initial setup, page load, or autoplay');
          return;
        }
        
        // Prevent any other click handlers from firing
        event.preventDefault();
        event.stopPropagation();
        
        logDebug('Container clicked, opening lightbox');
        openVideoLightbox(container, player, videoElement);
        
        // Mark that lightbox has been opened for this container
        container.setAttribute('data-lightbox-opened', 'true');
        
        return false;
      }, true); // Use capture phase to get event before other handlers
      
      // Also prevent plyr control click default behavior
      if (plyrControls) {
        plyrControls.addEventListener('click', (event) => {
          // Skip during initial setup, page load, or if autoplay is in progress
          if (isInitialSetup || isInitialPageLoad() || container.hasAttribute('data-autoplay-in-progress')) {
            logDebug('Skipping plyr controls click during initial setup, page load, or autoplay');
            return;
          }
          
          event.preventDefault();
          event.stopPropagation();
          
          logDebug('Plyr controls clicked, opening lightbox');
          openVideoLightbox(container, player, videoElement);
          
          // Mark that lightbox has been opened for this container
          container.setAttribute('data-lightbox-opened', 'true');
          
          return false;
        }, true);
      }
    } else {
      logDebug('ERROR: No plyr controls found in container');
    }
  } else {
    logDebug(`Setting up custom play button for ${container.id || 'unnamed container'}`);
    
    // Use custom button approach
    // Forcefully hide Plyr's native controls
    const plyrControls = container.querySelector('.plyr__control--overlaid');
    if (plyrControls) {
      plyrControls.style.opacity = '0';
      plyrControls.style.visibility = 'hidden';
      plyrControls.style.pointerEvents = 'none';
    }
    
    // Create play button
    const customPlayButton = document.createElement('button');
    customPlayButton.className = 'preview-play-button';
    customPlayButton.setAttribute('aria-label', 'Play video');
    
    // Play icon SVG - using more contrasting/visible version with proper centering
    customPlayButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
           fill="white" stroke="white" stroke-width="2" 
           stroke-linecap="round" stroke-linejoin="round"
           style="width: 40%; height: 40%; margin-left: 10%; position: relative;">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
    
    // Store the container reference on the button for event handling
    customPlayButton.dataset.containerRef = container.id || `plyr-container-${Math.random().toString(36).substr(2, 9)}`;
    if (!container.id) {
      container.id = customPlayButton.dataset.containerRef;
    }
    
    // Calculate button size based on screen width
    const buttonSize = window.innerWidth <= 480 ? '36px' : 
                       window.innerWidth <= 768 ? '42px' : '48px';
    
    // Force button to be visible and on top by setting inline styles with proper centering
    customPlayButton.style.position = 'absolute';
    customPlayButton.style.top = '50%';
    customPlayButton.style.left = '50%';
    customPlayButton.style.transform = 'translate(-50%, -50%)';
    customPlayButton.style.zIndex = '9999';
    customPlayButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    customPlayButton.style.color = 'white';
    customPlayButton.style.borderRadius = '50%';
    customPlayButton.style.display = 'flex';
    customPlayButton.style.alignItems = 'center';
    customPlayButton.style.justifyContent = 'center';
    customPlayButton.style.cursor = 'pointer';
    customPlayButton.style.opacity = '1';
    customPlayButton.style.visibility = 'visible';
    customPlayButton.style.boxShadow = '0 0 0 4px rgba(255, 255, 255, 0.4)';
    customPlayButton.style.padding = '0';
    customPlayButton.style.margin = '0';
    
    // Force fixed dimensions for consistent circular shape
    customPlayButton.style.width = buttonSize;
    customPlayButton.style.height = buttonSize;
    customPlayButton.style.minWidth = buttonSize;
    customPlayButton.style.minHeight = buttonSize;
    customPlayButton.style.maxWidth = buttonSize;
    customPlayButton.style.maxHeight = buttonSize;
    customPlayButton.style.boxSizing = 'border-box';
    
    // Add to the container to maintain proper event context
    container.appendChild(customPlayButton);
    
    // Set attribute for tracking
    container.setAttribute('data-has-preview-button', 'true');
    
    // Ensure the play button has the visible class when added to the container
    customPlayButton.classList.add('is-visible');
    
    // Prevent default play behavior
    player.off('play');
    player.on('play', (event) => {
      // Skip during initial setup, page load, or if autoplay is in progress
      if (isInitialSetup || isInitialPageLoad() || container.hasAttribute('data-autoplay-in-progress')) {
        logDebug('Skipping play event during initial setup, page load, or autoplay');
        return;
      }
      
      // Prevent video from playing
      player.pause();
      
      // Open lightbox instead
      logDebug('Play event fired, opening lightbox');
      openVideoLightbox(container, player, videoElement);
      
      // Mark that lightbox has been opened for this container
      container.setAttribute('data-lightbox-opened', 'true');
      
      // Prevent bubbling
      event.stopPropagation();
      return false;
    });
    
    // Handle visual feedback for play button with proper fade animation
    player.on('play', () => {
      if (isInitialSetup || container.hasAttribute('data-autoplay-in-progress')) return;
      const playButtonElem = container.querySelector('.preview-play-button');
      if (playButtonElem) {
        playButtonElem.classList.remove('is-visible');
        playButtonElem.classList.add('is-hidden');
      }
    });
    
    player.on('pause', () => {
      if (isInitialSetup || container.hasAttribute('data-autoplay-in-progress')) return;
      const playButtonElem = container.querySelector('.preview-play-button');
      if (playButtonElem) {
        playButtonElem.classList.add('is-visible');
        playButtonElem.classList.remove('is-hidden');
      }
    });
    
    // Capture all clicks on container to open lightbox
    container.addEventListener('click', (event) => {
      // Skip during initial setup, page load, or if autoplay is in progress
      if (isInitialSetup || isInitialPageLoad() || container.hasAttribute('data-autoplay-in-progress')) {
        logDebug('Skipping container click during initial setup, page load, or autoplay');
        return;
      }
      
      // Prevent any other click handlers from firing
      event.preventDefault();
      event.stopPropagation();
      
      // Open the lightbox
      logDebug('Container clicked, opening lightbox');
      openVideoLightbox(container, player, videoElement);
      
      // Mark that lightbox has been opened for this container
      container.setAttribute('data-lightbox-opened', 'true');
      
      return false;
    }, true); // Use capture phase to get event before other handlers
    
    // Prevent double-click behavior
    container.addEventListener('dblclick', (event) => {
      // Skip during initial setup, page load, or if autoplay is in progress
      if (isInitialSetup || isInitialPageLoad() || container.hasAttribute('data-autoplay-in-progress')) return;
      
      // Prevent default double-click behavior (like entering fullscreen)
      event.preventDefault();
      event.stopPropagation();
      
      // Don't do anything special on double-click, just prevent default
      return false;
    }, true); // Use capture phase to get event before Plyr handlers
    
    // Handle play button click to open lightbox
    customPlayButton.addEventListener('click', (event) => {
      // Skip during initial setup, page load, or if autoplay is in progress
      if (isInitialSetup || isInitialPageLoad() || container.hasAttribute('data-autoplay-in-progress')) {
        logDebug('Skipping play button click during initial setup, page load, or autoplay');
        return;
      }
      
      // Prevent any other click handlers from firing
      event.preventDefault();
      event.stopPropagation();
      
      // Open the lightbox
      logDebug('Play button clicked, opening lightbox');
      openVideoLightbox(container, player, videoElement);
      
      // Mark that lightbox has been opened for this container
      container.setAttribute('data-lightbox-opened', 'true');
      
      return false;
    }, true); // Use capture phase to get event before other handlers
    
    // Also prevent pause when clicking on the video
    videoElement.addEventListener('click', (event) => {
      // Skip during initial setup, page load, or if autoplay is in progress
      if (isInitialSetup || isInitialPageLoad() || container.hasAttribute('data-autoplay-in-progress')) return;
      
      if (container.classList.contains('preview-mode')) {
        // Prevent default behavior (pausing)
        event.preventDefault();
        event.stopPropagation();
        
        // Open the lightbox
        logDebug('Video element clicked, opening lightbox');
        openVideoLightbox(container, player, videoElement);
        
        // Mark that lightbox has been opened for this container
        container.setAttribute('data-lightbox-opened', 'true');
        
        return false;
      }
    }, true); // Use capture phase to get event before Plyr handlers
  }
}

/**
 * Open video in lightbox
 * @param {HTMLElement} container The video container
 * @param {Plyr} player The Plyr instance
 * @param {HTMLVideoElement} videoElement The video element
 */
function openVideoLightbox(container, player, videoElement) {
  logDebug(`Opening lightbox for ${container.id || 'unnamed container'}`);
  
  // Create lightbox if it doesn't exist
  if (!lightboxes.has(container)) {
    logDebug('Creating new lightbox');
    const lightbox = document.createElement('div');
    lightbox.className = 'video-lightbox';
    lightbox.setAttribute('tabindex', '-1'); // Make focusable
    
    const lightboxInner = document.createElement('div');
    lightboxInner.className = 'video-lightbox-inner';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'video-lightbox-close';
    closeButton.setAttribute('aria-label', 'Close video');
    closeButton.innerHTML = '&times;';
    
    const lightboxContent = document.createElement('div');
    lightboxContent.className = 'video-lightbox-content';
    
    // Clone the video element for the lightbox
    const lightboxVideo = videoElement.cloneNode(true);
    
    // Ensure lightbox video is not muted
    lightboxVideo.muted = false;
    
    // Reset to beginning of video
    lightboxVideo.currentTime = 0;
    
    // Disable autoplay for lightbox video
    lightboxVideo.autoplay = false;
    
    // Ensure preview mode is not active for lightbox video
    lightboxVideo.removeAttribute('data-preview-mode');
    
    // Append elements
    lightboxContent.appendChild(lightboxVideo);
    lightboxInner.appendChild(closeButton);
    lightboxInner.appendChild(lightboxContent);
    lightbox.appendChild(lightboxInner);
    document.body.appendChild(lightbox);
    
    // Initialize Plyr on lightbox video with full controls
    const lightboxPlayerOptions = {
      ...DEFAULT_OPTIONS,
      muted: false,
      autoplay: false, // Ensure no autoplay in the lightbox
      clickToPlay: true, // Make sure clicking the video plays/pauses
      controls: [
        'play-large', // Ensure the large play button is visible
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'fullscreen'
      ]
    };
    
    const lightboxPlayer = new Plyr(lightboxVideo, lightboxPlayerOptions);
    
    // Ensure Plyr controls are visible
    setTimeout(() => {
      const plyrControls = lightbox.querySelector('.plyr__control--overlaid');
      if (plyrControls) {
        logDebug('Setting up lightbox play button styles');
        
        // Apply visible class instead of direct styles for better animations
        plyrControls.classList.add('is-visible');
        plyrControls.classList.remove('is-hidden');
        
        // Ensure proper centering and circular shape
        plyrControls.style.top = '50%';
        plyrControls.style.left = '50%';
        plyrControls.style.transform = 'translate(-50%, -50%)';
        plyrControls.style.margin = '0';
        
        // Force fixed dimensions for consistent circular shape
        const buttonSize = window.innerWidth <= 480 ? '48px' : 
                           window.innerWidth <= 768 ? '56px' : '64px';
                           
        plyrControls.style.width = buttonSize;
        plyrControls.style.height = buttonSize;
        plyrControls.style.minWidth = buttonSize;
        plyrControls.style.minHeight = buttonSize;
        plyrControls.style.maxWidth = buttonSize;
        plyrControls.style.maxHeight = buttonSize;
        plyrControls.style.borderRadius = '50%';
        plyrControls.style.padding = '0';
        plyrControls.style.boxSizing = 'border-box';
        
        // Center the icon inside
        plyrControls.style.display = 'flex';
        plyrControls.style.alignItems = 'center';
        plyrControls.style.justifyContent = 'center';
        
        // Fix icon position if needed
        const iconSvg = plyrControls.querySelector('svg');
        if (iconSvg) {
          iconSvg.style.position = 'relative';
          iconSvg.style.width = '40%';
          iconSvg.style.height = '40%';
          iconSvg.style.margin = '0';
          iconSvg.style.marginLeft = '10%'; // Visually center the triangle
          iconSvg.style.top = '0';
          iconSvg.style.left = '0';
          iconSvg.style.transform = 'none';
        }
      } else {
        logDebug('WARNING: No Plyr controls found in lightbox');
      }
    }, 100);
    
    // Handle play/pause state to toggle the visibility of the centered play button
    lightboxPlayer.on('play', () => {
      const plyrControls = lightbox.querySelector('.plyr__control--overlaid');
      if (plyrControls) {
        // Use classes for better fade animation
        plyrControls.classList.remove('is-visible');
        plyrControls.classList.add('is-hidden');
      }
      // Add a class to track playing state
      lightbox.classList.add('is-playing');
    });
    
    lightboxPlayer.on('pause', () => {
      const plyrControls = lightbox.querySelector('.plyr__control--overlaid');
      if (plyrControls) {
        // Use classes for better fade animation
        plyrControls.classList.add('is-visible');
        plyrControls.classList.remove('is-hidden');
      }
      // Remove playing state class
      lightbox.classList.remove('is-playing');
    });
    
    // Also handle controls when video ends
    lightboxPlayer.on('ended', () => {
      const plyrControls = lightbox.querySelector('.plyr__control--overlaid');
      if (plyrControls) {
        // Use classes for better fade animation
        plyrControls.classList.add('is-visible');
        plyrControls.classList.remove('is-hidden');
      }
      // Remove playing state class
      lightbox.classList.remove('is-playing');
    });
    
    // Store lightbox reference
    lightboxes.set(container, {
      element: lightbox,
      player: lightboxPlayer
    });
    
    // Lock scrolling
    document.body.style.overflow = 'hidden';
    
    // Handle lightbox close
    closeButton.addEventListener('click', () => {
      closeVideoLightbox(container);
    });
    
    // Close on escape key
    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeVideoLightbox(container);
      }
    });
    
    // Close when clicking outside video
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeVideoLightbox(container);
      }
    });
    
    // First set display to flex
    lightbox.style.display = 'flex';
    
    // Force a reflow/repaint before adding the visible class
    void lightbox.offsetWidth;
    
    // Then add the visible class to trigger animation
    lightbox.classList.add('is-visible');
    
    // Set focus on lightbox for keyboard navigation
    setTimeout(() => {
      lightbox.focus();
    }, 300); // Wait for animation to complete
    
    // Reset to beginning of video but don't play
    lightboxPlayer.currentTime = 0;
  } else {
    // Show existing lightbox
    logDebug('Opening existing lightbox');
    const { element, player: lightboxPlayer } = lightboxes.get(container);
    
    // First set display to flex
    element.style.display = 'flex';
    
    // Force a reflow/repaint
    void element.offsetWidth;
    
    // Remove closing class if it exists
    element.classList.remove('is-closing');
    
    // Then add the visible class to trigger animation
    element.classList.add('is-visible');
    
    // Lock scrolling
    document.body.style.overflow = 'hidden';
    
    // Focus after animation completes
    setTimeout(() => {
      element.focus();
    }, 300);
    
    // Reset to beginning of video but don't play
    lightboxPlayer.currentTime = 0;
    lightboxPlayer.pause();
    
    // Ensure Plyr controls are visible initially
    setTimeout(() => {
      const plyrControls = element.querySelector('.plyr__control--overlaid');
      if (plyrControls) {
        logDebug('Updating existing lightbox play button styles');
        
        // Ensure proper centering and circular shape
        plyrControls.style.top = '50%';
        plyrControls.style.left = '50%';
        plyrControls.style.transform = 'translate(-50%, -50%)';
        plyrControls.style.margin = '0';
        
        // Force fixed dimensions for consistent circular shape
        const buttonSize = window.innerWidth <= 480 ? '48px' : 
                           window.innerWidth <= 768 ? '56px' : '64px';
                           
        plyrControls.style.width = buttonSize;
        plyrControls.style.height = buttonSize;
        plyrControls.style.minWidth = buttonSize;
        plyrControls.style.minHeight = buttonSize;
        plyrControls.style.maxWidth = buttonSize;
        plyrControls.style.maxHeight = buttonSize;
        plyrControls.style.borderRadius = '50%';
        plyrControls.style.padding = '0';
        plyrControls.style.boxSizing = 'border-box';
        
        // Center the icon inside
        plyrControls.style.display = 'flex';
        plyrControls.style.alignItems = 'center';
        plyrControls.style.justifyContent = 'center';
        
        // Fix icon position if needed
        const iconSvg = plyrControls.querySelector('svg');
        if (iconSvg) {
          iconSvg.style.position = 'relative';
          iconSvg.style.width = '40%';
          iconSvg.style.height = '40%';
          iconSvg.style.margin = '0';
          iconSvg.style.marginLeft = '10%'; // Visually center the triangle
          iconSvg.style.top = '0';
          iconSvg.style.left = '0';
          iconSvg.style.transform = 'none';
        }
        
        // Only show if not currently playing - use classes for better fade animation
        if (lightboxPlayer.paused) {
          plyrControls.classList.add('is-visible');
          plyrControls.classList.remove('is-hidden');
        } else {
          plyrControls.classList.remove('is-visible');
          plyrControls.classList.add('is-hidden');
        }
      } else {
        logDebug('WARNING: No Plyr controls found in existing lightbox');
      }
    }, 100);
  }
}

/**
 * Close video lightbox
 * @param {HTMLElement} container The video container
 */
function closeVideoLightbox(container) {
  logDebug(`Closing lightbox for ${container.id || 'unnamed container'}`);
  
  if (lightboxes.has(container)) {
    const { element, player } = lightboxes.get(container);
    
    // Pause lightbox video immediately
    player.pause();
    
    // Add closing class to trigger closing animation
    element.classList.remove('is-visible');
    element.classList.add('is-closing');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      // Hide lightbox
      element.style.display = 'none';
      
      // Remove closing class
      element.classList.remove('is-closing');
      
      // Unlock scrolling
      document.body.style.overflow = '';
      
      logDebug('Lightbox closed');
    }, 300); // Match the CSS transition duration
  }
}

/**
 * Reinitialize all video players - useful after dynamic content changes
 */
export function reinitializeVideoPlayers() {
  logDebug('Reinitializing all video players');
  
  // Destroy existing players to prevent duplicates
  players.forEach((player, container) => {
    try {
      player.destroy();
    } catch (e) {
      if (DEBUG_MODE) {
        console.error('Error destroying player:', e);
      }
    }
    
    // Remove initialization attribute to allow reinitializing
    container.removeAttribute('data-plyr-initialized');
  });
  
  // Clear players map
  players.clear();
  
  // Reinitialize
  setTimeout(() => {
    initializePlyrVideos();
  }, 100);
}

/**
 * Initialize the video player with Webflow CMS integration
 */
export function initVideoPlayer() {
  // Initialize videos immediately
  initializePlyrVideos();
  
  // Set up CMS integration for Webflow
  setupCMSIntegration();
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initVideoPlayer, { once: true });

// Initialize when Webflow page loads/changes - but only once per session
let webflowInitialized = false;
if (window.Webflow) {
  window.Webflow.push(() => {
    if (!webflowInitialized) {
      webflowInitialized = true;
      initVideoPlayer();
    }
  });
}

// Initialize on any Webflow interaction that might affect the page - but only once
let webflowReadyInitialized = false;
window.addEventListener('Webflow.ready', () => {
  if (!webflowReadyInitialized) {
    webflowReadyInitialized = true;
    initVideoPlayer();
  }
});

// Expose globally
window.initializePlyrVideos = initializePlyrVideos;
window.initVideoPlayer = initVideoPlayer;
window.reinitializeVideoPlayers = reinitializeVideoPlayers;

// Export for usage in other files
export default {
  initVideoPlayer,
  initializePlyrVideos,
  reinitializeVideoPlayers,
  logDebug
};
