/**
 * Hero Scroll Reveal
 * 
 * This script handles the reveal of work-item-content after it passes
 * below the hero-multiply container and shows the navbar at the same time.
 */

export function initHeroScrollReveal() {
  // Get the elements we need to work with
  const heroMultiply = document.querySelector('.hero-multiply');
  const workItemContents = document.querySelectorAll('.work-item-content');
  const navbar = document.querySelector('[data-element="navbar"]');
  
  // If hero-multiply doesn't exist, exit early
  if (!heroMultiply || workItemContents.length === 0) {
    console.warn('Required elements for hero scroll reveal not found');
    return;
  }
  
  // Force hide all work-item-content elements initially with inline style
  workItemContents.forEach(content => {
    content.style.opacity = '0';
    content.style.transition = 'opacity 0.3s ease-out'; // Faster transition for snappier reveal
  });
  
  // Function to update visibility based on scroll position
  function updateVisibility() {
    // Get the bottom position of the hero-multiply element
    const heroMultiplyBottom = heroMultiply.getBoundingClientRect().bottom;
    
    workItemContents.forEach(workItemContent => {
      // Get the top position of the work-item-content
      const workItemContentTop = workItemContent.getBoundingClientRect().top;
      
      // Only show content when it has passed BELOW the hero-multiply section
      // This means the top of the content is GREATER than the bottom of hero-multiply
      if (workItemContentTop > heroMultiplyBottom) {
        workItemContent.style.opacity = '1';
      } else {
        workItemContent.style.opacity = '0';
      }
    });
    
    // Also handle navbar visibility - show navbar when we've scrolled past the hero multiply section
    if (navbar) {
      if (window.scrollY > heroMultiply.offsetTop) {
        navbar.style.display = 'block';
        // Force a reflow
        navbar.offsetHeight;
        navbar.setAttribute('data-state', 'visible');
      } else {
        navbar.setAttribute('data-state', 'hidden');
        setTimeout(() => {
          if (navbar.getAttribute('data-state') === 'hidden') {
            navbar.style.display = 'none';
          }
        }, 300); // Longer timeout to allow for transition
      }
    }
  }
  
  // Initial check
  updateVisibility();
  
  // Handle scroll events
  window.addEventListener('scroll', updateVisibility, { passive: true });
  
  // Clean up when the page is unloaded
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('scroll', updateVisibility);
  });
} 