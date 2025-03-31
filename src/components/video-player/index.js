import { Lightbox } from '../lightbox';

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
  }

  static get observedAttributes() {
    return ['data-video-id', 'data-lightbox', 'data-responsive'];
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
  }

  connectedCallback() {
    this.videoId = this.extractVideoId(this.getAttribute('data-video-id'));
    this.useLightbox = this.getAttribute('data-lightbox') === 'true';
    this.responsive = this.getAttribute('data-responsive') === 'true';
    
    console.log('Video Player initialized with ID:', this.videoId, 'and dimensions:', this.offsetWidth, 'x', this.offsetHeight);
    
    // Load Vimeo API
    this.loadVimeoAPI();
    
    // Initial render
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
  }

  disconnectedCallback() {
    // Clean up resize listener when element is removed
    window.removeEventListener('resize', this.resizeHandler);
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
      console.log('Video player resized to:', this.offsetWidth, 'x', this.offsetHeight, 'Scale:', scale);
      
      // Check if we're in portrait mode (9:16) and adjust quality if needed
      const isPortrait = this.offsetWidth < this.offsetHeight || containerAspect < 1;
      
      // Reassess quality when player is resized, especially for portrait mode
      if (this.backgroundPlayer && isPortrait) {
        // For portrait mode, we need higher quality since we're zooming more
        // This ensures portrait mode looks sharp even with more zooming
        this.adjustQualityForViewport(this.backgroundPlayer, isPortrait);
      }
    }
  }
  
  adjustQualityForViewport(player, isPortrait) {
    // Get current connection quality baseline
    let targetQuality;
    
    if (isPortrait) {
      // In portrait mode, bump up quality by one level if possible
      if (this.connectionQuality === 'low') {
        targetQuality = '720p'; // Bump from 540p to 720p
      } else if (this.connectionQuality === 'medium' || this.connectionQuality === 'high') {
        targetQuality = '1080p'; // Go to max quality for better zoom
      }
    } else {
      // In landscape, use the connection-based quality
      if (this.connectionQuality === 'high') {
        targetQuality = '1080p';
      } else if (this.connectionQuality === 'medium') {
        targetQuality = '720p';
      } else {
        targetQuality = '540p';
      }
    }
    
    // Only update if quality needs to change
    if (player && targetQuality) {
      console.log(`Adjusting quality for ${isPortrait ? 'portrait' : 'landscape'} mode to: ${targetQuality}`);
      player.setQuality(targetQuality);
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
    // Create iframe for background video
    const iframe = document.createElement('iframe');
    iframe.className = 'video-player__background';
    iframe.id = `video-player-background-${this.videoId}`;
    iframe.src = `https://player.vimeo.com/video/${this.videoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1&autopause=0&transparent=0&dnt=1`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    
    // Initialize Vimeo player if API is loaded
    if (window.Vimeo && window.Vimeo.Player) {
      // We'll initialize the player after it's added to the DOM
      setTimeout(() => {
        try {
          this.backgroundPlayer = new window.Vimeo.Player(iframe);
          this.backgroundPlayer.setVolume(0); // Ensure it's muted
          this.backgroundPlayer.setLoop(true); // Ensure it loops
          
          // Set quality based on connection speed
          this.setQualityBasedOnConnection(this.backgroundPlayer);
          
          // After setting base quality, check if we need to adjust based on viewport
          const isPortrait = this.offsetWidth < this.offsetHeight || 
                            (this.offsetWidth / this.offsetHeight) < 1;
          
          // If we're in portrait mode initially, bump up quality
          if (isPortrait) {
            setTimeout(() => {
              this.adjustQualityForViewport(this.backgroundPlayer, isPortrait);
            }, 500); // Allow time for connection quality to be set first
          }
          
          console.log('Background player initialized');
        } catch (e) {
          console.error('Failed to initialize Vimeo player:', e);
        }
      }, 0);
    }
    
    const elements = [iframe];
    
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
    
    // Create a new iframe for the lightbox without stopping the background video
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = `https://player.vimeo.com/video/${this.videoId}?autoplay=1&byline=0&title=0&autopause=0`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    
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
          
          // Always use highest quality for lightbox
          // Lightbox is fullscreen/larger, so we want best quality regardless of connection
          this.lightboxPlayer.setQuality('1080p');
          
          // Add event listeners to handle background video
          this.lightboxPlayer.on('play', () => {
            // Ensure background video keeps playing when lightbox video plays
            if (this.backgroundPlayer) {
              this.backgroundPlayer.play();
            }
          });
        } catch (e) {
          console.error('Failed to initialize lightbox player:', e);
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

  setQualityBasedOnConnection(player) {
    try {
      // Check if Network Information API is available
      if (navigator.connection) {
        const connection = navigator.connection;
        
        // Add event listener for connection changes
        connection.addEventListener('change', () => {
          this.updateQualityForConnection(player, connection);
        });
        
        // Set initial quality
        this.updateQualityForConnection(player, connection);
      } else {
        // Fallback for browsers without Network Information API
        this.checkConnectionSpeedWithRequest(player);
      }
    } catch (error) {
      console.warn('Error setting quality based on connection:', error);
      // Default to 720p if anything fails
      player.setQuality('720p');
    }
  }
  
  updateQualityForConnection(player, connection) {
    // effectiveType values: 'slow-2g', '2g', '3g', or '4g'
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink; // Mbps
    
    console.log(`Connection type: ${effectiveType}, speed: ${downlink} Mbps`);
    
    if (effectiveType === '4g' && downlink > 5) {
      player.setQuality('1080p');
      this.connectionQuality = 'high';
    } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 2)) {
      player.setQuality('720p');
      this.connectionQuality = 'medium';
    } else {
      player.setQuality('540p');
      this.connectionQuality = 'low';
    }
    
    console.log(`Video quality set to: ${this.connectionQuality}`);
  }
  
  checkConnectionSpeedWithRequest(player) {
    // Measure connection speed with a small sample download
    const startTime = new Date().getTime();
    const url = 'https://www.google.com/images/phd/px.gif'; // Tiny image for testing
    
    fetch(url, { cache: 'no-store' })
      .then(response => response.blob())
      .then(data => {
        const endTime = new Date().getTime();
        const duration = (endTime - startTime) / 1000; // seconds
        const bitsLoaded = data.size * 8;
        const speedBps = bitsLoaded / duration;
        const speedMbps = speedBps / 1000000;
        
        console.log(`Measured connection speed: ${speedMbps.toFixed(2)} Mbps`);
        
        // Set quality based on measured speed
        if (speedMbps > 5) {
          player.setQuality('1080p');
          this.connectionQuality = 'high';
        } else if (speedMbps > 2) {
          player.setQuality('720p');
          this.connectionQuality = 'medium';
        } else {
          player.setQuality('540p');
          this.connectionQuality = 'low';
        }
        
        console.log(`Video quality set to: ${this.connectionQuality}`);
      })
      .catch(error => {
        console.warn('Error measuring connection speed:', error);
        // Default to 720p
        player.setQuality('720p');
        this.connectionQuality = 'medium';
      });
  }
}

// Register custom element
customElements.define('video-player', VideoPlayer); 