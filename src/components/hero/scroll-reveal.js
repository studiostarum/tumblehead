/**
 * Hero Scroll Reveal Component
 * 
 * Reveals elements with fade and slide animations as they enter the viewport during scrolling.
 */

import { isElementInViewport } from '../../utils/dom';

// Configuration
const CONFIG = {
  revealOffset: 150,      // Offset from viewport edge to trigger reveal (px)
  revealDelay: 100,       // Delay between revealing elements (ms)
  animationDuration: 800, // Animation duration (ms)
  throttleDelay: 100      // Throttle delay for scroll events (ms)
};

// Track revealed elements
const revealedElements = new Set();
let isScrolling = false;
let scrollTimeout = null;

/**
 * Initialize hero scroll reveal
 */
export function initHeroScrollReveal() {
  const heroElements = document.querySelectorAll('[data-scroll-reveal]');
  if (!heroElements.length) return;
  
  // Set initial state
  heroElements.forEach(element => {
    // Set initial styles
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = `opacity ${CONFIG.animationDuration}ms ease, transform ${CONFIG.animationDuration}ms ease`;
    
    // Check if element is already in viewport
    if (isElementInViewport(element, CONFIG.revealOffset)) {
      setTimeout(() => {
        revealElement(element);
      }, CONFIG.revealDelay);
    }
  });
  
  // Add scroll event listener
  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        checkElementsVisibility(heroElements);
        isScrolling = false;
      });
      
      isScrolling = true;
    }
  }, { passive: true });
  
  // Check visibility on resize
  window.addEventListener('resize', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      checkElementsVisibility(heroElements);
    }, CONFIG.throttleDelay);
  }, { passive: true });
}

/**
 * Check visibility of hero elements
 * @param {NodeList} elements Elements to check
 */
function checkElementsVisibility(elements) {
  elements.forEach(element => {
    if (revealedElements.has(element)) return;
    
    if (isElementInViewport(element, CONFIG.revealOffset)) {
      setTimeout(() => {
        revealElement(element);
      }, CONFIG.revealDelay);
    }
  });
}

/**
 * Reveal an element
 * @param {HTMLElement} element Element to reveal
 */
function revealElement(element) {
  if (revealedElements.has(element)) return;
  
  element.style.opacity = '1';
  element.style.transform = 'translateY(0)';
  revealedElements.add(element);
  
  // Add class for additional styling
  element.classList.add('revealed');
}

// Export for external use
export default {
  init: initHeroScrollReveal
}; 