/**
 * Main Application Entry Point
 * 
 * This is the primary entry point for the application.
 * It initializes all components and sets up global functionality.
 */

// Import styles
import './main.css';

// Import components
import { VideoPlayer } from './components/video-player/VideoPlayer';
import { LogoSlider } from './components/logo-slider';
import { Navbar } from './components/navbar';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlayer();
    new LogoSlider();
    new Navbar();
});