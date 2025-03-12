/**
 * Video Lightbox Component
 * 
 * Handles the creation and management of the video lightbox functionality.
 * This includes opening/closing the lightbox, handling scroll locking, and
 * managing the lightbox player instance.
 */

import Plyr from 'plyr';
import { 
  createPosterPreventionObserver, 
  preloadVideoSource, 
  configureVideoSource, 
  ensureVideoVisibility 
} from './index';

// Use the shared observer for preventing poster/thumbnail elements
const preventLightboxPosterObserver = createPosterPreventionObserver();

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
  
  // Ensure no poster is displayed using our shared utility
  video.removeAttribute('poster');
  video.style.backgroundImage = 'none';
  video.style.background = 'transparent';
  
  // Add mobile controls toggle and menu for smaller screens
  const mobileControlsToggle = document.createElement('button');
  mobileControlsToggle.className = 'mobile-controls-toggle';
  mobileControlsToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>';
  
  const mobileControlsMenu = document.createElement('div');
  mobileControlsMenu.className = 'mobile-controls-menu';
  
  // Mobile menu toggle functionality
  mobileControlsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileControlsMenu.classList.toggle('active');
  });
  
  // Hide menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileControlsMenu.contains(e.target) && e.target !== mobileControlsToggle) {
      mobileControlsMenu.classList.remove('active');
    }
  });
  
  // Append elements
  videoWrapper.appendChild(video);
  lightboxContainer.appendChild(videoWrapper);
  lightboxContainer.appendChild(mobileControlsToggle);
  lightboxContainer.appendChild(mobileControlsMenu);
  
  // Hide initially
  lightboxContainer.style.display = 'none';
  
  // Add to body
  document.body.appendChild(lightboxContainer);
  
  return { container: lightboxContainer, video, mobileControlsMenu };
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
  const { container: lightboxContainer, video, mobileControlsMenu } = createLightboxContainer();
  
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
      'pip',
      'airplay',
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
    seekTime: 5, // 5 second increments for keyboard seeking
    // Make tooltips show up quickly with minimal delay
    tooltipTime: {
      seek: 20 // Show seek tooltip after just 20ms
    }
  });
  
  // Add mobile controls for smaller screens
  const setupMobileControls = () => {
    if (lightboxPlayer && lightboxPlayer.elements) {
      if (!mobileControlsMenu) return;
      
      // Clear any existing controls
      mobileControlsMenu.innerHTML = '';
      
      // Add mobile-friendly controls to the menu
      const controlsToClone = [
        { type: 'button', name: 'pip', label: 'Picture in Picture' },
        { type: 'button', name: 'airplay', label: 'AirPlay' },
        { type: 'button', name: 'settings', label: 'Settings' }
      ];
      
      // Add a fast forward and rewind option for easier mobile seeking
      const seekForward = document.createElement('button');
      seekForward.className = 'mobile-seek-button';
      seekForward.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>';
      seekForward.innerHTML += '<span style="margin-left: 10px;">Forward 10s</span>';
      seekForward.style.margin = '5px 0';
      seekForward.style.width = '100%';
      seekForward.style.justifyContent = 'flex-start';
      seekForward.style.padding = '8px 10px';
      seekForward.style.background = 'transparent';
      seekForward.style.border = 'none';
      seekForward.style.color = 'white';
      seekForward.style.cursor = 'pointer';
      seekForward.style.display = 'flex';
      seekForward.style.alignItems = 'center';
      
      seekForward.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lightboxPlayer) {
          lightboxPlayer.forward(10); // 10 second skip
        }
        mobileControlsMenu.classList.remove('active');
      });
      
      const seekBackward = document.createElement('button');
      seekBackward.className = 'mobile-seek-button';
      seekBackward.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>';
      seekBackward.innerHTML += '<span style="margin-left: 10px;">Rewind 10s</span>';
      seekBackward.style.margin = '5px 0';
      seekBackward.style.width = '100%';
      seekBackward.style.justifyContent = 'flex-start';
      seekBackward.style.padding = '8px 10px';
      seekBackward.style.background = 'transparent';
      seekBackward.style.border = 'none';
      seekBackward.style.color = 'white';
      seekBackward.style.cursor = 'pointer';
      seekBackward.style.display = 'flex';
      seekBackward.style.alignItems = 'center';
      
      seekBackward.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lightboxPlayer) {
          lightboxPlayer.rewind(10); // 10 second rewind
        }
        mobileControlsMenu.classList.remove('active');
      });
      
      // Add seek buttons at the top
      mobileControlsMenu.appendChild(seekBackward);
      mobileControlsMenu.appendChild(seekForward);
      
      // Then add the regular controls
      controlsToClone.forEach(ctrl => {
        if (ctrl.type === 'button') {
          const originalControl = lightboxPlayer.elements.buttons[ctrl.name]?.[0];
          if (originalControl) {
            const controlClone = originalControl.cloneNode(true);
            controlClone.style.margin = '5px 0';
            controlClone.style.width = '100%';
            controlClone.style.justifyContent = 'flex-start';
            controlClone.style.padding = '8px 10px';
            
            // Add text label
            const labelSpan = document.createElement('span');
            labelSpan.textContent = ctrl.label;
            labelSpan.style.marginLeft = '10px';
            controlClone.appendChild(labelSpan);
            
            // Update settings click handler
            if (ctrl.name === 'settings') {
              controlClone.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Find the settings menu container
                const settingsMenu = document.querySelector('.plyr__menu__container');
                if (settingsMenu) {
                  settingsMenu.classList.add('plyr__menu__container--open');
                  settingsMenu.style.display = 'block';
                  settingsMenu.style.visibility = 'visible';
                  settingsMenu.style.opacity = '1';
                  settingsMenu.style.zIndex = '30000';
                  
                  // Position correctly for mobile
                  const rect = controlClone.getBoundingClientRect();
                  settingsMenu.style.bottom = (window.innerHeight - rect.top + 5) + 'px';
                  settingsMenu.style.right = (window.innerWidth - rect.right + rect.width/2) + 'px';
                }
                
                // Hide the mobile menu
                mobileControlsMenu.classList.remove('active');
              });
            } else {
              // For other controls, just clone their click behavior
              controlClone.addEventListener('click', (e) => {
                e.stopPropagation();
                originalControl.click();
                mobileControlsMenu.classList.remove('active');
              });
            }
            
            mobileControlsMenu.appendChild(controlClone);
          }
        }
      });
    }
  };
  
  // Set up mobile controls when ready
  lightboxPlayer.on('ready', setupMobileControls);
  
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
          
          // Toggle muted state directly
          console.log('Mute button clicked, current muted state:', lightboxPlayer.muted);
          
          // Force toggle the mute state and update UI
          if (lightboxPlayer.muted) {
            // Unmute
            lightboxPlayer.muted = false;
            lightboxPlayer.volume = lightboxPlayer.volume > 0 ? lightboxPlayer.volume : 0.5;
            console.log('Unmuting to volume:', lightboxPlayer.volume);
            newMuteButton.setAttribute('aria-label', 'Mute');
            newMuteButton.setAttribute('title', 'Mute');
          } else {
            // Mute
            lightboxPlayer.muted = true;
            newMuteButton.setAttribute('aria-label', 'Unmute');
            newMuteButton.setAttribute('title', 'Unmute');
            console.log('Muting video');
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
          
          console.log('After toggle, muted state:', lightboxPlayer.muted);
        }, true);
      }
    }
  };
  
  // Fix the mute button immediately and also when state changes
  fixMuteButton();
  lightboxPlayer.on('ready', fixMuteButton);
  lightboxPlayer.on('loadeddata', fixMuteButton);
  
  // Fix volume control to properly interact with mute state
  if (lightboxPlayer.elements && lightboxPlayer.elements.inputs && lightboxPlayer.elements.inputs.volume) {
    const volumeControl = lightboxPlayer.elements.inputs.volume;
    // Clone and replace to remove existing handlers
    const newVolumeControl = volumeControl.cloneNode(true);
    volumeControl.parentNode.replaceChild(newVolumeControl, volumeControl);
    
    // Add custom handler for volume changes
    newVolumeControl.addEventListener('input', () => {
      const newVolume = parseFloat(newVolumeControl.value);
      console.log('Volume control changed to:', newVolume);
      
      // Set volume directly
      lightboxPlayer.volume = newVolume;
      
      // If volume is set above 0, unmute if currently muted
      if (newVolume > 0 && lightboxPlayer.muted) {
        lightboxPlayer.muted = false;
        console.log('Unmuting because volume was raised above 0');
        
        // Update mute button state if it exists
        if (lightboxPlayer.elements.buttons && lightboxPlayer.elements.buttons.mute) {
          const muteButton = lightboxPlayer.elements.buttons.mute[0];
          if (muteButton) {
            muteButton.setAttribute('aria-label', 'Mute');
            muteButton.setAttribute('title', 'Mute');
            muteButton.classList.remove('plyr__control--pressed');
          }
        }
      }
    });
  }
  
  // Listen for mute and volume changes
  lightboxPlayer.on('muted', event => {
    console.log('Mute event:', lightboxPlayer.muted);
  });
  
  lightboxPlayer.on('volumechange', event => {
    console.log('Volume changed:', lightboxPlayer.volume, 'Muted:', lightboxPlayer.muted);
  });
  
  // Add additional event listeners to ensure settings menu works
  lightboxPlayer.on('controlshidden', () => {
    // Prevent controls from being hidden
    if (lightboxPlayer.elements && lightboxPlayer.elements.controls) {
      lightboxPlayer.elements.controls.style.display = 'flex';
      lightboxPlayer.elements.controls.style.opacity = '1';
    }
  });
  
  // Fix settings menu popup
  if (lightboxPlayer.elements && lightboxPlayer.elements.settings) {
    const settingsButton = lightboxPlayer.elements.controls?.querySelector('.plyr__control[data-plyr="settings"]');
    if (settingsButton) {
      // Remove any existing click handlers first
      const newSettingsButton = settingsButton.cloneNode(true);
      settingsButton.parentNode.replaceChild(newSettingsButton, settingsButton);
      
      // Add our toggle implementation
      newSettingsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Find the menu container
        const settingsMenu = document.querySelector('.plyr__menu__container');
        if (settingsMenu) {
          // Toggle the menu
          if (settingsMenu.classList.contains('plyr__menu__container--open')) {
            // Close the menu
            settingsMenu.classList.remove('plyr__menu__container--open');
            settingsMenu.style.display = 'none';
          } else {
            // Open the menu
            settingsMenu.classList.add('plyr__menu__container--open');
            settingsMenu.style.display = 'block';
            settingsMenu.style.visibility = 'visible';
            settingsMenu.style.opacity = '1';
            settingsMenu.style.zIndex = '30000';
            
            // Position correctly
            const rect = newSettingsButton.getBoundingClientRect();
            settingsMenu.style.bottom = (window.innerHeight - rect.top + 5) + 'px';
            settingsMenu.style.right = (window.innerWidth - rect.right + rect.width/2) + 'px';
          }
        }
      }, true); // Use capturing
    }
  }
  
  // Instead, loop back to the start or show replay button
  lightboxPlayer.on('ended', () => {
    // Show replay controls but don't close
    console.log('Video ended in lightbox, showing replay controls');
  });
  
  // Fix the progress bar interactivity issues
  const enhanceProgressBar = () => {
    if (lightboxPlayer && lightboxPlayer.elements) {
      const progressContainer = lightboxPlayer.elements.controls?.querySelector('.plyr__progress__container');
      const progress = lightboxPlayer.elements.progress;
      
      if (progressContainer && progress) {
        // Create a larger hitbox overlay for better click/touch target
        const enhanceTargetArea = () => {
          // First, ensure we don't create duplicates
          const existingOverlay = progressContainer.querySelector('.progress-enhancer');
          if (existingOverlay) return;
          
          // Create a transparent overlay with a larger touch area
          const overlay = document.createElement('div');
          overlay.className = 'progress-enhancer';
          overlay.style.position = 'absolute';
          overlay.style.top = '-10px';
          overlay.style.bottom = '-10px';
          overlay.style.left = '0';
          overlay.style.right = '0';
          overlay.style.zIndex = '1'; // Below the actual slider
          overlay.style.cursor = 'pointer';
          
          // Add touch event redirection to ensure mobile taps work
          overlay.addEventListener('touchstart', (e) => {
            // Convert touch to a click at the right position
            const rect = progress.getBoundingClientRect();
            const offsetX = e.touches[0].clientX - rect.left;
            const position = offsetX / rect.width;
            
            // Apply the seek
            if (lightboxPlayer && !lightboxPlayer.seeking) {
              lightboxPlayer.currentTime = position * lightboxPlayer.duration;
            }
            
            // Prevent touch from passing through to other elements
            e.preventDefault();
            e.stopPropagation();
          }, { passive: false });
          
          // Add mouse event click redirection
          overlay.addEventListener('mousedown', (e) => {
            // Don't handle if already seeking to prevent duplicate events
            if (lightboxPlayer.seeking) return;
            
            // Get click position
            const rect = progress.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const position = offsetX / rect.width;
            
            // Apply the seek
            lightboxPlayer.currentTime = position * lightboxPlayer.duration;
            
            // Prevent event bubbling
            e.stopPropagation();
          });
          
          // Insert before the progress element for proper layering
          progressContainer.insertBefore(overlay, progressContainer.firstChild);
        };
        
        // Apply the enhancement
        enhanceTargetArea();
        
        // Also ensure the slider input itself has proper event handling
        if (progress instanceof HTMLInputElement) {
          // Remove and reattach to clean any conflicting handlers
          const newProgress = progress.cloneNode(true);
          progress.parentNode.replaceChild(newProgress, progress);
          
          // Add our own reliable input handler
          newProgress.addEventListener('input', () => {
            const position = parseFloat(newProgress.value);
            lightboxPlayer.currentTime = position * lightboxPlayer.duration;
          });
        }
      }
    }
  };
  
  // Apply progress bar enhancements when player is ready
  lightboxPlayer.on('ready', enhanceProgressBar);
  lightboxPlayer.on('controlsready', enhanceProgressBar);
  
  return { backdrop, closeButton };
}

