import { ScrollLocker } from './utils';

// Remove the scrollLocker instance since we won't be using it
// const scrollLocker = new ScrollLocker();

export function initNavbar() {
    const navbar = document.querySelector('[data-element="navbar"]');
    const menuButton = navbar.querySelector('.menu-button');
    const menuWrapper = navbar.querySelector('.nav-menu-wrapper');
    let isMenuOpen = false;
    
    // Function to calculate scrollbar width - keeping this in case it's used elsewhere
    function getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }
    
    // We'll keep these functions but won't call them
    function preventLayoutShift() {
        const scrollbarWidth = getScrollbarWidth();
        
        // Only add padding if scrollbar has width
        if (scrollbarWidth > 0) {
            // Store the current padding
            const currentPadding = parseInt(document.body.style.paddingRight, 10) || 0;
            
            // Add padding to the body to compensate for scrollbar width
            document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
            
            // Add padding to fixed elements that are aligned to the right
            const fixedElements = document.querySelectorAll('.is-fixed-right, [data-element="navbar"]');
            fixedElements.forEach(el => {
                const elPadding = parseInt(window.getComputedStyle(el).paddingRight, 10) || 0;
                el.style.paddingRight = `${elPadding + scrollbarWidth}px`;
            });
        }
    }
    
    // Function to restore layout after scrollbar returns
    function restoreLayout() {
        // Remove the added padding from body
        document.body.style.paddingRight = '';
        
        // Remove padding from fixed elements
        const fixedElements = document.querySelectorAll('.is-fixed-right, [data-element="navbar"]');
        fixedElements.forEach(el => {
            el.style.paddingRight = '';
        });
    }

    // Add CSS animation styles dynamically for all pages
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        [data-element="navbar"][data-state="visible"] {
            animation: fadeIn 0.5s ease forwards;
        }
        
        [data-element="navbar"] .navbar-container {
            transition: opacity 0.3s ease;
        }
        
        [data-element="navbar"][data-state="visible"] .navbar-container {
            opacity: 1;
        }
        
        [data-element="navbar"][data-state="hidden"] .navbar-container {
            opacity: 0;
        }
        
        /* Menu button and wrapper animations */
        .menu-button {
            transition: transform 0.3s ease;
        }
        
        .menu-button[data-state="open"] {
            transform: rotate(45deg);
        }
        
        .nav-menu-wrapper {
            transition: opacity 0.3s ease;
            opacity: 0;
        }
        
        .nav-menu-wrapper[data-state="visible"] {
            opacity: 1;
        }
        
        .nav-menu-wrapper[data-state="hidden"] {
            opacity: 0;
        }
        
        /* Remove the scroll-locked class styling */
        /* body.scroll-locked {
            overflow: hidden;
        } */
    `;
    document.head.appendChild(style);

    // Only setup intersection observer on home page
    if (document.body.getAttribute('data-page') === 'home') {
        // Look for the hero-multiply section instead of hero
        const heroMultiply = document.querySelector('.hero-multiply');
        if (heroMultiply) {
            // Set initial state to hidden
            navbar.setAttribute('data-state', 'hidden');
            navbar.style.display = 'none';
            
            // Use scroll event instead of intersection observer for more precise control
            let lastScrollY = window.scrollY;
            let ticking = false;
            
            function updateNavbarVisibility() {
                // Get the bottom position of the multiply section
                const multiplyBottom = heroMultiply.getBoundingClientRect().bottom;
                
                // Show navbar only when we've scrolled completely past the multiply section
                // This means the bottom of the multiply section is above the viewport
                // Adding a small buffer of -50px to ensure we're definitely past it
                if (multiplyBottom < -50) {
                    if (navbar.getAttribute('data-state') !== 'visible') {
                        navbar.style.display = 'block';
                        // Force a reflow
                        navbar.offsetHeight;
                        navbar.setAttribute('data-state', 'visible');
                    }
                } else {
                    if (navbar.getAttribute('data-state') !== 'hidden') {
                        navbar.setAttribute('data-state', 'hidden');
                        setTimeout(() => {
                            if (navbar.getAttribute('data-state') === 'hidden') {
                                navbar.style.display = 'none';
                            }
                        }, 500); // Increased timeout to match animation duration
                    }
                }
                
                ticking = false;
            }
            
            window.addEventListener('scroll', () => {
                lastScrollY = window.scrollY;
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        updateNavbarVisibility();
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
            
            // Initial check
            updateNavbarVisibility();
        }
    } else {
        // On non-home pages, always show navbar
        navbar.style.display = 'block';
        navbar.setAttribute('data-state', 'visible');
    }

    // Function to open menu
    function openMenu() {
        // Calculate scrollbar width
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
        
        // First make sure it's displayed
        menuWrapper.style.display = 'block';
        
        // Remove any inline opacity style to let CSS handle the transition
        menuWrapper.style.removeProperty('opacity');
        
        // Force a reflow to ensure the display change takes effect before animation
        menuWrapper.offsetHeight;
        
        // Then trigger animations by changing data states
        menuButton.setAttribute('data-state', 'open');
        menuWrapper.setAttribute('data-state', 'visible');
        
        isMenuOpen = true;
    }

    // Function to close menu
    function closeMenu() {
        // Make sure there's no inline opacity style
        menuWrapper.style.removeProperty('opacity');
        
        // Start animations by changing data states
        menuButton.setAttribute('data-state', '');
        menuWrapper.setAttribute('data-state', 'hidden');
        
        // Remove scrollbar width variable
        document.documentElement.style.removeProperty('--scrollbar-width');
        
        // Wait for animations to complete before hiding
        setTimeout(() => {
            // Only hide if the menu is still in hidden state
            if (menuWrapper.getAttribute('data-state') === 'hidden') {
                menuWrapper.style.display = 'none';
                isMenuOpen = false;
            }
        }, 300); // Match the CSS transition duration
    }

    // Toggle menu on button click
    menuButton.addEventListener('click', (e) => {
        // Stop event propagation to prevent document click handler from firing
        e.stopPropagation();
        
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        // Only close if the menu is open AND the click is outside the navbar
        if (isMenuOpen && !navbar.contains(e.target)) {
            closeMenu();
        }
    });

    // Initialize menu state - hidden with 0 opacity
    menuWrapper.style.display = 'none';
    // Don't set inline opacity style, let CSS handle it
    menuWrapper.setAttribute('data-state', 'hidden');
    menuButton.setAttribute('data-state', '');
    isMenuOpen = false;
}
