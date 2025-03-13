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
import { setupFinsweetVideoIntegration } from './utils/video';

// Import third-party dependencies
import { createIcons, Play } from 'lucide';

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing modules...');
    
    // Initialize Lucide icons first
    createIcons({
        icons: {
            Play
        }
    });
    
    // Initialize UI components
    initNavbar();
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