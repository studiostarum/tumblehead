/**
 * Video Player Component
 * 
 * Main entry point for the video player functionality.
 * This file exports the primary functions for initializing and controlling
 * the video player component.
 */

import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { createIcons, Play, X } from 'lucide';
import { initLightbox } from './lightbox';
import { findVideoContainer } from '../../utils/dom';
import './styles.css'; // Import video player component styles

// =====================================================
// Shared Utilities (used by both index.js and lightbox.js)
// =====================================================

/**
 * Create a mutation observer to prevent poster/thumbnail elements
 * @returns {MutationObserver} Configured mutation observer
 */
export function createPosterPreventionObserver() {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          // If the added node is a poster or thumbnail element, remove it immediately
          if (node.classList && 
              (node.classList.contains('plyr__poster') || 
               node.getAttribute('data-poster') || 
               node.hasAttribute('poster'))) {
            console.log('Removing poster element');
            node.remove();
          }
          
          // For other nodes that might contain poster elements
          if (node.querySelectorAll) {
            const posters = node.querySelectorAll('.plyr__poster');
            posters.forEach(poster => {
              console.log('Removing nested poster element');
              poster.remove();
            });
          }
        }
      }
      
      // Also check for attribute changes that might set a poster
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'poster' && 
          mutation.target.hasAttribute('poster')) {
        console.log('Removing poster attribute');
        mutation.target.removeAttribute('poster');
      }
    });
  });
}

/**
 * Preload a video source to improve loading performance
 * @param {string} videoSrc URL of the video to preload
 */
export function preloadVideoSource(videoSrc) {
  if (!videoSrc) return;
  
  // Create a prefetch request to warm up the browser cache
  const prefetch = document.createElement('link');
  prefetch.rel = 'prefetch';
  prefetch.href = videoSrc;
  document.head.appendChild(prefetch);
  
  // Also try preload
  const preload = document.createElement('link');
  preload.rel = 'preload';
  preload.as = 'video';
  preload.href = videoSrc;
  document.head.appendChild(preload);
}

/**
 * Configure a video source element
 * @param {HTMLVideoElement} video The video element to configure
 * @param {string} videoSrc The source URL for the video
 */
export function configureVideoSource(video, videoSrc) {
  if (!video || !videoSrc) return;
  
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
    
    // Also set src directly as a fallback
    video.src = videoSrc;
  } else {
    // If source exists but needs updating
    const source = video.querySelector('source');
    if (source.src !== videoSrc) {
      source.src = videoSrc;
      video.src = videoSrc; // Also update video.src directly
    }
  }
  
  // Force video to load
  video.load();
  
  // Always remove poster to ensure no thumbnail shows
  video.removeAttribute('poster');
  video.style.backgroundImage = 'none';
  video.style.background = 'transparent';
}

/**
 * Ensure video element is properly visible
 * @param {HTMLVideoElement} video The video element
 */
export function ensureVideoVisibility(video) {
  if (!video) return;
  
  // Make sure the video is fully visible
  video.style.opacity = '1';
  video.style.visibility = 'visible';
  video.style.display = 'block';
  
  // Set critical properties that might be causing the black screen
  video.style.backgroundColor = 'transparent';
  
  // Force the video to be in the active DOM layer
  video.style.position = 'relative';
  video.style.zIndex = '5';
  
  // Safari and some browsers need this hint
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
}

// Use the shared observer
const preventPosterObserver = createPosterPreventionObserver();

// Track initialized players to prevent duplicates
const initializedVideos = new Set();
const players = [];

/**
 * Initialize a video element with Plyr
 * @param {HTMLVideoElement} video Video element to initialize
 * @returns {Plyr} Initialized Plyr instance
 */
