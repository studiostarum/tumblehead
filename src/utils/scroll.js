/**
 * Scroll Utilities
 * 
 * Includes custom scrollbar functionality and scroll-related helpers.
 */

/**
 * Initialize custom scrollbar
 */
export function initCustomScrollbar() {
  const scrollbarElements = document.querySelectorAll('[data-custom-scrollbar]');
  if (!scrollbarElements.length) return;
  
  scrollbarElements.forEach(element => {
    // Create scrollbar container
    const scrollbarContainer = document.createElement('div');
    scrollbarContainer.className = 'custom-scrollbar-container';
    
    // Create scrollbar track
    const scrollbarTrack = document.createElement('div');
    scrollbarTrack.className = 'custom-scrollbar-track';
    
    // Create scrollbar thumb
    const scrollbarThumb = document.createElement('div');
    scrollbarThumb.className = 'custom-scrollbar-thumb';
    
    // Append elements
    scrollbarTrack.appendChild(scrollbarThumb);
    scrollbarContainer.appendChild(scrollbarTrack);
    element.appendChild(scrollbarContainer);
    
    // Store references
    element.scrollbarThumb = scrollbarThumb;
    element.scrollbarTrack = scrollbarTrack;
    
    // Add CSS
    addScrollbarStyles();
    
    // Update scrollbar on scroll
    element.addEventListener('scroll', () => {
      updateScrollbar(element);
    });
    
    // Initial update
    updateScrollbar(element);
    
    // Handle resize
    window.addEventListener('resize', () => {
      updateScrollbar(element);
    });
  });
}

/**
 * Update scrollbar position and size
 * @param {HTMLElement} element Container element
 */
function updateScrollbar(element) {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const thumbHeight = (clientHeight / scrollHeight) * clientHeight;
  const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight);
  
  // Update thumb height and position
  element.scrollbarThumb.style.height = `${thumbHeight}px`;
  element.scrollbarThumb.style.transform = `translateY(${thumbTop}px)`;
  
  // Show/hide scrollbar based on content
  if (scrollHeight <= clientHeight) {
    element.scrollbarTrack.style.display = 'none';
  } else {
    element.scrollbarTrack.style.display = 'block';
  }
}

/**
 * Add scrollbar styles to document if not present
 */
function addScrollbarStyles() {
  // Check if styles already exist
  if (document.getElementById('custom-scrollbar-styles')) return;
  
  // Create style element
  const style = document.createElement('style');
  style.id = 'custom-scrollbar-styles';
  style.textContent = `
    [data-custom-scrollbar] {
      position: relative;
      overflow: auto;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }
    
    [data-custom-scrollbar]::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }
    
    .custom-scrollbar-container {
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      width: 10px;
      pointer-events: none;
    }
    
    .custom-scrollbar-track {
      position: absolute;
      top: 2px;
      right: 2px;
      bottom: 2px;
      width: 6px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
    }
    
    .custom-scrollbar-thumb {
      position: absolute;
      width: 6px;
      background-color: rgba(0, 0, 0, 0.4);
      border-radius: 3px;
      transition: background-color 0.3s ease;
    }
    
    [data-custom-scrollbar]:hover .custom-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.6);
    }
  `;
  
  // Add to document
  document.head.appendChild(style);
}

/**
 * Scroll to element with smooth animation
 * @param {HTMLElement} element Target element to scroll to
 * @param {Object} options Scroll options
 */
export function scrollToElement(element, options = {}) {
  if (!element) return;
  
  const defaults = {
    offset: 0,
    duration: 500,
    easing: 'easeInOutQuad',
    container: window
  };
  
  const config = { ...defaults, ...options };
  const container = config.container;
  const start = container === window ? window.pageYOffset : container.scrollTop;
  const targetPosition = element.getBoundingClientRect().top + start + config.offset;
  
  scrollTo(container, targetPosition, config.duration, config.easing);
}

/**
 * Scroll to position with animation
 * @param {Window|HTMLElement} container Scrollable container
 * @param {number} targetPosition Target scroll position
 * @param {number} duration Animation duration in milliseconds
 * @param {string} easing Easing function name
 */
function scrollTo(container, targetPosition, duration = 500, easing = 'easeInOutQuad') {
  const start = container === window ? window.pageYOffset : container.scrollTop;
  const change = targetPosition - start;
  const increment = 20;
  let currentTime = 0;
  
  const easings = {
    linear: t => t,
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  };
  
  const animateScroll = () => {
    currentTime += increment;
    const val = easings[easing](currentTime / duration);
    const position = start + change * val;
    
    if (container === window) {
      window.scrollTo(0, position);
    } else {
      container.scrollTop = position;
    }
    
    if (currentTime < duration) {
      setTimeout(animateScroll, increment);
    }
  };
  
  animateScroll();
}

// Export for external use
export default {
  initCustomScrollbar,
  scrollToElement
}; 