// Import styles
import './index.css';

export class Navbar {
    constructor() {
        // Get navbar and trigger elements
        this.navbar = document.querySelector('[data-element="navbar"]');
        this.trigger = document.querySelector('[data-scroll-trigger]');
        
        // Get all reveal elements
        this.revealElements = document.querySelectorAll('[data-scroll-reveal]');
        
        if (!this.navbar || !this.trigger) return;

        // Initialize
        this.init();
    }

    init() {
        // Initially hide navbar
        this.navbar.style.opacity = '0';
        this.navbar.style.transform = 'translateY(-100%)';
        
        // Initially hide all reveal elements
        this.hideRevealElements();
        
        // Create intersection observer for the trigger
        this.triggerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    // When trigger element exits viewport (scrolled past it)
                    if (!entry.isIntersecting) {
                        this.showNavbar();
                    } else {
                        this.hideNavbar();
                    }
                });
            },
            {
                threshold: 0,
                rootMargin: '0px'
            }
        );

        // Start observing the trigger element
        this.triggerObserver.observe(this.trigger);
        
        // Create observer for reveal elements
        this.revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    // Always check position when element is visible
                    if (entry.isIntersecting) {
                        this.checkRevealElement(entry.target);
                    }
                });
            },
            {
                threshold: [0, 0.1],
                rootMargin: '0px'
            }
        );
        
        // Start observing all reveal elements
        this.revealElements.forEach(element => {
            this.revealObserver.observe(element);
        });

        // Add scroll event listener to continuously check positions
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
        
        // Show element if it's below the trigger's bottom edge
        if (elementRect.top > triggerRect.bottom) {
            this.showRevealElement(element);
        } else {
            this.hideRevealElement(element);
        }
    }

    showNavbar() {
        this.navbar.style.opacity = '1';
        this.navbar.style.transform = 'translateY(0)';
    }

    hideNavbar() {
        this.navbar.style.opacity = '0';
        this.navbar.style.transform = 'translateY(-100%)';
    }
    
    hideRevealElements() {
        this.revealElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
        });
    }
    
    hideRevealElement(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
    }
    
    showRevealElement(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }
} 