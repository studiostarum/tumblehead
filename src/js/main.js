import { initNavbar } from './modules/navbar';
import { initCustomScrollbar } from './modules/custom-scrollbar';
import { initHeroScrollReveal } from './modules/hero-scroll-reveal';
import { initAwardsScroll } from './modules/awards-scroll';
import { initVideoLightbox } from './modules/video-lightbox';
import { createIcons, Play } from 'lucide';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    initNavbar();
    initCustomScrollbar();
    initHeroScrollReveal();
    initAwardsScroll();
    
    // Initialize Lucide icons first
    createIcons({
        icons: {
            Play
        }
    });
    
    // Then initialize video lightbox
    initVideoLightbox();
}); 