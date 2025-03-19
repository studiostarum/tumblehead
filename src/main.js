/**
 * Main Application Entry Point
 * 
 * This is the primary entry point for the application.
 * It initializes all components and sets up global functionality.
 */

// Import styles
import './main.css';

// Import video player component
import { VideoPlayer } from './components/video-player/VideoPlayer';

// Import logo slider component
import { LogoSlider } from './components/logo-slider';

// Initialize video player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlayer();
    new LogoSlider();
});