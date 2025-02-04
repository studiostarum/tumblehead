import { throttle, ScrollLocker } from '@/js/modules/utils';

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
        this.menuButton = document.querySelector('.menu-button');
        this.menuWrapper = document.querySelector('.nav-menu-wrapper');
        
        // Initialize scroll locker
        this.scrollLocker = new ScrollLocker();
        
        console.log('NavbarController: Elements found:', {
            navbar: !!this.navbar,
            heroSection: !!this.heroSection,
            menuButton: !!this.menuButton,
            menuWrapper: !!this.menuWrapper
        });

        if (!this.navbar) {
            console.error('Navbar element not found');
            return;
        }

        // Initialize state
        this.isNavbarVisible = !this.heroSection; // Set to true if no hero section

        // Set initial state based on whether there's a hero section
        console.log('NavbarController: Setting initial state');
        
        // Remove the manual style setting as it interferes with the CSS transitions
        // Let CSS handle the initial state entirely
        this.navbar.setAttribute('data-state', this.isNavbarVisible ? 'visible' : 'hidden');

        // Set initial states
        if (this.menuButton && this.menuWrapper) {
            // Remove inline styles and use data attributes
            this.menuWrapper.removeAttribute('style');
            this.menuWrapper.setAttribute('data-state', 'hidden');
            
            // Remove Finsweet attribute
            this.menuButton.removeAttribute('fs-scrolldisable-element');
            
            // Add click event listener
            this.menuButton.addEventListener('click', this._handleMenuToggle.bind(this));
        }

        // Bind event handlers
        this.handleScroll = throttle(this._handleScroll.bind(this), 100);
        this.handleKeydown = this._handleKeydown.bind(this);

        // Add keyboard listener for Escape key
        document.addEventListener('keydown', this.handleKeydown);
        console.log('NavbarController: Keyboard listener added');

        // Only add scroll listener and do initial check if we have a hero section
        if (this.heroSection) {
            // Initial check for pages with hero section
            console.log('NavbarController: Hero section found, checking initial scroll position');
            this._handleScroll();
            
            // Add scroll listener only for pages with hero section
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            console.log('NavbarController: Scroll listener added');
        }
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.heroSection) {
            window.removeEventListener('scroll', this.handleScroll);
        }
        document.removeEventListener('keydown', this.handleKeydown);
        if (this.menuButton) {
            this.menuButton.removeEventListener('click', this._handleMenuToggle);
        }
        // Make sure to unlock scroll when destroying
        if (this.scrollLocker && this.scrollLocker.isLocked) {
            this.scrollLocker.unlock();
        }
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
                this._handleMenuToggle();
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

    /**
     * Handle menu button toggle
     * @private
     */
    _handleMenuToggle() {
        if (!this.menuButton || !this.menuWrapper) return;

        const isMenuOpen = this.menuWrapper.getAttribute('data-state') === 'visible';

        if (!isMenuOpen) {
            // Opening the menu
            this.menuWrapper.setAttribute('data-state', 'visible');
            this.menuButton.setAttribute('data-state', 'open');
            this.scrollLocker.lock();
        } else {
            // Closing the menu
            this.menuWrapper.setAttribute('data-state', 'hidden');
            this.menuButton.removeAttribute('data-state');
            this.scrollLocker.unlock();
        }
    }
}

export const initNavbar = () => {
    console.log('NavbarController: Initializing...');
    return new NavbarController();
}; 