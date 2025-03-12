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
 * Create a simplified mutation observer to remove poster elements
 * @returns {MutationObserver} Configured mutation observer
 */
export function createPosterRemovalObserver() {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          // If the added node is a poster element, remove it
          if (node.classList && 
              (node.classList.contains('plyr__poster') || 
               node.getAttribute('data-poster') || 
               node.hasAttribute('poster'))) {
            // Completely hide and remove the poster
            if (node.style) {
              node.style.display = 'none';
              node.style.opacity = '0';
              node.style.visibility = 'hidden';
            }
            
            // Try to remove it from the DOM
            try {
              if (node.parentNode) {
                node.parentNode.removeChild(node);
              }
            } catch (err) {
              // Silent error handling
            }
          }
          
          // For other nodes that might contain poster elements
          if (node.querySelectorAll) {
            const posters = node.querySelectorAll('.plyr__poster, [poster], [data-poster]');
            posters.forEach(poster => {
              // Hide the poster
              if (poster.style) {
                poster.style.display = 'none';
                poster.style.opacity = '0';
                poster.style.visibility = 'hidden';
              }
              
              // Remove from DOM
              try {
                if (poster.parentNode) {
                  poster.parentNode.removeChild(poster);
                }
              } catch (err) {
                // Silent error handling
              }
            });
          }
          
          // Also handle video elements directly to remove poster attributes
          if (node.tagName === 'VIDEO') {
            node.removeAttribute('poster');
            node.removeAttribute('data-poster');
          }
        }
      }
      
      // Check for attribute changes that might set a poster
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'poster' || mutation.attributeName === 'data-poster') && 
          mutation.target.hasAttribute(mutation.attributeName)) {
        mutation.target.removeAttribute(mutation.attributeName);
      }
      
      // Handle style attribute changes that might affect poster display
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'style' && 
          mutation.target.classList && 
          mutation.target.classList.contains('plyr__poster')) {
        // Hide poster completely
        mutation.target.style.display = 'none';
        mutation.target.style.opacity = '0';
        mutation.target.style.visibility = 'hidden';
        
        // Try to remove it from the DOM
        try {
          if (mutation.target.parentNode) {
            mutation.target.parentNode.removeChild(mutation.target);
          }
        } catch (err) {
          // Silent error handling
        }
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
}

/**
 * Configure a video source element
 * @param {HTMLVideoElement} video The video element to configure
 * @param {string} videoSrc The source URL for the video
 */
export function configureVideoSource(video, videoSrc) {
  if (!video || !videoSrc) return;
  
  // ALWAYS remove poster attribute to ensure no thumbnail shows
  video.removeAttribute('poster');
  video.removeAttribute('data-poster');
  video.style.backgroundImage = 'none';
  video.style.background = 'transparent';
  
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
    video.src = videoSrc; // Also set src directly as a fallback
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
  video.style.backgroundColor = 'transparent';
  video.style.position = 'relative';
  video.style.zIndex = '5';
  
  // Safari and some browsers need this hint
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
}

// Use the shared observer
const preventPosterObserver = createPosterRemovalObserver();

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
  
  // Force setting currentTime to 0 before anything else happens
  video.currentTime = 0;
  
  // Set standard video attributes
  video.muted = true;
  video.preload = 'auto';
  video.loop = true; // Enable looping
  video.autoplay = true; // Enable autoplay
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  
  // Try to play the video immediately
  const playVideo = async () => {
    try {
      // Ensure video is visible
      video.style.opacity = '1';
      video.style.visibility = 'visible';
      await video.play();
    } catch (e) {
      // Silent handling of play failures
      console.log('Initial autoplay failed, retrying...');
      setTimeout(playVideo, 100);
    }
  };
  
  // Try to play immediately and also after a short delay
  playVideo();
  setTimeout(playVideo, 100);
  
  // Initialize observer for poster removal
  preventPosterObserver.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['poster', 'style', 'data-poster', 'src', 'data-src', 'class']
  });
  
  // Initialize Plyr with simplified options
  const plyrOptions = {
    controls: [
      'play',
      'progress',
      'current-time',
      'mute',
      'volume',
      'fullscreen',
    ],
    resetOnEnd: false, // Prevent reset at end
    clickToPlay: true,
    muted: true,
    autoplay: true,
    loop: { active: true }, // Enable looping
    disablePictureInPicture: true,
    loadSprite: false,
    previewThumbnails: {
      enabled: false,
    },
    poster: null,
    tooltips: { controls: false, seek: false },
    thumbnails: { enabled: false }
  };
  
  // Create Plyr instance
  const player = new Plyr(video, plyrOptions);
  
  // Remove poster element after player is ready
  player.on('ready', () => {
    if (player.elements && player.elements.poster) {
      // Hide poster completely
      player.elements.poster.style.display = 'none';
      player.elements.poster.style.opacity = '0';
      player.elements.poster.style.visibility = 'hidden';
      
      // Try to remove the poster element if possible
      try {
        if (player.elements.poster.parentNode) {
          player.elements.poster.parentNode.removeChild(player.elements.poster);
        }
      } catch (err) {
        // Silent error handling
      }
    }
    
    // Remove poster attribute from the video element
    if (player.elements && player.elements.original) {
      player.elements.original.removeAttribute('poster');
    }
  });
  
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
  
  // Ensure we're at frame 0
  if (player.media) {
    player.media.currentTime = 0;
  }
  
  // Mark as playing immediately
  container.classList.add('video-playing');
  
  // Configure video for preview mode
  if (player.media) {
    // Set essential attributes for autoplay
    player.media.muted = true;
    player.media.loop = true;
    player.media.autoplay = true;
    player.media.playsinline = true;
    player.media.setAttribute('webkit-playsinline', '');
    player.media.currentTime = 0;
    
    // Function to handle playback
    const playVideo = async () => {
      try {
        // Ensure video is visible
        player.media.style.opacity = '1';
        player.media.style.visibility = 'visible';
        
        // Attempt to play
        await player.media.play();
        
        // If successful, ensure the video stays visible
        player.media.style.opacity = '1';
        player.media.style.visibility = 'visible';
      } catch (error) {
        console.log('Preview autoplay failed, retrying...');
        // Retry after a short delay
        setTimeout(playVideo, 100);
      }
    };

    // Try to play immediately
    playVideo();
    
    // Also try to play when metadata is loaded
    player.media.addEventListener('loadedmetadata', playVideo);
    
    // Ensure video stays playing after seeking or buffering
    player.media.addEventListener('seeked', playVideo);
    player.media.addEventListener('waiting', () => {
      setTimeout(playVideo, 100);
    });
  }
  
  // Disable any poster
  if (player.elements) {
    // Remove poster from original video element
    if (player.elements.original) {
      player.elements.original.removeAttribute('poster');
      player.elements.original.removeAttribute('data-poster');
      player.elements.original.style.backgroundImage = 'none';
    }
    
    // Remove poster element
    if (player.elements.poster) {
      player.elements.poster.style.display = 'none';
      player.elements.poster.style.opacity = '0';
      player.elements.poster.style.visibility = 'hidden';
      
      try {
        if (player.elements.poster.parentNode) {
          player.elements.poster.parentNode.removeChild(player.elements.poster);
        }
      } catch (err) {
        // Silent error handling
      }
    }
    
    // Disable preview thumbnails
    if (player.config) {
      player.config.previewThumbnails = { enabled: false };
      player.config.resetOnEnd = false; // Prevent reset at end
      player.config.loop = { active: true }; // Enable looping
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