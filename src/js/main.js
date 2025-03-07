import { initNavbar } from './modules/navbar';
import { initCustomScrollbar } from './modules/custom-scrollbar';
import { initHeroScrollReveal } from './modules/hero-scroll-reveal';
import { initLogoCarousel } from './modules/logo-carousel';
import { initVideoLightbox } from './modules/video-lightbox';
import { initFilterSystem } from './modules/filter-system';
import { createIcons, Play } from 'lucide';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    initNavbar();
    initCustomScrollbar();
    initHeroScrollReveal();
    initLogoCarousel();
    initFilterSystem();
    
    // Initialize Lucide icons first
    createIcons({
        icons: {
            Play
        }
    });
    
    // Then initialize video lightbox
    initVideoLightbox();
}); 