/**
 * Open a video in lightbox mode
 * @param {HTMLElement} container The video container element
 * @param {Plyr} originalPlayer The original Plyr instance
 */
function openLightbox(container, originalPlayer) {
  // Start observing to prevent poster elements
  preventLightboxPosterObserver.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['poster', 'style'] 
  });

  // Get video source from the original player
  const originalVideo = container.querySelector('video');
  if (!originalVideo) return;
  
  const videoSrc = originalVideo.querySelector('source')?.src || originalVideo.src;
  if (!videoSrc) return;
  
  // Preload the video to avoid thumbnail generation
  preloadVideoSource(videoSrc);
  
  // Initialize the lightbox if needed
  const { backdrop, closeButton } = initLightboxPlayer();
  
  // Get the lightbox container
  const lightboxContainer = document.querySelector('.video-lightbox-container');
  if (!lightboxContainer) return;
  
  // Get the mobile controls menu
  const mobileControlsMenu = lightboxContainer.querySelector('.mobile-controls-menu');
  if (mobileControlsMenu) {
    mobileControlsMenu.classList.remove('active');
  }
  
  // Remove any poster attribute to prevent thumbnail
  if (lightboxPlayer && lightboxPlayer.elements && lightboxPlayer.elements.original) {
    lightboxPlayer.elements.original.removeAttribute('poster');
  }
  
  // Always start from the beginning (0) instead of using the original player's current time
  const currentTime = 0;
  
  // Set the source and poster for the lightbox video
  const lightboxVideo = lightboxContainer.querySelector('video');
  if (!lightboxVideo) return;

  // Configure the video source using our shared utility function
  configureVideoSource(lightboxVideo, videoSrc);
  
  // Ensure video is fully visible
  ensureVideoVisibility(lightboxVideo);
  
  // Try to play the video immediately before showing the lightbox
  try {
    // Always set the time to 0 to start from the beginning
    lightboxVideo.currentTime = 0;
    lightboxVideo.muted = false; // Start unmuted
    lightboxVideo.volume = 1; // Set volume to 100%
  } catch (e) {
    console.log('Error with lightbox pre-init:', e);
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
    // Remove any poster element if it exists
    if (lightboxPlayer.elements && lightboxPlayer.elements.poster) {
      lightboxPlayer.elements.poster.remove();
    }
    
    lightboxPlayer.source = {
      type: 'video',
      sources: [
        {
          src: videoSrc,
          type: videoSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4'
        }
      ]
    };
    
    // Immediately ensure controls are visible
    if (lightboxPlayer.elements) {
      // Force display of controls
      if (lightboxPlayer.elements.controls) {
        lightboxPlayer.elements.controls.style.display = 'flex';
        lightboxPlayer.elements.controls.style.visibility = 'visible';
        lightboxPlayer.elements.controls.style.opacity = '1';
        lightboxPlayer.elements.controls.style.pointerEvents = 'auto';
      }
      
      // Make sure individual controls are visible
      const controlsToShow = [
        'progress', 'play', 'mute', 'volume', 'fullscreen', 
        'current-time', 'duration', 'settings'
      ];
      
      controlsToShow.forEach(controlName => {
        const control = lightboxPlayer.elements.controls?.querySelector(`.plyr__control[data-plyr="${controlName}"], .plyr__${controlName}`);
        if (control) {
          control.style.display = 'flex';
          control.style.visibility = 'visible';
          control.style.opacity = '1';
        }
      });
      
      // Specifically reapply our mute button fix in case it was lost
      if (lightboxPlayer.elements.buttons && lightboxPlayer.elements.buttons.mute) {
        const muteButton = lightboxPlayer.elements.buttons.mute[0];
        if (muteButton) {
          // Replace the mute button with a fresh one
          const newMuteButton = muteButton.cloneNode(true);
          muteButton.parentNode.replaceChild(newMuteButton, muteButton);
          
          // Add new handler
          newMuteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Directly toggle the mute state
            if (lightboxPlayer.muted) {
              lightboxPlayer.muted = false;
              lightboxPlayer.volume = Math.max(0.5, lightboxPlayer.volume);
              console.log('Lightbox player unmuted via button');
            } else {
              lightboxPlayer.muted = true;
              console.log('Lightbox player muted via button');
            }
            
            // Force update UI as well
            setTimeout(() => {
              if (lightboxPlayer.muted) {
                newMuteButton.setAttribute('aria-label', 'Unmute');
                newMuteButton.classList.add('plyr__control--pressed');
              } else {
                newMuteButton.setAttribute('aria-label', 'Mute');
                newMuteButton.classList.remove('plyr__control--pressed');
              }
            }, 10);
          });
        }
      }
      
      // Specifically fix settings button behavior
      const settingsButton = lightboxPlayer.elements.controls?.querySelector('.plyr__control[data-plyr="settings"]');
      if (settingsButton) {
        // Remove any existing click handlers first
        const newSettingsButton = settingsButton.cloneNode(true);
        settingsButton.parentNode.replaceChild(newSettingsButton, settingsButton);
        
        // Add our toggle implementation
        newSettingsButton.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          // Find the menu container
          const settingsMenu = document.querySelector('.plyr__menu__container');
          if (settingsMenu) {
            // Toggle the menu
            if (settingsMenu.classList.contains('plyr__menu__container--open')) {
              // Close the menu
              settingsMenu.classList.remove('plyr__menu__container--open');
              settingsMenu.style.display = 'none';
            } else {
              // Open the menu
              settingsMenu.classList.add('plyr__menu__container--open');
              settingsMenu.style.display = 'block';
              settingsMenu.style.visibility = 'visible';
              settingsMenu.style.opacity = '1';
              settingsMenu.style.zIndex = '30000';
              
              // Position correctly
              const rect = newSettingsButton.getBoundingClientRect();
              settingsMenu.style.bottom = (window.innerHeight - rect.top + 5) + 'px';
              settingsMenu.style.right = (window.innerWidth - rect.right + rect.width/2) + 'px';
            }
          }
        }, true); // Use capturing
      }
    }
    
    // Play with a slight delay to allow animation, 
    // and start from the beginning of the video
    setTimeout(() => {
      // Always set to time 0 to start from the beginning
      lightboxPlayer.currentTime = 0;
      
      // Start unmuted with 100% volume
      lightboxPlayer.muted = false;
      lightboxPlayer.volume = 1;
      
      // Ensure controls are visible and enabled in lightbox
      if (lightboxPlayer.elements && lightboxPlayer.elements.controls) {
        lightboxPlayer.elements.controls.style.display = 'flex';
        lightboxPlayer.elements.controls.style.opacity = '1';
        lightboxPlayer.elements.controls.style.visibility = 'visible';
        lightboxPlayer.elements.controls.style.pointerEvents = 'auto';
      }
      
      // Make sure the big play button is visible
      if (lightboxPlayer.elements.buttons && lightboxPlayer.elements.buttons.play) {
        Array.from(lightboxPlayer.elements.buttons.play).forEach(btn => {
          btn.style.display = 'flex';
          btn.style.opacity = '1';
          btn.style.visibility = 'visible';
        });
      }

      // Ensure the large play button is visible
      const largePlayButton = lightboxPlayer.elements.buttons?.['play-large']?.[0];
      if (largePlayButton) {
        largePlayButton.style.display = 'flex';
        largePlayButton.style.opacity = '1';
        largePlayButton.style.visibility = 'visible';
        largePlayButton.style.zIndex = '10';
      }
      
      // Ensure the video element itself is visible
      if (lightboxPlayer.elements.original) {
        ensureVideoVisibility(lightboxPlayer.elements.original);
      }
      
      // Ensure mute button functionality works
      const muteButton = lightboxPlayer.elements.buttons?.mute?.[0];
      if (muteButton) {
        // Force the mute button to be updated correctly
        setTimeout(() => {
          if (lightboxPlayer.muted) {
            muteButton.setAttribute('aria-label', 'Unmute');
            muteButton.setAttribute('title', 'Unmute');
          } else {
            muteButton.setAttribute('aria-label', 'Mute');
            muteButton.setAttribute('title', 'Mute');
          }
        }, 450);
      }
    }, 400); // Match animation duration
  }
  
  // Listen for ESC key
  document.addEventListener('keydown', handleEscKey);

  // After playback is attempted, clean up
  setTimeout(() => {
    // Check one more time for any poster elements and remove them
    const anyPosters = document.querySelectorAll('.video-lightbox-container .plyr__poster, .lightbox-video[poster]');
    anyPosters.forEach(poster => {
      console.log('Cleanup: removing lightbox poster element');
      if (poster.hasAttribute && poster.hasAttribute('poster')) {
        poster.removeAttribute('poster');
      } else if (poster.remove) {
        poster.remove();
      }
    });
  }, 500);

  // Add click-to-play functionality to the video container
  const videoInner = lightboxContainer.querySelector('.video-inner');
  if (videoInner) {
    videoInner.addEventListener('click', (e) => {
      // Only handle clicks directly on the container, not on controls
      if (e.target === videoInner || e.target === lightboxVideo) {
        // Toggle play/pause
        if (lightboxPlayer.playing) {
          lightboxPlayer.pause();
        } else {
          lightboxPlayer.play();
        }
      }
    });
  }
  
  // Listen for play and pause events to update UI appropriately
  lightboxPlayer.on('play', () => {
    // Video is now playing
  });
  
  lightboxPlayer.on('pause', () => {
    // Video is now paused
  });
}

