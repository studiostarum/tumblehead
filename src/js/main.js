import { initNavbar } from './modules/navbar';
import { initCustomScrollbar } from './modules/customScrollbar';
import { initHeroScrollReveal } from './modules/hero-scroll-reveal';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    initNavbar();
    initCustomScrollbar();
    initHeroScrollReveal();
}); 