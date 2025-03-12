/**
 * DOM Utility Functions
 * 
 * Helper functions for common DOM operations.
 */

/**
 * Find the video container for a video element
 * @param {HTMLVideoElement} video The video element
 * @returns {HTMLElement|null} The container element or null if not found
 */
export function findVideoContainer(video) {
  let element = video.parentElement;
  
  // Look for video-inner first
  while (element && !element.classList.contains('video-inner')) {
    element = element.parentElement;
  }
  
  // If found video-inner, get its parent video-container
  if (element && element.classList.contains('video-inner')) {
    return element.parentElement;
  }
  
  // If not found, look for video-container directly
  element = video.parentElement;
  while (element && !element.classList.contains('video-container')) {
    element = element.parentElement;
  }
  
  return element;
}

/**
 * Create an element with attributes and content
 * @param {string} tag The HTML tag to create
 * @param {Object} attributes Attributes to set on the element
 * @param {string|HTMLElement} content Content to append (string or element)
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, attributes = {}, content = null) {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  // Add content
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else {
      element.appendChild(content);
    }
  }
  
  return element;
}

/**
 * Toggle class on an element
 * @param {HTMLElement} element Element to toggle class on
 * @param {string} className Class to toggle
 * @param {boolean} force Force add or remove
 * @returns {boolean} Current state of class (true = added, false = removed)
 */
export function toggleClass(element, className, force) {
  if (force === true) {
    element.classList.add(className);
    return true;
  } else if (force === false) {
    element.classList.remove(className);
    return false;
  } else {
    return element.classList.toggle(className);
  }
}

/**
 * Check if an element is visible in viewport
 * @param {HTMLElement} element Element to check
 * @param {number} offset Offset from viewport edges
 * @returns {boolean} Whether element is visible
 */
export function isElementInViewport(element, offset = 0) {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Add event listener with automatic cleanup
 * @param {HTMLElement} element Element to attach event to
 * @param {string} eventType Event type (e.g., 'click')
 * @param {Function} handler Event handler function
 * @param {Object} options Event listener options
 * @returns {Function} Cleanup function to remove the listener
 */
export function addEventListenerWithCleanup(element, eventType, handler, options = {}) {
  element.addEventListener(eventType, handler, options);
  
  return function cleanup() {
    element.removeEventListener(eventType, handler, options);
  };
} 