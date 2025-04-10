import { Navbar } from './components/navbar';
import { LogoSlider } from './components/logo-slider';
import { VideoPlayer } from './components/video-player';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Navbar();
    new LogoSlider();
    new VideoPlayer();
});
