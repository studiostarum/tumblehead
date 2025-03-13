/**
 * Initialize logo carousel with dynamic content duplication
 */
export function initLogoCarousel() {
  const track = document.querySelector('[data-carousel-track]');
  if (!track) return;

  function duplicateItems() {
    // Remove existing clones
    track.querySelectorAll('[data-carousel-item].clone').forEach(clone => clone.remove());

    // Get original items
    const items = track.querySelectorAll('[data-carousel-item]:not(.clone)');
    if (!items.length) return;

    // Calculate how many sets we need to fill the viewport plus extra for smooth scroll
    const trackWidth = track.scrollWidth;
    const viewportWidth = window.innerWidth;
    const sets = Math.ceil((viewportWidth * 3) / trackWidth) + 1;

    // Clone items
    for (let i = 0; i < sets; i++) {
      items.forEach(item => {
        const clone = item.cloneNode(true);
        clone.classList.add('clone');
        track.appendChild(clone);
      });
    }

    // Reset animation
    track.style.animation = 'none';
    track.offsetHeight; // Force reflow
    track.style.animation = 'scroll 30s linear infinite';
  }

  // Initial duplication
  duplicateItems();

  // Add resize observer to handle window resizing
  const resizeObserver = new ResizeObserver(() => {
    duplicateItems();
  });

  resizeObserver.observe(track);
}