function initializeVideoPlayer(video) {
  if (initializedVideos.has(video)) {
    return players.find(p => p.elements.original === video);
  }
  
  // Always remove the poster attribute completely to ensure no thumbnail shows
  video.removeAttribute('poster');
  
  // Try to play the video immediately, before Plyr initializes
  try {
    video.play().catch(e => console.log('Pre-init autoplay failed:', e));
  } catch (e) {
    console.log('Error with pre-init play:', e);
  }
  
  // Watch for poster elements being added and remove them immediately
  preventPosterObserver.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['poster', 'style']
  });
  
  // Initialize Plyr
  const plyrOptions = {
    controls: [
      // 'play-large',
      'play',
      'progress',
      'current-time',
      'mute',
      'volume',
      'fullscreen',
    ],
    resetOnEnd: true,
    clickToPlay: true,
    muted: true, // Always mute to ensure autoplay works
    autoplay: true, // Always try to autoplay
    disablePictureInPicture: true, // Disable PiP to avoid thumbnails
    loadSprite: false, // Prevent sprite loading that might cause flicker
    // Don't set loop in options, we'll set it after initialization
  };
  
  // Add preload attribute for video
  video.preload = 'auto';
  
  // Force browser to begin loading the video right away
  if (video.src) {
    preloadVideoSource(video.src);
  }
  
  // Create Plyr instance
  const player = new Plyr(video, plyrOptions);
  
  // After Plyr creation, ensure no poster is shown
  if (player.elements && player.elements.poster) {
    // Completely remove the poster element instead of just hiding it
    player.elements.poster.remove();
  }
  
  // Set initialized status
  video.setAttribute('data-plyr-initialized', 'true');
  initializedVideos.add(video);
  players.push(player);
  
  return player;
}

/**
 * Debug function to inspect video element status
 * @param {HTMLVideoElement} video The video element to inspect
 * @param {Plyr} player The Plyr instance
 */
function debugVideoStatus(video, player) {
  if (!video || !player) return;
  
  console.group('Video Player Debug Info');
  console.log('Video element:', video);
  console.log('Video src:', video.src);
  console.log('Video currentSrc:', video.currentSrc);
  console.log('Source elements:', video.querySelectorAll('source'));
  console.log('Video readyState:', video.readyState);
  console.log('Video paused state:', video.paused);
  console.log('Video error:', video.error);
  console.log('Video networkState:', video.networkState);
  console.log('Plyr playing state:', player.playing);
  console.log('Plyr error:', player.error);
  console.groupEnd();
}

/**
 * Initialize all videos with data-plyr="true" attribute
 */
export function initializePlyrVideos() {
  // Select all videos with data-plyr="true" that haven't been initialized yet
  const videos = document.querySelectorAll('video[data-plyr="true"]:not([data-plyr-initialized])');
  
  console.log('Found videos to initialize:', videos.length);
  
  videos.forEach(video => {
    // Handle data-src attribute
    if (video.getAttribute('data-src') && !video.src) {
      const videoSrc = video.getAttribute('data-src');
      
      // Only set src if it's a valid URL
      if (videoSrc && (videoSrc.startsWith('http') || videoSrc.startsWith('//') || videoSrc.startsWith('/'))) {
        console.log('Setting video source:', videoSrc);
        
        // Set important attributes for better loading
        video.preload = 'auto';
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        
        // Configure the video source using our utility function
        configureVideoSource(video, videoSrc);
      }
    }
    
    const player = initializeVideoPlayer(video);
    
    // Find container and add preview mode
    const videoContainer = findVideoContainer(video);
    if (videoContainer) {
      // Fix for common black screen issue
      video.addEventListener('loadedmetadata', () => {
        // Ensure video is visible using our utility function
        ensureVideoVisibility(video);
        console.log('Video metadata loaded, fixing visibility');
      });
      
      // Setup preview and lightbox integration
      setupPreviewMode(videoContainer, player);
      
      // Debug video status after initialization
      debugVideoStatus(video, player);
      
      // Add error handling for video
      video.addEventListener('error', (e) => {
        console.error('Video error occurred:', e, video.error);
        
        // Show error state in the UI
        videoContainer.classList.add('video-error');
        videoContainer.classList.remove('video-playing');
        
        // Make play button visible
        const playButton = videoContainer.querySelector('.preview-play-button');
        if (playButton) {
          playButton.style.opacity = '1';
        }
      });
    }
  });
}

/**
 * Set up preview mode for a video container
 * @param {HTMLElement} container The video container element
 * @param {Plyr} player The Plyr instance
 */
