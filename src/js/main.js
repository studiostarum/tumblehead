import { initNavbar } from './modules/navbar';
import { initCustomScrollbar } from './modules/custom-scrollbar';
import { initHeroScrollReveal } from './modules/hero-scroll-reveal';
import { initLogoCarousel } from './modules/logo-carousel';
import { initVideoLightbox } from './modules/video-lightbox';
import { createIcons, Play } from 'lucide';
import { setupFinsweetVideoIntegration } from './videoUtils';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    initNavbar();
    initCustomScrollbar();
    initHeroScrollReveal();
    initLogoCarousel();
    
    // Initialize Lucide icons first
    createIcons({
        icons: {
            Play
        }
    });
    
    // Then initialize video lightbox
    initVideoLightbox();

    // Initialize video handling with Finsweet integration
    setupFinsweetVideoIntegration();
}); 