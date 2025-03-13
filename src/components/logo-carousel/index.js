/**
 * Initialize logo carousel with dynamic content duplication
 * @param {HTMLElement} [customCarousel] - Optional custom carousel element
 * @param {Object} [config] - Optional configuration object
 * @param {number} [config.minLogosVisible=4] - Minimum number of logos visible
 * @param {number} [config.viewportCoverage=3] - How many times viewport should be covered
 * @param {number} [config.speedFactor=0.02] - Animation speed factor (seconds per pixel)
 */
export function initLogoCarousel(customCarousel = null, config = {}) {
  const {
    minLogosVisible = 4,
    viewportCoverage = 3,
    speedFactor = 0.02
  } = config;

  const carousel = customCarousel || document.querySelector('[data-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('[data-carousel-track]');
  if (!track) return;

  // Calculate how many times we need to clone to fill viewport
  const viewportWidth = window.innerWidth;
  const trackWidth = track.scrollWidth;
  const numCopies = Math.ceil((viewportWidth * viewportCoverage) / trackWidth);

  // Clone items
  const originalContent = track.innerHTML;
  let newContent = originalContent;
  for (let i = 0; i < numCopies; i++) {
      newContent += originalContent;
  }
  track.innerHTML = newContent;

  // Recalculate animation duration based on content length
  const totalWidth = track.scrollWidth;
  const duration = totalWidth * speedFactor;
  track.style.animationDuration = `${duration}s`;
}