function setupPreviewMode(container, player) {
  // Initial state: preview mode
  container.classList.add('preview-mode');
  // Immediately mark as playing to ensure visibility
  container.classList.add('video-playing');
  
  // Try to play the video directly first, before any setup
  if (player.media) {
    try {
      player.media.muted = true; // Ensure it's muted for autoplay
      player.media.play().catch(e => console.log('Preview setup direct play failed:', e));
    } catch (e) {
      console.log('Error with preview setup direct play:', e);
    }
  }
  
  // Force disable poster for preview videos
  if (player.elements && player.elements.original) {
    // Remove poster attribute entirely
    player.elements.original.removeAttribute('poster');
    
    // If Plyr has created a poster element, completely hide it
    if (player.elements.poster) {
      player.elements.poster.style.display = 'none';
      player.elements.poster.style.opacity = '0';
      player.elements.poster.style.visibility = 'hidden';
    }
  }
  
  // Enable looping for preview videos
  // Set loop attribute on the video element directly
  if (player.elements && player.elements.original) {
    player.elements.original.setAttribute('loop', '');
    // Use a safer way to set loop on Plyr
    try {
      // Some versions of Plyr need this workaround
      if (typeof player.config === 'object' && player.config !== null) {
        player.config.loop = { active: true };
      }
    } catch (e) {
      console.log('Could not set player loop config:', e);
    }
  }
  
  // Apply poster image for fallback if available
  if (player.elements && player.elements.original && player.elements.original.getAttribute('data-poster')) {
    const posterUrl = player.elements.original.getAttribute('data-poster');
    
    // Check if the poster URL is valid (not a video file)
    const isValidPoster = posterUrl && 
      !posterUrl.endsWith('.mp4') && 
      !posterUrl.endsWith('.webm') && 
      !posterUrl.endsWith('.mov') && 
      posterUrl !== player.elements.original.getAttribute('data-src');
      
    if (isValidPoster) {
      player.elements.original.poster = posterUrl;
      
      // If using Plyr, make sure the poster is displayed
      if (player.elements.poster) {
        player.elements.poster.style.backgroundImage = `url(${posterUrl})`;
      }
    } else {
      // Clear invalid poster URL to let video display properly
      player.elements.original.removeAttribute('poster');
      player.elements.original.removeAttribute('data-poster');
      
      // If Plyr has a poster element, clear it
      if (player.elements.poster) {
        player.elements.poster.style.backgroundImage = '';
      }
    }
  }
  
  // Add play button if not already there
  if (!container.getAttribute('data-has-preview-button')) {
    const playButton = addPreviewPlayButton(container);
    
    // Click to open lightbox
    playButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      initLightbox.openLightbox(container, player);
    });
    
    // Container click also opens lightbox
    container.addEventListener('click', (e) => {
      if (container.classList.contains('preview-mode')) {
        e.preventDefault();
        initLightbox.openLightbox(container, player);
      }
    });
  }
  
  // Function to play the preview video
  const playPreview = () => {
    // First ensure the player and media exist
    if (!player || !player.media) {
      console.log('Player or media not available');
      return;
    }
    
    // Reset any attributes that might prevent playback
    player.muted = true;
    player.volume = 0;
    player.speed = 1;
    player.currentTime = 0;
    
    // Force plyr controls to be hidden
    if (player.elements.controls) {
      player.elements.controls.style.display = 'none';
    }
    
    // Make sure the video element is visible and with proper z-index
    if (player.elements.wrapper) {
      player.elements.wrapper.style.visibility = 'visible';
      player.elements.wrapper.style.opacity = '1';
      player.elements.wrapper.style.zIndex = '3';
    }
    
    // Force the native video element to be visible
    if (player.media) {
      player.media.style.opacity = '1';
      player.media.style.visibility = 'visible';
    }
    
    // Force poster to be hidden when we attempt playback
    if (player.elements.poster) {
      player.elements.poster.style.opacity = '0';
      player.elements.poster.style.display = 'none';
      player.elements.poster.style.visibility = 'hidden';
      player.elements.poster.remove(); // Try to completely remove it
    }
    
    // Log the player state
    console.log('Player state before play:', {
      paused: player.paused,
      muted: player.muted, 
      currentTime: player.currentTime,
      duration: player.duration,
      readyState: player.media.readyState
    });

    // If video isn't loaded yet, wait for it
    if (player.media.readyState < 2) {
      console.log('Video not ready yet, waiting for load');
      player.media.addEventListener('loadeddata', () => {
        console.log('Video data loaded, attempting playback');
        attemptPlayback();
      }, { once: true });
      
      // Also set a fallback timeout in case loadeddata never fires
      setTimeout(attemptPlayback, 500);
      return;
    }
    
    // Otherwise try to play immediately
    attemptPlayback();
    
    // Function to attempt actual playback
    function attemptPlayback() {
      console.log('Attempting video playback...');
      
      // Add video-playing class first
      container.classList.add('video-playing');
      
      // Play video using both the Plyr player and direct video element methods
      try {
        // Try playing with Plyr
        const playPromise = player.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Video playback started successfully with Plyr');
          }).catch(error => {
            console.error('Plyr autoplay prevented:', error);
            
            // Try native video element as fallback
            try {
              console.log('Trying native video element playback as fallback');
              player.media.play().catch(nativeError => {
                console.error('Native autoplay also prevented:', nativeError);
                handlePlaybackFailure();
              });
            } catch (nativeError) {
              console.error('Error with native playback:', nativeError);
              handlePlaybackFailure();
            }
          });
        } else {
          // For older browsers that don't return a promise
          console.log('Browser did not return play promise, checking play state');
          
          // Check if the video is playing after a short delay
          setTimeout(() => {
            if (player.paused) {
              console.log('Video is still paused after play attempt');
              handlePlaybackFailure();
            } else {
              console.log('Video appears to be playing');
            }
          }, 300);
        }
      } catch (error) {
        console.error('Error attempting to play:', error);
        handlePlaybackFailure();
      }
      
      // Handle failed playback
      function handlePlaybackFailure() {
        console.log('Handling playback failure');
        
        // Make the play button more prominent since autoplay failed
        const playButton = container.querySelector('.preview-play-button');
        if (playButton) {
          playButton.style.opacity = '1';
          playButton.style.transform = 'scale(1.2)';
        }
      }
    }
  };
  
  // Try to play initially without a delay to start immediately
  playPreview(); // Call immediately 
  
  // Also try with a small delay as backup
  setTimeout(playPreview, 100);
  
  // And with a longer delay as a final attempt
  setTimeout(playPreview, 1000);
  
  // Make sure preview videos restart when they end (backup for loop)
  player.on('ended', () => {
    if (container.classList.contains('preview-mode')) {
      player.currentTime = 0;
      player.play().catch(() => {
        console.log('Replay prevented by browser policy');
      });
    }
  });
  
  // Handle visibility changes to restart video when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && 
        container.classList.contains('preview-mode')) {
      playPreview();
    }
  });
}

