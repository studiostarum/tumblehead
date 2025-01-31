import { throttle } from './utils.js';
import '../../styles/navbar.css';

/**
 * Navbar controller class
 */
class NavbarController {
    constructor() {
        this.navbar = document.querySelector('[data-element="navbar"]');
        this.heroSection = document.querySelector('[data-section="hero"]');
        this.isNavbarVisible = false;
        this.handleScroll = throttle(this._handleScroll.bind(this), 100);
        this.scrollThreshold = 100; // Pixels to scroll before showing navbar
    }

    /**
     * Initialize the navbar controller
     */
    init() {
        if (!this.navbar) {
            console.error('Navbar element not found');
            return;
        }

        // Set initial state
        this.navbar.setAttribute('data-state', 'hidden');

        // If no hero section, show navbar after a small delay
        if (!this.heroSection) {
            setTimeout(() => {
                this.navbar.setAttribute('data-state', 'visible');
            }, 500);
            return;
        }

        // Initial check for pages with hero section
        this._handleScroll();
        
        // Add scroll listener only for pages with hero section
        window.addEventListener('scroll', this.handleScroll, { passive: true });
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.heroSection) {
            window.removeEventListener('scroll', this.handleScroll);
        }
    }

    /**
     * Handle scroll event to show/hide navbar
     * @private
     */
    _handleScroll() {
        if (!this.heroSection) {
            this.navbar?.setAttribute('data-state', 'visible');
            return;
        }

        const heroRect = this.heroSection.getBoundingClientRect();
        const scrollPosition = window.scrollY;
        const shouldShowNavbar = heroRect.bottom <= this.scrollThreshold;

        if (shouldShowNavbar && !this.isNavbarVisible) {
            this.navbar.setAttribute('data-state', 'visible');
            this.isNavbarVisible = true;
        } else if (!shouldShowNavbar && this.isNavbarVisible) {
            this.navbar.setAttribute('data-state', 'hidden');
            this.isNavbarVisible = false;
        }
    }
}

export const initNavbar = () => {
    const navbarController = new NavbarController();
    navbarController.init();
    return navbarController;
}; 