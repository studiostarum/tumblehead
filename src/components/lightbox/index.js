export class Lightbox {
  constructor() {
    this.lightbox = null;
    this.content = null;
    this.closeButton = null;
    this.isActive = false;
    this.contentIframes = [];
    
    this.createLightbox();
  }

  createLightbox() {
    // Create lightbox elements
    this.lightbox = document.createElement('div');
    this.lightbox.className = 'lightbox';
    
    this.content = document.createElement('div');
    this.content.className = 'lightbox-content';
    
    this.closeButton = document.createElement('button');
    this.closeButton.className = 'lightbox-close';
    this.closeButton.setAttribute('aria-label', 'Close');
    
    // Append elements
    this.content.appendChild(this.closeButton);
    this.lightbox.appendChild(this.content);
    document.body.appendChild(this.lightbox);
    
    this.setupListeners();
  }

  setupListeners() {
    // Close button event
    this.closeButton.addEventListener('click', () => this.close());
    
    // Close on background click
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) {
        this.close();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.close();
      }
    });
  }

  setContent(content) {
    // Clear existing content except close button
    while (this.content.firstChild) {
      if (this.content.firstChild !== this.closeButton) {
        this.content.removeChild(this.content.firstChild);
      } else {
        break;
      }
    }
    
    // Reset iframes array
    this.contentIframes = [];
    
    // Add new content
    if (typeof content === 'string') {
      this.content.insertAdjacentHTML('afterbegin', content);
    } else if (content instanceof HTMLElement) {
      this.content.insertBefore(content, this.closeButton);
      
      // Store references to any iframes
      if (content.tagName === 'IFRAME') {
        this.contentIframes.push(content);
      } else {
        const iframes = content.querySelectorAll('iframe');
        if (iframes.length > 0) {
          this.contentIframes = Array.from(iframes);
        }
      }
    }
  }

  open() {
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    this.lightbox.classList.add('active');
    this.isActive = true;
  }

  close() {
    document.body.style.overflow = ''; // Restore scrolling
    this.lightbox.classList.remove('active');
    this.isActive = false;
    
    // Only remove iframes that were added to the lightbox content
    // This prevents affecting background videos outside the lightbox
    this.contentIframes.forEach(iframe => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    });
    
    // Clear the iframe references
    this.contentIframes = [];
  }
} 