/**
 * Close lightbox and return to preview mode
 */
function closeLightbox() {
  // Stop observing for poster elements when closing
  preventLightboxPosterObserver.disconnect();
  
  const lightboxContainer = document.querySelector('.video-lightbox-container');
  const backdrop = document.querySelector('.video-lightbox-backdrop');
  const closeButton = document.querySelector('.lightbox-close');
  const mobileControlsMenu = document.querySelector('.mobile-controls-menu');
  
  if (!lightboxContainer) return;
  
  // Prevent multiple close operations
  if (lightboxContainer.classList.contains('lightbox-closing')) return;
  
  // Store the current dimensions and position for a smooth transition
  const rect = lightboxContainer.getBoundingClientRect();
  const startWidth = rect.width;
  const startHeight = rect.height;
  
  // Pause the lightbox video only
  if (lightboxPlayer) {
    lightboxPlayer.pause();
    
    // Disable Plyr's own transitions during our animation to prevent conflicts
    if (lightboxPlayer.elements) {
      if (lightboxPlayer.elements.container) {
        lightboxPlayer.elements.container.style.transition = 'none';
        lightboxPlayer.elements.container.style.transform = 'none';
      }
      
      // Also disable transitions on the wrapper and other Plyr elements
      if (lightboxPlayer.elements.wrapper) {
        lightboxPlayer.elements.wrapper.style.transition = 'none';
        lightboxPlayer.elements.wrapper.style.transform = 'none';
      }
    }
  }
  
  // Hide any open menus
  if (mobileControlsMenu) {
    mobileControlsMenu.classList.remove('active');
  }
  
  // Hide any settings menu that might be open
  const settingsMenu = document.querySelector('.plyr__menu__container');
  if (settingsMenu) {
    settingsMenu.classList.remove('plyr__menu__container--open');
    settingsMenu.style.display = 'none';
  }
  
  // Disable all transitions on the lightbox contents
  const allLightboxElements = lightboxContainer.querySelectorAll('*');
  allLightboxElements.forEach(element => {
    element.style.transition = 'none';
    element.style.animation = 'none';
    element.style.transform = 'none';
  });
  
  // Get lightbox video element to ensure it doesn't interfere with animation
  const lightboxVideo = lightboxContainer.querySelector('video');
  if (lightboxVideo) {
    lightboxVideo.style.transition = 'none';
    lightboxVideo.style.transform = 'none';
  }
  
  // Force a reflow before starting animation to ensure clean transition state
  void lightboxContainer.offsetWidth;
  
  // Set the starting transform directly - ensure we start from the current size (scale 1)
  lightboxContainer.style.transform = 'translate(-50%, -50%) scale(1)';
  lightboxContainer.style.transformOrigin = 'center center';
  lightboxContainer.style.opacity = '1';
  
  // Force another reflow to ensure our style changes take effect
  void lightboxContainer.offsetWidth;
  
  // Add the closing class to handle some styling
  lightboxContainer.classList.add('lightbox-closing');
  
  // Animate the closing
  if (backdrop) {
    backdrop.classList.add('closing');
  }
  
  closeButton.classList.remove('active');
  
  // Remove the lightbox-mode class to ensure proper transition
  lightboxContainer.classList.remove('lightbox-mode');
  
  // Directly animate with JavaScript for more precise control
  requestAnimationFrame(() => {
    // Set transition now that we've established the starting point
    lightboxContainer.style.transition = `transform ${400}ms ease, opacity ${400}ms ease`;
    
    // Set the ending transform - shrink to 90%
    lightboxContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
    lightboxContainer.style.opacity = '0';
  });
  
  // Wait for animation to complete before removing display
  setTimeout(() => {
    // Clean up styles
    lightboxContainer.style.transition = '';
    lightboxContainer.style.transform = '';
    
    lightboxContainer.style.display = 'none';
    lightboxContainer.classList.remove('lightbox-closing');
    
    // Reset backdrop only after animation completes
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.classList.remove('closing');
    }
    
    // Unlock scroll position and restore it
    unlockScroll();
  }, 400); // Match animation duration
  
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