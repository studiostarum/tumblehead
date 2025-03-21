import { scrollLock } from '../../utils/scroll-lock';

export class Navbar {
    constructor() {
        // Get navbar and trigger elements
        this.navbar = document.querySelector('[data-element="navbar"]');
        this.trigger = document.querySelector('[data-scroll-trigger]');
        this.menuWrapper = document.querySelector('.nav-menu-wrapper');
        this.menuButton = document.querySelector('.menu-button, .w-nav-button');

        // Get all reveal elements
        this.revealElements = document.querySelectorAll('[data-scroll-reveal]');

        if (!this.navbar || !this.trigger) return;

        // Initialize
        this.init();
        this.setupMenuObserver();
    }

    init() {
        // Initially hide all reveal elements
        this.hideRevealElements();

        // Setup observers
        this.setupTriggerObserver();
        this.setupRevealObserver();

        // Add scroll event listener
        this.setupScrollListener();
    }

    setupTriggerObserver() {
        this.triggerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    this.toggleElement(this.navbar, !entry.isIntersecting);
                });
            },
            { threshold: 0, rootMargin: '0px' }
        );
        this.triggerObserver.observe(this.trigger);
    }

    setupRevealObserver() {
        this.revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.checkRevealElement(entry.target);
                    }
                });
            },
            { threshold: [0, 0.1], rootMargin: '0px' }
        );

        this.revealElements.forEach(element => {
            this.revealObserver.observe(element);
        });
    }

    setupScrollListener() {
        window.addEventListener('scroll', () => {
            requestAnimationFrame(() => {
                this.revealElements.forEach(element => {
                    if (this.isElementInViewport(element)) {
                        this.checkRevealElement(element);
                    }
                });
            });
        });
    }

    setupMenuObserver() {
        if (!this.menuWrapper) return;

        this.menuObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const isMenuOpen = this.menuWrapper.style.display === 'block' &&
                    this.menuWrapper.style.opacity === '1';

                if (isMenuOpen) {
                    scrollLock.lock();
                } else {
                    scrollLock.unlock();
                }
            });
        });

        this.menuObserver.observe(this.menuWrapper, {
            attributes: true,
            attributeFilter: ['style'],
            attributeOldValue: true
        });
    }

    /**
     * Add padding to fixed elements
     */
    addPadding() {
        // Add padding to fixed elements
        document.querySelectorAll(this.fixedElements).forEach(element => {
            element.classList.add('scroll-lock-padding');
        });

        // Handle menu button separately
        const menuButton = document.querySelector('.menu-button, .w-nav-button');
        if (menuButton) {
            menuButton.style.position = 'relative';
            menuButton.style.right = '0';
        }
    }

    /**
     * Remove padding from fixed elements
     */
    removePadding() {
        // Remove padding from fixed elements
        document.querySelectorAll(this.fixedElements).forEach(element => {
            element.classList.remove('scroll-lock-padding');
        });

        // Reset menu button
        const menuButton = document.querySelector('.menu-button, .w-nav-button');
        if (menuButton) {
            menuButton.style.position = '';
            menuButton.style.right = '';
        }
    }

    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }

    checkRevealElements() {
        this.revealElements.forEach(element => {
            if (this.isElementInViewport(element)) {
                this.checkRevealElement(element);
            }
        });
    }

    checkRevealElement(element) {
        const triggerRect = this.trigger.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        this.toggleElement(element, elementRect.top > triggerRect.bottom);
    }

    toggleElement(element, show) {
        const className = element === this.navbar ? 'navbar-visible' : 'reveal-visible';
        element.classList.toggle(className, show);
    }

    hideRevealElements() {
        this.revealElements.forEach(element => {
            this.toggleElement(element, false);
        });
    }

    // Cleanup method to disconnect observers
    destroy() {
        if (this.triggerObserver) {
            this.triggerObserver.disconnect();
        }
        if (this.revealObserver) {
            this.revealObserver.disconnect();
        }
        if (this.menuObserver) {
            this.menuObserver.disconnect();
        }
    }
} 