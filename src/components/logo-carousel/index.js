/**
 * Initialize logo carousel with dynamic content duplication
 */
export function initLogoCarousel() {
  const track = document.querySelector('[data-carousel-track]');
  if (!track) return;

  // Configuration
  const BASE_DURATION = 0; // Base duration in seconds
  const ITEM_DURATION = 0.5; // Additional seconds per item

  function duplicateItems() {
    // Clear any existing animation
    track.style.animation = 'none';

    // Remove existing clones
    track.querySelectorAll('[data-carousel-item].clone').forEach(clone => clone.remove());

    // Get original items
    const items = track.querySelectorAll('[data-carousel-item]:not(.clone)');
    if (!items.length) return;

    // Calculate the width of one complete set of original items
    const originalSetWidth = track.scrollWidth;

    // Set this width as a CSS variable for the animation
    track.style.setProperty('--original-width', `${originalSetWidth}px`);

    // Calculate how many complete sets we need based on viewport width
    const viewportWidth = window.innerWidth;
    const sets = Math.max(2, Math.ceil((viewportWidth * 3) / originalSetWidth));

    // Clone items
    for (let i = 0; i < sets; i++) {
      items.forEach(item => {
        const clone = item.cloneNode(true);
        clone.classList.add('clone');
        track.appendChild(clone);
      });
    }

    // Force reflow
    track.offsetHeight;

    // Calculate animation duration based on number of items
    const totalItems = track.querySelectorAll('[data-carousel-item]').length;
    const duration = BASE_DURATION + (totalItems * ITEM_DURATION);

    // Restart animation with new duration
    track.style.animation = `scroll ${duration}s linear infinite`;
  }

  // Initial duplication
  duplicateItems();

  // Add resize observer to handle window resizing
  const resizeObserver = new ResizeObserver(() => {
    duplicateItems();
  });

  resizeObserver.observe(track);

  // Also handle window load event to ensure images are loaded
  window.addEventListener('load', duplicateItems, { once: true });
}