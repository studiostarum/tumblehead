/**
 * Main Application Entry Point
 * 
 * This is the primary entry point for the application.
 * It initializes all components and sets up global functionality.
 */

// Import main CSS file
import './styles/main.css';

// Import Webflow integration
import './components/video-player/plyr';

// Import components
import { initNavbar } from './components/navbar';
import { initVideoPlayer } from './components/video-player';
import { initHeroScrollReveal } from './components/hero/scroll-reveal';
import { initLogoCarousel } from './components/logo-carousel';

// Import utilities
import { initCustomScrollbar } from './utils/scroll';
import { setupFinsweetVideoIntegration } from './utils/video';

// Import third-party dependencies
import { createIcons, Play } from 'lucide';

/**
 * Lock screen orientation to portrait on mobile devices
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
    
    // Initialize Lucide icons first
    createIcons({
        icons: {
            Play
        }
    });
    
    // Initialize UI components
    initNavbar();
    initCustomScrollbar();
    initHeroScrollReveal();
    
    // Initialize logo carousel with custom config (optional)
    initLogoCarousel();
    
    // Initialize video components
    initVideoPlayer();
    setupFinsweetVideoIntegration();
});

// Handle window resize
window.addEventListener('resize', () => {
    // No need to call initLogoCarousel() here as we're using ResizeObserver
}, { passive: true });

// Export for external use
export default {
    lockScreenOrientation
}; 