/**
 * Add a play button to preview mode
 * @param {HTMLElement} container The container to add the button to
 * @returns {HTMLButtonElement} The created play button
 */
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

/**
 * Initialize all Plyr videos
 */
export function initVideoPlayer() {
  // Initialize Lucide icons
  createIcons({
    icons: {
      Play,
      X
    }
  });
  
  // Check for autoplay support
  checkAutoplaySupport().then(canAutoplay => {
    // Store autoplay capability as a data attribute for CSS targeting
    document.documentElement.setAttribute('data-can-autoplay', canAutoplay.toString());
  });
  
  // Initialize players
  initializePlyrVideos();
  
  // Initialize lightbox
  initLightbox.init();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    players.forEach(player => {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    });
  });
}

/**
 * Test if browser supports autoplay
 * @returns {Promise<boolean>} Whether autoplay is supported
 */
async function checkAutoplaySupport() {
  // Create a test video element
  const video = document.createElement('video');
  video.muted = true;
  video.style.width = '1px';
  video.style.height = '1px';
  video.style.position = 'fixed';
  video.style.opacity = '0.01';
  video.style.pointerEvents = 'none';
  
  // Use a short test video or fallback to empty source
  video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAFNtZGF0AAAAFm1tb292AAAAbW12aGQAAAAAAAAAAAAAAAAAAAA+QAAAAAAAEAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAABLbHZjMgAAABxtdmhkAAAAD1lzPwIAAAD/AAAAQAAAAAAAAA5tZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAQAAAAAAAVAJAgAA';
  
  // Append to DOM temporarily
  document.body.appendChild(video);
  
  try {
    // Try to play
    const playPromise = video.play();
    if (playPromise !== undefined) {
      const result = await playPromise
        .then(() => true)
        .catch(() => false);
      
      // Clean up
      document.body.removeChild(video);
      return result;
    }
    
    // Fallback for browsers that don't return a promise
    document.body.removeChild(video);
    return false;
  } catch (error) {
    // Clean up
    document.body.removeChild(video);
    return false;
  }
}

// Expose for external use
export { players, initializedVideos }; 