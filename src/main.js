import { LogoSlider } from './components/logo-slider';
import { Navbar } from './components/navbar';
import { VideoPlayer } from './components/video-player';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LogoSlider();
    new Navbar();
    new VideoPlayer();
});
