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
import './styles.css';

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
  
  return player;
}

/**
 * Initialize all videos with data-plyr="true" attribute
 */
export function initializePlyrVideos() {
  // Select all videos with data-plyr="true" that haven't been initialized yet
  const videos = document.querySelectorAll('video[data-plyr="true"]:not([data-plyr-initialized])');
  
  videos.forEach(video => {
    // Handle data-src attribute
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
    
    const player = initializeVideoPlayer(video);
    
    // Find container and add preview mode
    const videoContainer = findVideoContainer(video);
    if (videoContainer) {
      // Setup preview and lightbox integration
      setupPreviewMode(videoContainer, player);
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
  
  // Mute for preview mode and start playing
  player.muted = true;
  player.currentTime = 0;
  player.play().catch(() => {
    // Autoplay may be blocked by browser policy
    console.log('Autoplay prevented by browser policy');
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

// Expose for external use
export { players, initializedVideos }; 