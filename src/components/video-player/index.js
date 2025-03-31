import { Lightbox } from '../lightbox';

// Determine if we're in production mode
const isProduction = () => {
  try {
    return process.env.NODE_ENV === 'production';
  } catch (e) {
    // If process.env is not available, check for other indicators
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }
};

// Debug mode can be enabled with ?debug=video in the URL
const isDebugEnabled = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('debug') && 
          (urlParams.get('debug') === 'video' || urlParams.get('debug') === 'true');
  } catch (e) {
    return false;
  }
};

// Logger utility to suppress logs in production
const logger = {
  log: (...args) => {
    if (!isProduction() || isDebugEnabled()) {
      console.log('[VideoPlayer]', ...args);
    }
  },
  warn: (...args) => {
    if (!isProduction() || isDebugEnabled()) {
      console.warn('[VideoPlayer]', ...args);
    }
  },
  error: (...args) => {
    // Always log errors, even in production, but add component name for easier debugging
    console.error('[VideoPlayer]', ...args);
  }
};

export class VideoPlayer extends HTMLElement {
  constructor() {
    super();
    this.videoId = '';
    this.useLightbox = false;
    this.lightbox = null;
    this.isBackgroundVideo = true;
    this.hasVimeoScript = false;
    this.resizeHandler = this.handleResize.bind(this);
    this.backgroundPlayer = null;
    this.lightboxPlayer = null;
    this.responsive = false;
    this.connectionQuality = 'high'; // Default assumption
    this.loadingStatus = 'loading'; // Track loading status
    this.posterImage = null; // Poster image URL
    this.performanceMode = false; // Low performance mode for mobile/low-power devices
    this.debugMode = isDebugEnabled(); // Check if debug mode is enabled
    
    if (this.debugMode) {
      logger.log('Debug mode enabled for VideoPlayer');
    }
  }

  static get observedAttributes() {
    return ['data-video-id', 'data-lightbox', 'data-responsive', 'data-poster', 'data-performance-mode'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-video-id' && newValue !== oldValue) {
      this.videoId = this.extractVideoId(newValue);
      this.render();
    }
    
    if (name === 'data-lightbox' && newValue !== oldValue) {
      this.useLightbox = newValue === 'true';
      this.render();
    }
    
    if (name === 'data-responsive' && newValue !== oldValue) {
      this.responsive = newValue === 'true';
      this.updateResponsiveState();
      this.render();
    }
    
    if (name === 'data-poster' && newValue !== oldValue) {
      this.posterImage = newValue;
      this.updatePosterImage();
    }
    
    if (name === 'data-performance-mode' && newValue !== oldValue) {
      this.performanceMode = newValue === 'true';
      this.updatePerformanceMode();
    }
  }

  connectedCallback() {
    this.videoId = this.extractVideoId(this.getAttribute('data-video-id'));
    this.useLightbox = this.getAttribute('data-lightbox') === 'true';
    this.responsive = this.getAttribute('data-responsive') === 'true';
    this.posterImage = this.getAttribute('data-poster');
    this.performanceMode = this.getAttribute('data-performance-mode') === 'true';
    
    // Auto-detect if performance mode should be enabled
    if (this.getAttribute('data-performance-mode') === null) {
      this.detectPerformanceMode();
    }
    
    // Load Vimeo API
    this.loadVimeoAPI();
    
    // Add intersection observer for lazy loading
    this.setupLazyLoading();
    
    // Initialize lightbox if needed
    if (this.useLightbox) {
      this.lightbox = new Lightbox();
    }

    // Update responsive state
    this.updateResponsiveState();

    // Add resize listener for responsive behavior
    window.addEventListener('resize', this.resizeHandler);
    
    // Initial resize calculation
    setTimeout(() => this.handleResize(), 100);
  }

  disconnectedCallback() {
    // Clean up resize listener when element is removed
    window.removeEventListener('resize', this.resizeHandler);
    
    // Clean up intersection observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Clean up visibility observer
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }
    
    // Remove visibility change listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Clean up video players
    if (this.backgroundPlayer) {
      this.backgroundPlayer.destroy();
    }
    
