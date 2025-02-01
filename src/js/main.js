import { initNavbar } from './modules/navbar';
import { initVideoAutoplay } from './modules/videoAutoplay';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initVideoAutoplay();
}); 