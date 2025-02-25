import { initNavbar } from './modules/navbar';
import { initVideoAutoplay } from './modules/videoAutoplay';
import { initCustomScrollbar } from './modules/customScrollbar';
import { initHeroScrollReveal } from './modules/hero-scroll-reveal';

import '../styles/category-filters.css';
import '../styles/project-grid.css';
import '../styles/logo-loop.css';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    initNavbar();
    initVideoAutoplay();
    initCustomScrollbar();
    initHeroScrollReveal();
}); 