    if (this.lightboxPlayer) {
      this.lightboxPlayer.destroy();
    }
  }

  handleResize() {
    // Calculate appropriate scale based on container dimensions
    const iframe = this.querySelector('.video-player__background');
    if (iframe) {
      // Adjust scale based on aspect ratio differences
      const containerAspect = this.offsetWidth / this.offsetHeight;
      // Default 16:9 video aspect ratio, but could be adjusted dynamically if known
      const videoAspect = 16/9;
      
      let scale = 1.5; // Default scale
      
      // Adjust scale based on aspect ratio comparison
      if (containerAspect > videoAspect) {
        // Container is wider than video, need to scale width more
        scale = containerAspect / videoAspect * 1.2;
      } else {
        // Container is taller than video, need to scale height more
        scale = videoAspect / containerAspect * 1.2;
      }
      
      // Apply the scale
      iframe.style.transform = `translate(-50%, -50%) scale(${scale})`;
      // logger.log('Video player resized to:', this.offsetWidth, 'x', this.offsetHeight, 'Scale:', scale);
      
      // Check if we're in portrait mode (9:16) and adjust quality if needed
      const isPortrait = this.offsetWidth < this.offsetHeight || containerAspect < 1;
      
      // Reassess quality when player is resized, especially for portrait mode
      if (this.backgroundPlayer && isPortrait) {
        // For portrait mode, we need higher quality since we're zooming more
        // This ensures portrait mode looks sharp even with more zooming
        this.safelySetQuality(this.backgroundPlayer, '1080p');
      }
    }
  }

  extractVideoId(input) {
    if (!input) return '';
    
    // Check if input is already just an ID (numbers only)
    if (/^\d+$/.test(input)) {
      return input;
    }
    
    // Try to extract ID from URL
    const match = input.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
    return match ? match[1] : '';
  }

  loadVimeoAPI() {
    if (document.querySelector('script[src*="player.vimeo.com/api/player.js"]')) {
      this.hasVimeoScript = true;
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.onload = () => {
      this.hasVimeoScript = true;
    };
    
    document.head.appendChild(script);
  }

  createBackgroundVideo() {
    const elements = [];
    
    // Add poster image (if available)
    if (this.posterImage) {
      const poster = document.createElement('div');
      poster.className = 'video-player__poster';
      poster.style.backgroundImage = `url(${this.posterImage})`;
      elements.push(poster);
    }
    
    // Add loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'video-player__spinner';
    elements.push(spinner);
    
    // Create iframe for background video
    const iframe = document.createElement('iframe');
    iframe.className = 'video-player__background';
    iframe.id = `video-player-background-${this.videoId}`;
    
    // Always use a lower quality for background videos
    // Instead of trying to set quality via API, set it in the URL
    let videoParams = 'background=1&autoplay=1&loop=1&byline=0&title=0&muted=1&autopause=0&transparent=0&dnt=1&quality=540p';
    
    // Use even lower quality in performance mode
    if (this.performanceMode) {
      videoParams = 'background=1&autoplay=1&loop=1&byline=0&title=0&muted=1&autopause=0&transparent=0&dnt=1&quality=360p';
    }
    
    iframe.src = `https://player.vimeo.com/video/${this.videoId}?${videoParams}`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('loading', 'lazy'); // Add native lazy loading
    iframe.setAttribute('fetchpriority', 'high'); // Prioritize fetching but still lazy load
    
    // Initialize Vimeo player if API is loaded
    if (window.Vimeo && window.Vimeo.Player) {
      // We'll initialize the player after it's added to the DOM
      setTimeout(() => {
        try {
          this.backgroundPlayer = new window.Vimeo.Player(iframe);
          this.backgroundPlayer.setVolume(0); // Ensure it's muted
          this.backgroundPlayer.setLoop(true); // Ensure it loops
          
          // Instead of trying to set quality directly, we'll monitor player events
          this.monitorPlayerPerformance(this.backgroundPlayer);

          // Monitor loading state
          this.backgroundPlayer.on('loaded', () => {
            this.loadingStatus = 'loaded';
            this.querySelector('.video-player__spinner')?.classList.add('hidden');
            iframe.classList.add('loaded');
            
            // Fade out poster image when video is loaded
            const poster = this.querySelector('.video-player__poster');
            if (poster) {
              poster.classList.add('hidden');
            }
          });

          // Handle errors
          this.backgroundPlayer.on('error', (error) => {
            logger.error('Vimeo player error:', error);
            this.loadingStatus = 'error';
            // Show error state
            const spinner = this.querySelector('.video-player__spinner');
            if (spinner) {
              spinner.classList.add('error');
            }
          });
          
          // Implement adaptive buffering
          this.adaptiveBuffering(this.backgroundPlayer);
          
          logger.log('Background player initialized');
        } catch (e) {
          logger.error('Failed to initialize Vimeo player:', e);
        }
      }, 0);
    }
    
    elements.push(iframe);
    
    if (this.useLightbox) {
      // Create overlay with play button
      const overlay = document.createElement('div');
      overlay.className = 'video-player__overlay';
      
      const playButton = document.createElement('button');
      playButton.className = 'video-player__play-button';
      playButton.setAttribute('aria-label', 'Play video');
      
      const playIcon = document.createElement('div');
      playIcon.className = 'video-player__play-icon';
      
      playButton.appendChild(playIcon);
      overlay.appendChild(playButton);
      
      // Make the entire overlay clickable to open lightbox
      overlay.style.cursor = 'pointer';
      overlay.addEventListener('click', (e) => {
        this.openLightbox();
      });
      
      // Add event listener to play button (for backward compatibility)
      playButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent double triggering when clicking the button
        this.openLightbox();
      });
      
      elements.push(overlay);
    }
    
    return elements;
  }

  openLightbox() {
    if (!this.lightbox) return;
    
    // Set lightbox active state
    this.classList.add('lightbox-active');
    
    // Create a new iframe for the lightbox without stopping the background video
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    // For lightbox videos, set a higher quality since they're fullscreen and in focus
    iframe.src = `https://player.vimeo.com/video/${this.videoId}?autoplay=1&byline=0&title=0&autopause=0&quality=1080p`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    
    this.lightbox.setContent(iframe);
    
    // Store a reference to the lightbox instance for the close event
    const lightboxInstance = this.lightbox;
    
    // Set a callback for when the lightbox is closed
    const originalClose = this.lightbox.close.bind(this.lightbox);
    this.lightbox.close = () => {
      // Clean up lightbox player if it exists
      if (this.lightboxPlayer) {
        this.lightboxPlayer.unload();
        this.lightboxPlayer = null;
      }
      
      // Call the original close method
      originalClose();
      
      // Restore the original close method
      this.lightbox.close = originalClose;
      
      // Remove lightbox active state
      this.classList.remove('lightbox-active');
      
      // Ensure background player is still playing
      if (this.backgroundPlayer) {
        this.backgroundPlayer.play();
      }
    };
    
    this.lightbox.open();
    
    // Initialize the lightbox player after the iframe is added to the DOM
    if (window.Vimeo && window.Vimeo.Player) {
      setTimeout(() => {
        try {
          this.lightboxPlayer = new window.Vimeo.Player(iframe);
          
          // No longer try to set quality via API for lightbox player
          // Instead, we use the URL parameter
          
          // Add event listeners to handle background video
          this.lightboxPlayer.on('play', () => {
            // Ensure background video keeps playing when lightbox video plays
            if (this.backgroundPlayer) {
              this.backgroundPlayer.play();
            }
          });
        } catch (e) {
          logger.error('Failed to initialize lightbox player:', e);
        }
      }, 100);
    }
    
    // Force background video to keep playing
    if (this.backgroundPlayer) {
      // Small delay to make sure Vimeo API doesn't pause it automatically
      setTimeout(() => {
        this.backgroundPlayer.play();
      }, 200);
    }
  }

  render() {
    // Clear existing content
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    
    if (!this.videoId) return;
    
    const elements = this.createBackgroundVideo();
    elements.forEach(element => this.appendChild(element));
    
    // Add necessary styling directly to the custom element
    this.classList.add('video-player');
    
    // Update responsive state
    this.updateResponsiveState();
  }

  updateResponsiveState() {
    if (this.responsive) {
      this.classList.add('responsive');
    } else {
      this.classList.remove('responsive');
    }
  }

  safelySetQuality(player, quality) {
    if (!player) return;
    
    try {
      // First check if quality setting is even supported for this player instance
      if (typeof player.getQualities !== 'function' || typeof player.setQuality !== 'function') {
        if (this.debugMode) {
          logger.warn('Quality API not available for this player');
        }
        return;
      }
      
      // Use a Promise.catch pattern to properly handle any rejection
      player.getQualities()
        .then(qualities => {
          if (qualities && qualities.length > 0) {
            return player.setQuality(quality);
          } else {
            if (this.debugMode) {
              logger.warn('No quality options available for this video');
            }
            return Promise.reject(new Error('No quality options available'));
          }
        })
        .catch(error => {
          // Don't log in production unless debug mode is on
          if (this.debugMode) {
            logger.warn(`Quality setting failed: ${error.message || 'Unknown error'}`);
          }
          // No need to rethrow - just silently handle the error
        });
    } catch (error) {
      // Catch any synchronous errors
      if (this.debugMode) {
        logger.warn(`Error in quality setting: ${error.message || 'Unknown error'}`);
      }
    }
  }

  monitorPlayerPerformance(player) {
    if (!player) return;
    
    try {
      // Set default connection quality
      if (navigator.connection) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType; // 'slow-2g', '2g', '3g', or '4g'
        const downlink = connection.downlink; // Mbps
        
        if (effectiveType === '4g' && downlink > 5) {
          this.connectionQuality = 'high';
        } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 2)) {
          this.connectionQuality = 'medium';
        } else {
          this.connectionQuality = 'low';
        }
      } else {
        // Default to medium if can't detect
        this.connectionQuality = 'medium';
      }
      
      // Monitor for rebuffering events - safely add event listeners
      try {
        player.on('bufferstart', () => {
          // If we start buffering, try to reload with lower quality
          if (this.connectionQuality === 'high') {
            this.connectionQuality = 'medium';
            if (this.debugMode) {
              logger.log('Buffering detected, reducing connection quality to medium');
            }
          } else if (this.connectionQuality === 'medium') {
            this.connectionQuality = 'low';
            if (this.debugMode) {
              logger.log('Buffering detected, reducing connection quality to low');
            }
          }
        });
      } catch (error) {
        // Silently handle event registration errors
        if (this.debugMode) {
          logger.warn('Error registering buffer event:', error.message);
        }
      }
      
    } catch (error) {
      if (this.debugMode) {
        logger.warn('Error monitoring player performance:', error.message);
      }
    }
  }

  detectPerformanceMode() {
    // Check for low-power or mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const hasSlowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    
    // Enable performance mode for mobile or low-spec devices
    if (isMobile || hasLowMemory || hasSlowCPU) {
      this.performanceMode = true;
      logger.log('Auto-enabled performance mode for low-power device');
    }
  }

  updatePerformanceMode() {
    if (this.performanceMode) {
      // Apply performance mode optimizations
      this.classList.add('performance-mode');
      
      // If already has a background player, adjust settings
      if (this.backgroundPlayer) {
        // Safely set quality using our error-handling method
        this.safelySetQuality(this.backgroundPlayer, '540p');
        
        // Try to reduce frame rate if possible - using try/catch for safety
        try {
          // Some services support frame rate control
          if (typeof this.backgroundPlayer.setPlaybackRate === 'function') {
            this.backgroundPlayer.setPlaybackRate(0.9) // Slightly slower playback
              .catch(error => {
                // Silently handle any errors when setting playback rate
                if (this.debugMode) {
                  logger.warn('Could not set playback rate:', error.message);
                }
              });
          }
        } catch (error) {
          if (this.debugMode) {
            logger.warn('Could not apply frame rate optimization:', error.message);
          }
        }
      }
    } else {
      this.classList.remove('performance-mode');
      
      // Restore normal quality settings if player exists
      if (this.backgroundPlayer) {
        this.monitorPlayerPerformance(this.backgroundPlayer);
      }
    }
  }

  setupLazyLoading() {
    // Create IntersectionObserver to only load video when visible
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // When element becomes visible
          if (entry.isIntersecting) {
            // Initial render only when visible
            this.render();
            // Disconnect observer after loading
            this.observer.disconnect();
            
            // Setup visibility observer to pause/play based on visibility
            this.setupVisibilityObserver();
          }
        });
      }, {
        rootMargin: '200px 0px', // Load video when within 200px of viewport
        threshold: 0.01
      });
      
      this.observer.observe(this);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.render();
      this.setupVisibilityObserver();
    }
    
    // Also handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
  
  setupVisibilityObserver() {
    // Create another observer to track when video is in viewport
    if ('IntersectionObserver' in window) {
      this.visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Play video when visible
            if (this.backgroundPlayer) {
              this.backgroundPlayer.play();
              this.classList.remove('video-paused');
            }
        } else {
            // Pause video when not visible (only if not in lightbox mode)
            if (this.backgroundPlayer && !this.classList.contains('lightbox-active')) {
              this.backgroundPlayer.pause();
              this.classList.add('video-paused');
            }
          }
        });
      }, {
        rootMargin: '0px',
        threshold: 0.1 // Consider visible when at least 10% is visible
      });
      
      this.visibilityObserver.observe(this);
    }
  }
  
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, pause video
      if (this.backgroundPlayer) {
        this.backgroundPlayer.pause();
      }
    } else {
      // Page is visible again, resume if video was playing and is in viewport
      const isInViewport = this.isElementInViewport(this);
      if (this.backgroundPlayer && isInViewport && !this.classList.contains('video-paused')) {
        this.backgroundPlayer.play();
      }
    }
  }
  
  isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= -rect.height &&
      rect.left >= -rect.width &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + rect.height &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) + rect.width
    );
  }

  updatePosterImage() {
    const poster = this.querySelector('.video-player__poster');
    if (this.posterImage && poster) {
      poster.style.backgroundImage = `url(${this.posterImage})`;
    }
  }

  adaptiveBuffering(player) {
    if (!player) return;
    
    try {
      // Get buffering events - wrap each event listener in try/catch
      try {
        player.on('bufferstart', () => {
          if (this.debugMode) {
            logger.log('Buffer started');
          }
          this.querySelector('.video-player__spinner')?.classList.remove('hidden');
        });
      } catch (e) {
        if (this.debugMode) {
          logger.warn('Error setting bufferstart event:', e.message);
        }
      }
      
      try {
        player.on('bufferend', () => {
          if (this.debugMode) {
            logger.log('Buffer ended');
          }
          this.querySelector('.video-player__spinner')?.classList.add('hidden');
        });
      } catch (e) {
        if (this.debugMode) {
          logger.warn('Error setting bufferend event:', e.message);
        }
      }
      
      // Adapt to rebuffering by potentially reducing quality
      let bufferCount = 0;
      const bufferStartTime = Date.now();
      
      try {
        player.on('bufferstart', () => {
          bufferCount++;
          
          // If buffering frequently (more than 3 times in 30 seconds), reduce quality
          const timeElapsed = (Date.now() - bufferStartTime) / 1000;
          if (bufferCount > 3 && timeElapsed < 30) {
            if (this.debugMode) {
              logger.log('Frequent buffering detected, considering reload at lower quality');
            }
            
            // Step down quality
            if (this.connectionQuality === 'high') {
              this.connectionQuality = 'medium';
              // Instead of trying to set quality, enable performance mode
              if (!this.performanceMode) {
                this.performanceMode = true;
                this.updatePerformanceMode();
                if (this.debugMode) {
                  logger.log('Enabled performance mode due to buffering issues');
                }
              }
            } else if (this.connectionQuality === 'medium') {
              this.connectionQuality = 'low';
              // Already in performance mode, consider reloading the video
              this.considerReloadingVideo();
            }
            
            // Reset buffer count after adjusting
            bufferCount = 0;
          }
        });
      } catch (e) {
        if (this.debugMode) {
          logger.warn('Error setting adaptive buffer handling:', e.message);
        }
      }
      
      // Monitor playback progress to detect stalls - using a safer approach
      let lastPlaybackTime = 0;
      let stuckCounter = 0;
      let intervalId = null;
      
      const monitorPlayback = () => {
        if (!player || !this.backgroundPlayer) {
          if (intervalId) {
            clearInterval(intervalId);
          }
          return;
        }
        
        player.getCurrentTime()
          .then(currentTime => {
            // If time has not advanced in 3 seconds
            if (Math.abs(currentTime - lastPlaybackTime) < 0.1) {
              stuckCounter++;
              
              // If stuck for more than 3 checks (approx 3 seconds), trigger quality reduction
              if (stuckCounter >= 3) {
                if (this.debugMode) {
                  logger.log('Playback stalled, considering reload at lower quality');
                }
                
                // Reduce quality
                if (this.connectionQuality === 'high') {
                  this.connectionQuality = 'medium';
                  // Enable performance mode
                  if (!this.performanceMode) {
                    this.performanceMode = true;
                    this.updatePerformanceMode();
                  }
                } else if (this.connectionQuality === 'medium') {
                  this.connectionQuality = 'low';
                  // Consider reloading video at lowest quality
                  this.considerReloadingVideo();
                }
                
                // Reset counter
                stuckCounter = 0;
              }
            } else {
              // Reset counter when playback continues
              stuckCounter = 0;
            }
            
            lastPlaybackTime = currentTime;
          })
          .catch(err => {
            // Silently fail individual checks - just keep monitoring
            if (this.debugMode) {
              logger.warn('Error checking playback progress:', err.message);
            }
          });
      };
      
      // Start the monitoring interval
      intervalId = setInterval(monitorPlayback, 1000);
      
      // Clean up interval when component is destroyed
      this.addEventListener('disconnected', () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      });
      
    } catch (error) {
      if (this.debugMode) {
        logger.warn('Error setting up adaptive buffering:', error.message);
      }
    }
  }
  
  considerReloadingVideo() {
    // Only reload if we're already at low connection quality and having issues
    if (this.connectionQuality === 'low' && this.performanceMode && this.backgroundPlayer) {
      if (this.debugMode) {
        logger.log('Considering reloading video at lowest quality');
      }
      
      try {
        // Check if the video has been playing for at least 10 seconds
        this.backgroundPlayer.getCurrentTime()
          .then(time => {
            // Only reload if we've been playing for a while (persistent issues)
            if (time > 10) {
              if (this.debugMode) {
                logger.log('Reloading video at lowest quality');
              }
              
              // Store current time
              const currentTime = time;
              
              // Create new iframe with lowest quality setting
              const oldIframe = this.querySelector('.video-player__background');
              if (oldIframe) {
                // Show loading spinner
                this.querySelector('.video-player__spinner')?.classList.remove('hidden');
                
                // Create new iframe with lowest quality
                const newIframe = document.createElement('iframe');
                newIframe.className = 'video-player__background';
                newIframe.id = `video-player-background-${this.videoId}`;
                newIframe.src = `https://player.vimeo.com/video/${this.videoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1&autopause=0&transparent=0&dnt=1&quality=360p`;
                newIframe.setAttribute('frameborder', '0');
                newIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
                
                try {
                  // Replace old iframe with new one - wrapped in try/catch
                  oldIframe.parentNode.replaceChild(newIframe, oldIframe);
                  
                  // Initialize new player
                  if (window.Vimeo && window.Vimeo.Player) {
                    setTimeout(() => {
                      try {
                        // Safely destroy old player
                        try {
                          if (this.backgroundPlayer) {
                            this.backgroundPlayer.destroy().catch(e => {
                              // Silently handle destroy errors
                              if (this.debugMode) {
                                logger.warn('Could not destroy previous player:', e.message);
                              }
                            });
                          }
                        } catch (e) {
                          // Ignore errors when destroying the old player
                          if (this.debugMode) {
                            logger.warn('Error destroying previous player:', e.message);
                          }
                        }
                        
                        // Create new player
                        this.backgroundPlayer = new window.Vimeo.Player(newIframe);
                        
                        // Apply basic settings
                        Promise.all([
                          this.backgroundPlayer.setVolume(0).catch(() => {}),
                          this.backgroundPlayer.setLoop(true).catch(() => {})
                        ]).then(() => {
                          // After applying basic settings, try to seek to previous position
                          return this.backgroundPlayer.setCurrentTime(currentTime).catch(err => {
                            if (this.debugMode) {
                              logger.warn('Could not seek to previous position:', err.message);
                            }
                          });
                        }).catch(() => {
                          // Silently ignore promise.all errors
                        });
                        
                        // Setup new event listeners
                        try {
                          this.backgroundPlayer.on('loaded', () => {
                            newIframe.classList.add('loaded');
                            this.querySelector('.video-player__spinner')?.classList.add('hidden');
                          });
                        } catch (e) {
                          // Silently handle event subscription errors
                        }
                        
                        if (this.debugMode) {
                          logger.log('Reinitialized player at lowest quality');
                        }
                      } catch (e) {
                        if (this.debugMode) {
                          logger.error('Failed to reinitialize player:', e.message);
                        }
                      }
                    }, 0);
                  }
                } catch (e) {
                  if (this.debugMode) {
                    logger.warn('Error replacing iframe:', e.message);
                  }
                }
              }
            }
          })
          .catch(err => {
            if (this.debugMode) {
              logger.warn('Error getting current time:', err.message);
            }
          });
      } catch (e) {
        if (this.debugMode) {
          logger.warn('Error in reload process:', e.message);
        }
      }
    }
  }
}

// Register custom element
customElements.define('video-player', VideoPlayer); 