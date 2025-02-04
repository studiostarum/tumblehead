import { initNavbar } from '@/js/modules/navbar';
import { initVideoAutoplay } from '@/js/modules/videoAutoplay';
import { initCustomScrollbar } from '@/js/modules/customScrollbar';

import '@/styles/category-filters.css';
import '@/styles/project-grid.css';
import '@/styles/navbar.css';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    initNavbar();
    initVideoAutoplay();
    initCustomScrollbar();
}); 