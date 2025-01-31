import { throttle } from './utils.js';
import '../../styles/navbar.css';

/**
 * Navbar controller class
 */
class NavbarController {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.heroSection = document.querySelector('[data-hero]');
        this.menuButton = document.querySelector('.menu-button');
        this.navMenu = document.querySelector('.nav-menu-wrapper');
        this.isNavbarVisible = false;
        this.isMenuOpen = false;
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

        // Initialize menu button click handler
        this._initMenuButton();

        // If no hero section, always show navbar
        if (!this.heroSection) {
            this.navbar.setAttribute('data-state', 'visible');
            return;
        }

        // Initial check for pages with hero section
        this._handleScroll();
        
        // Add scroll listener only for pages with hero section
        window.addEventListener('scroll', this.handleScroll, { passive: true });
    }

    /**
     * Initialize menu button functionality
     * @private
     */
    _initMenuButton() {
        if (!this.menuButton || !this.navMenu) return;

        this.menuButton.addEventListener('click', () => {
            this.isMenuOpen = !this.isMenuOpen;
            this.navMenu.style.display = this.isMenuOpen ? 'flex' : 'none';
            this.navMenu.style.opacity = this.isMenuOpen ? '1' : '0';
            
            // Add rotation animation to the menu button
            this.menuButton.style.transform = this.isMenuOpen 
                ? 'rotate(45deg)' 
                : 'rotate(0deg)';
        });
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.heroSection) {
            window.removeEventListener('scroll', this.handleScroll);
        }
        if (this.menuButton) {
            this.menuButton.removeEventListener('click', this._initMenuButton);
        }
    }

    /**
     * Handle scroll event to show/hide navbar
     * @private
     */
    _handleScroll() {
        if (!this.heroSection) {
            console.warn('Hero section not found. Navbar will remain visible.');
            this.navbar?.setAttribute('data-state', 'visible');
            return;
        }

        const heroBottom = this.heroSection.getBoundingClientRect().bottom;
        const shouldShowNavbar = heroBottom <= 0;

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