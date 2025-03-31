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
    this.posterImage = null; // Poster image URL
    this.performanceMode = false; // Low performance mode for mobile/low-power devices
    this.debugMode = isDebugEnabled(); // Check if debug mode is enabled
    this.startTime = 0; // Default start time in seconds
    this.endTime = null; // Will be calculated as start time + 20 seconds unless explicitly set
    this.defaultClipDuration = 20; // Default clip duration in seconds
    this.loopCheckInterval = null; // Interval to check for loop points
    
    if (this.debugMode) {
      logger.log('Debug mode enabled for VideoPlayer');
    }
  }

  static get observedAttributes() {
    return ['data-video-id', 'data-lightbox', 'data-responsive', 'data-poster', 'data-performance-mode', 'data-start-time', 'data-end-time'];
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
    
    if (name === 'data-start-time' && newValue !== oldValue) {
      this.startTime = this.parseTimeValue(newValue, 0);
      
      // If end time was not explicitly set, update it to be start time + default duration
      if (!this.hasAttribute('data-end-time')) {
        this.endTime = this.startTime + this.defaultClipDuration;
        if (this.debugMode) {
          logger.log(`Auto-adjusting end time to ${this.endTime} seconds (${this.defaultClipDuration}s after start time)`);
        }
      }
      
      this.updateLoopSettings();
    }
    
    if (name === 'data-end-time' && newValue !== oldValue) {
      this.endTime = this.parseTimeValue(newValue, null);
      this.updateLoopSettings();
    }
  }

  connectedCallback() {
    this.videoId = this.extractVideoId(this.getAttribute('data-video-id'));
    this.useLightbox = this.getAttribute('data-lightbox') === 'true';
    this.responsive = this.getAttribute('data-responsive') === 'true';
    this.posterImage = this.getAttribute('data-poster');
    this.performanceMode = this.getAttribute('data-performance-mode') === 'true';
    this.startTime = this.parseTimeValue(this.getAttribute('data-start-time'), 0);
    
    // Set end time with smart defaults (start time + 20 seconds)
    if (this.hasAttribute('data-end-time')) {
      this.endTime = this.parseTimeValue(this.getAttribute('data-end-time'), null);
    } else {
      this.endTime = this.startTime + this.defaultClipDuration;
      if (this.debugMode) {
        logger.log(`Using default end time: ${this.endTime} seconds (${this.defaultClipDuration}s clip)`);
      }
    }
    
    // Auto-detect if performance mode should be enabled
    if (this.getAttribute('data-performance-mode') === null) {
      this.detectPerformanceMode();
    }
    
    // Load Vimeo API
    this.loadVimeoAPI();
    
    // Render immediately
    this.render();
    
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
    
    // Setup visibility observer to pause/play based on visibility
    this.setupVisibilityObserver();
    
    // Also handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  disconnectedCallback() {
    // Clean up resize listener when element is removed
    window.removeEventListener('resize', this.resizeHandler);
    
    // Clean up visibility observer
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }
    
    // Remove visibility change listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Clean up loop check interval
    if (this.loopCheckInterval) {
      clearInterval(this.loopCheckInterval);
      this.loopCheckInterval = null;
    }
    
    // Clean up video players
    if (this.backgroundPlayer) {
      try {
        this.backgroundPlayer.destroy().catch(() => {});
      } catch (e) {
        // Ignore any errors when destroying the player
      }
    }
    
    if (this.lightboxPlayer) {
      try {
        this.lightboxPlayer.unload().catch(() => {});
      } catch (e) {
        // Ignore any errors when unloading the player
      }
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
      // Only try to set quality if we haven't already determined it's not supported
      if (this.backgroundPlayer && isPortrait && this.backgroundPlayer._qualitySettingSupported !== false) {
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
    
    // Create iframe for background video
    const iframe = document.createElement('iframe');
    iframe.className = 'video-player__background'; // No loaded class needed as we show immediately
    iframe.id = `video-player-background-${this.videoId}`;
    
    // Always use a lower quality for background videos 
    // and increase playback priority for faster loading
    let videoParams = 'background=1&autoplay=1&loop=1&byline=0&title=0&muted=1&autopause=0&transparent=0&dnt=1&quality=540p&playsinline=1';
    
    // Use very low quality on mobile to improve initial loading time 
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      videoParams = 'background=1&autoplay=1&loop=1&byline=0&title=0&muted=1&autopause=0&transparent=0&dnt=1&quality=360p&playsinline=1';
    }
    
    // Add start time parameter if specified
    if (this.startTime > 0) {
      videoParams += `&#t=${this.startTime}s`;
    }
    
    // Use even lower quality in performance mode
    if (this.performanceMode) {
      videoParams = `background=1&autoplay=1&loop=1&byline=0&title=0&muted=1&autopause=0&transparent=0&dnt=1&quality=360p&playsinline=1${this.startTime > 0 ? `&#t=${this.startTime}s` : ''}`;
    }
    
    iframe.src = `https://player.vimeo.com/video/${this.videoId}?${videoParams}`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('loading', 'eager'); // Ensure eager loading
    iframe.setAttribute('fetchpriority', 'high'); // Prioritize fetching
    iframe.setAttribute('importance', 'high'); // Add importance attribute
    
    // Initialize Vimeo player if API is loaded
    if (window.Vimeo && window.Vimeo.Player) {
      // We'll initialize the player immediately to ensure fast loading
      try {
        this.backgroundPlayer = new window.Vimeo.Player(iframe);
        this.backgroundPlayer.setVolume(0); // Ensure it's muted
        this.backgroundPlayer.setLoop(true); // Ensure it loops
        
        // Check if quality setting API is available for this player instance
        this.checkQualityApiSupport(this.backgroundPlayer);
        
        // Set connection quality based on device capabilities
        this.monitorPlayerPerformance(this.backgroundPlayer);

        // Apply custom start/end times if specified
        this.updateLoopSettings();

        // Make sure we start at the right position
        if (this.startTime > 0) {
          this.backgroundPlayer.setCurrentTime(this.startTime).catch(e => {
            if (this.debugMode) {
              logger.warn('Could not set initial start time:', e.message);
            }
          });
        }

        // Setup ended event handler to handle looping with custom start/end times
        if (this.endTime !== null) {
          try {
            this.backgroundPlayer.on('ended', () => {
              // When video ends naturally, go back to start time
              this.backgroundPlayer.setCurrentTime(this.startTime).catch(e => {
                if (this.debugMode) {
                  logger.warn('Could not reset to start time after end:', e.message);
                }
              });
            });
          } catch (e) {
            if (this.debugMode) {
              logger.warn('Could not set ended event handler:', e.message);
            }
          }
        }

        // Handle errors
        this.backgroundPlayer.on('error', (error) => {
          logger.error('Vimeo player error:', error);
        });
        
        logger.log('Background player initialized');
      } catch (e) {
        logger.error('Failed to initialize Vimeo player:', e);
      }
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
    // Also use the start time (if specified) for lightbox videos
    let lightboxParams = 'autoplay=1&byline=0&title=0&autopause=0&quality=1080p';
    if (this.startTime > 0) {
      lightboxParams += `&#t=${this.startTime}s`;
    }
    
    iframe.src = `https://player.vimeo.com/video/${this.videoId}?${lightboxParams}`;
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
    
    // Skip quality setting entirely if we're in production mode and not in debug mode
    if (isProduction() && !this.debugMode) {
      return;
    }
    
    try {
      // First check if quality setting is even supported for this player instance
      if (typeof player.getQualities !== 'function' || typeof player.setQuality !== 'function') {
        if (this.debugMode) {
          logger.warn('Quality API not available for this player');
        }
        return;
      }
      
      // Store a flag on the player instance to prevent repeated attempts for the same video
      if (player._qualitySettingAttempted) {
        return;
      }
      
      // Mark that we've attempted to set quality for this player
      player._qualitySettingAttempted = true;
      
      // First just check if the method exists and works without actually changing quality
      player.getQualities()
        .then(qualities => {
          // Only proceed if we actually have quality options
          if (qualities && Array.isArray(qualities) && qualities.length > 0) {
            // Check if our requested quality is in the available qualities
            const hasRequestedQuality = qualities.some(q => 
              typeof q === 'string' ? q === quality : q.label === quality || q.id === quality
            );
            
            if (hasRequestedQuality) {
              return player.setQuality(quality);
            } else {
              if (this.debugMode) {
                logger.warn(`Requested quality '${quality}' not available. Available qualities:`, qualities);
              }
              return Promise.resolve();
            }
          } else {
            if (this.debugMode) {
              logger.warn('No quality options available for this video');
            }
            return Promise.resolve();
          }
        })
        .catch(() => {
          // Silently fail - quality setting is now considered unsupported for this video
          player._qualitySettingSupported = false;
        });
    } catch (error) {
      // Catch any synchronous errors
      if (this.debugMode) {
        logger.warn(`Error in quality setting: ${error.message || 'Unknown error'}`);
      }
      // Mark quality setting as unsupported for this instance
      if (player) {
        player._qualitySettingSupported = false;
      }
    }
  }

  monitorPlayerPerformance(player) {
    if (!player) return;
    
    try {
      // For mobile, just set connection quality to low directly
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        this.connectionQuality = 'low';
        return;
      }
      
      // Set default connection quality based on navigator.connection if available
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
    } catch (error) {
      // Default to medium on error
      this.connectionQuality = 'medium';
    }
  }

  detectPerformanceMode() {
    // Simplified detection focused on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Always enable performance mode on mobile
    if (isMobile) {
      this.performanceMode = true;
      if (this.debugMode) {
        logger.log('Auto-enabled performance mode for mobile device');
      }
    }
  }

  updatePerformanceMode() {
    if (this.performanceMode) {
      // Apply performance mode optimizations
      this.classList.add('performance-mode');
      
      // If already has a background player, adjust settings
      if (this.backgroundPlayer) {
        // Only attempt to set quality if we haven't already determined it's not supported
        if (this.backgroundPlayer._qualitySettingSupported !== false) {
          // Safely set quality using our error-handling method
          this.safelySetQuality(this.backgroundPlayer, '540p');
        }
        
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

  // Parse time values from string to seconds
  parseTimeValue(value, defaultValue) {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    // Try parsing as float (assuming seconds)
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
    
    // Try parsing time format like "1:30" (1 min 30 sec)
    const timeMatch = /^(\d+):(\d+)$/.exec(value);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = parseInt(timeMatch[2], 10);
      return (minutes * 60) + seconds;
    }
    
    return defaultValue;
  }

  updateLoopSettings() {
    // Only update if we have a player
    if (!this.backgroundPlayer) return;

    try {
      // Set the start time if not at beginning
      if (this.startTime > 0) {
        this.backgroundPlayer.getCurrentTime().then(currentTime => {
          // Only seek if we're at the very beginning or if we're past our end time
          // This prevents seeking while someone is already watching
          if (currentTime < 0.1 || (this.endTime !== null && currentTime > this.endTime)) {
            this.backgroundPlayer.setCurrentTime(this.startTime).catch(e => {
              if (this.debugMode) {
                logger.warn('Could not set start time:', e.message);
              }
            });
          }
        }).catch(e => {
          if (this.debugMode) {
            logger.warn('Could not get current time to set start time:', e.message);
          }
        });
      }
      
      // Setup loop checking if we have both start and end times
      this.setupLoopChecking();
    } catch (e) {
      if (this.debugMode) {
        logger.warn('Error updating loop settings:', e.message);
      }
    }
  }

  setupLoopChecking() {
    // Clear any existing interval
    if (this.loopCheckInterval) {
      clearInterval(this.loopCheckInterval);
      this.loopCheckInterval = null;
    }

    // Only setup an interval if we have an end time
    if (this.endTime !== null && this.backgroundPlayer) {
      // Check every 250ms if we've reached the end time
      this.loopCheckInterval = setInterval(() => {
        if (!this.backgroundPlayer) {
          clearInterval(this.loopCheckInterval);
          this.loopCheckInterval = null;
          return;
        }

        this.backgroundPlayer.getCurrentTime().then(currentTime => {
          // If we've reached or passed the end time, loop back to start time
          if (currentTime >= this.endTime) {
            this.backgroundPlayer.setCurrentTime(this.startTime).catch(e => {
              // Silently handle errors
              if (this.debugMode) {
                logger.warn('Could not loop back to start time:', e.message);
              }
            });
          }
        }).catch(e => {
          // Silently handle errors
          if (this.debugMode) {
            logger.warn('Error in loop checking:', e.message);
          }
        });
      }, 250);
    }
  }

  // Helper method to check quality API support
  checkQualityApiSupport(player) {
    if (!player) return false;
    
    try {
      // Initial assumptions - will be verified/modified during checks
      player._qualitySettingAttempted = false;
      player._qualitySettingSupported = true;
      
      // Check if method exists
      if (typeof player.getQualities !== 'function' || typeof player.setQuality !== 'function') {
        player._qualitySettingSupported = false;
        if (this.debugMode) {
          logger.warn('Quality API methods not available for this player');
        }
        return false;
      }
      
      // Check if getQualities returns a valid result
      player.getQualities().then(qualities => {
        if (!qualities || !Array.isArray(qualities) || qualities.length === 0) {
          player._qualitySettingSupported = false;
          if (this.debugMode) {
            logger.warn('No quality options available for this video');
          }
          return false;
        }
        
        // Log available qualities in debug mode
        if (this.debugMode) {
          logger.log('Available video qualities:', qualities);
        }
        
        // Mark as supported - quality setting should work
        player._qualitySettingSupported = true;
        return true;
      }).catch(error => {
        // Any error indicates the quality API isn't supported
        player._qualitySettingSupported = false;
        if (this.debugMode) {
          logger.warn('Quality API check failed:', error.message);
        }
        return false;
      });
    } catch (error) {
      if (player) {
        player._qualitySettingSupported = false;
      }
      if (this.debugMode) {
        logger.warn('Error checking quality API support:', error.message);
      }
      return false;
    }
  }
}

// Register custom element
customElements.define('video-player', VideoPlayer); 