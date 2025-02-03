import { throttle } from './utils.js';
import '../../styles/navbar.css';

/**
 * Navbar controller class
 */
class NavbarController {
    constructor() {
        console.log('NavbarController: Constructor called');
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            console.log('NavbarController: DOM still loading, waiting...');
            document.addEventListener('DOMContentLoaded', () => this._initialize());
        } else {
            console.log('NavbarController: DOM ready, initializing...');
            this._initialize();
        }
    }

    /**
     * Initialize all elements and state
     * @private
     */
    _initialize() {
        this.navbar = document.querySelector('[data-element="navbar"]');
        this.heroSection = document.querySelector('[data-section="hero"]');
        this.menuWrapper = document.querySelector('.nav-menu-wrapper');
        
        console.log('NavbarController: Elements found:', {
            navbar: !!this.navbar,
            heroSection: !!this.heroSection,
            menuWrapper: !!this.menuWrapper
        });

        if (!this.navbar) {
            console.error('Navbar element not found');
            return;
        }

        // Initialize state
        this.isNavbarVisible = false;

        // Set initial state using data attribute only
        console.log('NavbarController: Setting initial hidden state');
        this.navbar.setAttribute('data-state', 'hidden');

        // Bind event handlers
        this.handleScroll = throttle(this._handleScroll.bind(this), 100);
        this.handleKeydown = this._handleKeydown.bind(this);

        // Add keyboard listener for Escape key
        document.addEventListener('keydown', this.handleKeydown);
        console.log('NavbarController: Keyboard listener added');

        // If no hero section, show navbar after a small delay
        if (!this.heroSection) {
            console.log('NavbarController: No hero section found, showing navbar after delay');
            setTimeout(() => {
                this.navbar.setAttribute('data-state', 'visible');
                console.log('NavbarController: Navbar shown (no hero)');
            }, 500);
            return;
        }

        // Initial check for pages with hero section
        console.log('NavbarController: Hero section found, checking initial scroll position');
        this._handleScroll();
        
        // Add scroll listener only for pages with hero section
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        console.log('NavbarController: Scroll listener added');
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.heroSection) {
            window.removeEventListener('scroll', this.handleScroll);
        }
        document.removeEventListener('keydown', this.handleKeydown);
        console.log('NavbarController: Cleaned up event listeners');
    }

    /**
     * Handle keyboard events
     * @private
     */
    _handleKeydown(event) {
        if (event.key === 'Escape') {
            // Check if menu is visible by checking its opacity
            if (this.menuWrapper && this.menuWrapper.style.opacity === '1') {
                // Trigger the Finsweet attribute click to properly close the menu
                const menuButton = document.querySelector('[fs-scrolldisable-element="toggle"]');
                if (menuButton) {
                    menuButton.click();
                }
                console.log('NavbarController: Menu closed via Escape key');
            }
        }
    }

    /**
     * Handle scroll event to show/hide navbar
     * @private
     */
    _handleScroll() {
        if (!this.heroSection || !this.navbar) {
            return;
        }

        // Get hero section's bottom position relative to viewport
        const heroRect = this.heroSection.getBoundingClientRect();
        const hasScrolledPastHero = heroRect.bottom <= 0;

        // Update navbar visibility state
        if (hasScrolledPastHero && !this.isNavbarVisible) {
            this.navbar.setAttribute('data-state', 'visible');
            this.isNavbarVisible = true;
            console.log('NavbarController: Showing navbar after hero section');
        } else if (!hasScrolledPastHero && this.isNavbarVisible) {
            this.navbar.setAttribute('data-state', 'hidden');
            this.isNavbarVisible = false;
            console.log('NavbarController: Hiding navbar before hero section');
        }
    }
}

export const initNavbar = () => {
    console.log('NavbarController: Initializing...');
    return new NavbarController();
}; 