import { VideoPlayer, Lightbox } from "@studiostarum/custom-vimeo-player";
import "@studiostarum/custom-vimeo-player/dist/custom-vimeo-player.css";
import '@studiostarum/custom-vimeo-player/dist/custom-vimeo-player.css';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Lightbox();
    new VideoPlayer();
    new LogoSlider();
    new Navbar();
});