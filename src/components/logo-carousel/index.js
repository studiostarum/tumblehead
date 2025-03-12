/**
 * Logo Carousel Component
 * 
 * A responsive and interactive logo carousel for showcasing partners or clients.
 */

import './styles.css';

// Configuration
const CONFIG = {
  scrollSpeed: 1.5,      // Scroll speed in pixels per frame
  pauseOnHover: true,    // Pause scrolling when mouse hovers over carousel
  touchEnabled: true,    // Enable touch events for mobile
  autoScroll: true,      // Auto-scroll by default
  scrollDelay: 20        // Milliseconds between scroll frames
};

// Track instances for cleanup
const carousels = [];

/**
 * Create a logo carousel from a container element
 * @param {HTMLElement} container The carousel container element
 */
function createLogoCarousel(container) {
  if (!container) return null;
  
  const trackOuter = container.querySelector('.logo-carousel-track-outer');
  const track = container.querySelector('.logo-carousel-track');
  
  if (!trackOuter || !track) return null;
  
  // Clone enough slides to ensure continuous scrolling
  const originalWidth = track.scrollWidth;
  const slides = Array.from(track.children);
  
  if (slides.length < 2) return null;
  
  // Create copies for seamless scrolling
  const clones = slides.map(slide => slide.cloneNode(true));
  clones.forEach(clone => track.appendChild(clone));
  
  // Store instance data
  const instance = {
    container,
    trackOuter,
    track,
    scrollLeft: 0,
    isHovered: false,
    isPaused: false,
    originalWidth,
    animationId: null,
    slides
  };
  
  // Setup event listeners
  if (CONFIG.pauseOnHover) {
    container.addEventListener('mouseenter', () => {
      instance.isHovered = true;
    });
    
    container.addEventListener('mouseleave', () => {
      instance.isHovered = false;
    });
  }
  
  if (CONFIG.touchEnabled) {
    let startX, startScrollLeft, isDragging = false;
    
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startScrollLeft = instance.scrollLeft;
      isDragging = true;
      instance.isPaused = true;
    }, { passive: true });
    
    track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const x = e.touches[0].clientX;
      const moveX = x - startX;
      instance.scrollLeft = startScrollLeft - moveX;
      updateScroll(instance);
    }, { passive: true });
    
    const endDrag = () => {
      isDragging = false;
      setTimeout(() => {
        instance.isPaused = false;
      }, 100);
    };
    
    track.addEventListener('touchend', endDrag, { passive: true });
    track.addEventListener('touchcancel', endDrag, { passive: true });
  }
  
  // Start animation
  startScrolling(instance);
  
  // Store for cleanup
  carousels.push(instance);
  
  return instance;
}

/**
 * Start the scrolling animation
 * @param {Object} instance The carousel instance
 */
function startScrolling(instance) {
  if (!instance) return;
  
  // Cancel any existing animation
  if (instance.animationId) {
    cancelAnimationFrame(instance.animationId);
  }
  
  // Animation function
  const animate = () => {
    // Only scroll if not paused and not hovered
    if (CONFIG.autoScroll && !instance.isPaused && !(CONFIG.pauseOnHover && instance.isHovered)) {
      instance.scrollLeft += CONFIG.scrollSpeed;
      
      // Reset scroll to create seamless loop
      if (instance.scrollLeft >= instance.originalWidth) {
        instance.scrollLeft = 0;
      }
      
      updateScroll(instance);
    }
    
    // Continue animation
    instance.animationId = requestAnimationFrame(animate);
  };
  
  // Start animation
  instance.animationId = requestAnimationFrame(animate);
}

/**
 * Update the scroll position of a carousel
 * @param {Object} instance The carousel instance
 */
function updateScroll(instance) {
  if (!instance || !instance.track) return;
  
  // Apply the scroll position to the track
  instance.track.style.transform = `translateX(-${instance.scrollLeft}px)`;
}

/**
 * Stop animation for a carousel instance
 * @param {Object} instance The carousel instance
 */
function stopScrolling(instance) {
  if (!instance || !instance.animationId) return;
  
  cancelAnimationFrame(instance.animationId);
  instance.animationId = null;
}

/**
 * Initialize logo carousels
 */
export function initLogoCarousel() {
  // Find all logo carousel containers
  const containers = document.querySelectorAll('.logo-carousel');
  
  // Initialize each carousel
  containers.forEach(container => {
    createLogoCarousel(container);
  });
  
  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    carousels.forEach(instance => {
      stopScrolling(instance);
    });
  });
}

// Export for external use
export default { 
  init: initLogoCarousel 
}; 