import { initNavbar } from './modules/navbar';
import { initVideoAutoplay } from './modules/videoAutoplay';

import '../styles/category-filters.css';
import '../styles/project-grid.css';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initVideoAutoplay();
}); 