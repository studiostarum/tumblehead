import { throttle } from './utils.js';
import '../../styles/navbar.css';

/**
 * Navbar visibility controller class
 */
class NavbarController {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.heroSection = document.querySelector('.section-hero-a');
        this.isNavbarVisible = false;
        this.handleScroll = throttle(this._handleScroll.bind(this), 100);
    }

    /**
     * Initialize the navbar controller
     */
    init() {
        if (!this.navbar) {
            console.error('Navbar element not found');
            return;
        }

        // Initial check
        this._handleScroll();
        
        // Add scroll listener
        window.addEventListener('scroll', this.handleScroll, { passive: true });
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        window.removeEventListener('scroll', this.handleScroll);
    }

    /**
     * Handle scroll event to show/hide navbar
     * @private
     */
    _handleScroll() {
        if (!this.heroSection) {
            console.warn('Hero section not found. Navbar will remain visible.');
            this.navbar?.classList.add('visible');
            return;
        }

        const heroBottom = this.heroSection.getBoundingClientRect().bottom;
        const shouldShowNavbar = heroBottom <= 0;

        if (shouldShowNavbar && !this.isNavbarVisible) {
            this.navbar.classList.add('visible');
            this.isNavbarVisible = true;
        } else if (!shouldShowNavbar && this.isNavbarVisible) {
            this.navbar.classList.remove('visible');
            this.isNavbarVisible = false;
        }
    }
}

export const initNavbar = () => {
    const navbarController = new NavbarController();
    navbarController.init();
    return navbarController;
}; 