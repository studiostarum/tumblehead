/**
 * Hero Scroll Reveal
 * 
 * This script handles the reveal of work-item-content when it scrolls past
 * the hero-multiply container.
 */

export function initHeroScrollReveal() {
  // Get the elements we need to work with
  const heroMultiply = document.querySelector('.hero-multiply');
  const workItemContent = document.querySelector('.work-item-content');
  
  // If either element doesn't exist, exit early
  if (!heroMultiply || !workItemContent) {
    console.warn('Required elements for hero scroll reveal not found');
    return;
  }
  
  // Initially hide the work-item-content
  workItemContent.style.opacity = '0';
  workItemContent.style.transition = 'opacity 0.5s ease-in-out';
  
  // Create an Intersection Observer to detect when workItemContent passes heroMultiply
  const observerOptions = {
    root: null, // Use the viewport as the root
    rootMargin: '0px', // No margin
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] // Multiple thresholds for smoother detection
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Get the bottom position of the hero-multiply element
      const heroMultiplyBottom = heroMultiply.getBoundingClientRect().bottom;
      
      // Get the top position of the work-item-content
      const workItemContentTop = entry.boundingClientRect.top;
      
      // If the work-item-content has passed the bottom of hero-multiply
      if (workItemContentTop <= heroMultiplyBottom) {
        // Calculate how far past the threshold we are (0 to 1)
        const passedRatio = Math.min(1, (heroMultiplyBottom - workItemContentTop) / 100);
        
        // Apply opacity based on how far it has passed
        workItemContent.style.opacity = Math.min(1, passedRatio);
      } else {
        // Hide the content when it's above the threshold
        workItemContent.style.opacity = '0';
      }
    });
  }, observerOptions);
  
  // Start observing the work-item-content
  observer.observe(workItemContent);
  
  // Clean up the observer when the page is unloaded
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });
} 