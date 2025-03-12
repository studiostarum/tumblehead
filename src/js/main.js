// Import main CSS file
import '../styles/main.css';

import { initNavbar } from './modules/navbar';
import { initCustomScrollbar } from './modules/custom-scrollbar';
import { initHeroScrollReveal } from './modules/hero-scroll-reveal';
import { initLogoCarousel } from './modules/logo-carousel';
import { initVideoLightbox } from './modules/video-lightbox';
import { createIcons, Play } from 'lucide';
import { setupFinsweetVideoIntegration } from './videoUtils';
import './webflow-plyr-embed'; // Import the Webflow Plyr embed module

/**
 * Lock screen orientation to portrait
 */
function lockScreenOrientation() {
    // Only apply on mobile devices
    if (window.matchMedia("(max-width: 768px)").matches) {
        try {
            // Try screen orientation API first
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('portrait').catch((err) => {
                    console.log('Orientation lock failed:', err);
                });
            }
            // Fallback for older browsers
            else if (screen.lockOrientation) {
                screen.lockOrientation('portrait');
            } else if (screen.mozLockOrientation) {
                screen.mozLockOrientation('portrait');
            } else if (screen.msLockOrientation) {
                screen.msLockOrientation('portrait');
            }
        } catch (err) {
            console.log('Screen orientation lock not supported');
        }
    }
}

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    
    // Lock screen orientation
    lockScreenOrientation();
    
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