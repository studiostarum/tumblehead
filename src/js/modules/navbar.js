import { ScrollLocker } from './utils';

const scrollLocker = new ScrollLocker();

export function initNavbar() {
    const navbar = document.querySelector('[data-element="navbar"]');
    const menuButton = navbar.querySelector('.menu-button');
    const menuWrapper = navbar.querySelector('.nav-menu-wrapper');
    let isMenuOpen = false;

    // Only setup initial state on home page
    if (document.body.getAttribute('data-page') === 'home') {
        // Set initial state to hidden - visibility will be managed by hero-scroll-reveal.js
        navbar.setAttribute('data-state', 'hidden');
        navbar.style.display = 'none';
    } else {
        // On non-home pages, always show navbar
        navbar.style.display = 'block';
        navbar.setAttribute('data-state', 'visible');
    }

    // Function to open menu
    function openMenu() {
        menuWrapper.style.display = 'block';
        // Force a reflow
        menuWrapper.offsetHeight;
        menuButton.setAttribute('data-state', 'open');
        menuWrapper.setAttribute('data-state', 'visible');
        scrollLocker.lock();
        isMenuOpen = true;
    }

    // Function to close menu
    function closeMenu() {
        menuButton.setAttribute('data-state', '');
        menuWrapper.setAttribute('data-state', 'hidden');
        setTimeout(() => {
            if (!isMenuOpen) {
                menuWrapper.style.display = 'none';
            }
        }, 0);
        scrollLocker.unlock();
        isMenuOpen = false;
    }

    // Toggle menu on button click
    menuButton.addEventListener('click', () => {
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
        if (isMenuOpen && !navbar.contains(e.target)) {
            closeMenu();
        }
    });

    // Initialize menu state
    menuWrapper.style.display = 'none';
    menuWrapper.setAttribute('data-state', 'hidden');
    menuButton.setAttribute('data-state', '');
    isMenuOpen = false;
}
