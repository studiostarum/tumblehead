import { initNavbar } from './modules/navbar';
import { initCustomScrollbar } from './modules/custom-scrollbar';
import { initHeroScrollReveal } from './modules/hero-scroll-reveal';
import { initAwardsScroll } from './modules/awards-scroll';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    initNavbar();
    initCustomScrollbar();
    initHeroScrollReveal();
    initAwardsScroll();
}); 