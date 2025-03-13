export function initHeroScrollReveal() {
  const trigger = document.querySelector('[data-scroll-trigger]');
  const elementsToShow = document.querySelectorAll('[data-scroll-reveal]');
  
  if (!trigger || elementsToShow.length === 0) return;
  
  // Add a CSS class instead of inline styles for better specificity
  const style = document.createElement('style');
  style.textContent = `
    [data-scroll-reveal] {
      opacity: 0;
      visibility: hidden;
      transition: none;
    }
    .scroll-hidden {
      opacity: 0 !important;
      visibility: hidden !important;
    }
    .scroll-visible {
      opacity: 1 !important;
      visibility: visible !important;
    }
    .scroll-animated {
      transition: opacity 0.5s ease-in-out, visibility 0.5s ease-in-out;
    }
  `;
  document.head.appendChild(style);
  
  // Initially hide all elements
  elementsToShow.forEach(element => {
    element.classList.add('scroll-hidden');
  });
  
  // Throttle function to limit the number of scroll event executions
  function throttle(callback, delay) {
    let previousCall = 0;
    return function() {
      const now = new Date().getTime();
      if (now - previousCall >= delay) {
        previousCall = now;
        callback.apply(this, arguments);
      }
    };
  }
  
  // Check if elements have passed the trigger point
  function checkScrollPosition() {
    const triggerRect = trigger.getBoundingClientRect();
    
    elementsToShow.forEach(element => {
      // Add transition class after initial state
      element.classList.add('scroll-animated');
      
      const elementRect = element.getBoundingClientRect();
      
      // Show elements when they are below the trigger's bottom edge
      if (elementRect.top >= triggerRect.bottom) {
        element.classList.remove('scroll-hidden');
        element.classList.add('scroll-visible');
      } else {
        element.classList.add('scroll-hidden');
        element.classList.remove('scroll-visible');
      }
    });
  }
  
  // Run immediately to ensure correct initial state
  requestAnimationFrame(() => {
    checkScrollPosition();
  });
  
  // Add throttled scroll event listener
  window.addEventListener('scroll', throttle(checkScrollPosition, 100));
}
