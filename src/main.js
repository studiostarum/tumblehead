import { Navbar } from './components/navbar';
import { VideoPlayer } from './components/video-player';
import { LogoSlider } from './components/logo-slider';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Navbar();
    new VideoPlayer();
    new LogoSlider();
});
