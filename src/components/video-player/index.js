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
          
          // Set quality to force higher resolution
          this.backgroundPlayer.setQuality('1080p');
          
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
}

// Register custom element
customElements.define('video-player', VideoPlayer); 