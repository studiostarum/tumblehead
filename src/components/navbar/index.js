/**
 * Navbar Component
 * 
 * Animated, responsive navigation bar with mobile menu support.
 * Compatible with both standard navbar and Webflow navbar structures.
 */

import { toggleClass } from '../../utils/dom';

// Configuration
const CONFIG = {
  breakpoint: 768,        // Mobile breakpoint (px)
  animationDuration: 300, // Animation duration (ms)
  scrollThreshold: 50     // Scroll threshold for background change (px)
};

// Store original body styles to restore later
let originalBodyStyles = {
  overflow: ''
};

// Store scroll position
let scrollPosition = 0;

/**
 * Utility functions for common navbar operations
 */
const navbarUtils = {
  isWebflowNav: (navbar) => navbar.hasAttribute('data-element'),
  
  isMenuOpen: (navbar, primaryNav) => {
    return navbarUtils.isWebflowNav(navbar) 
      ? primaryNav.getAttribute('data-state') === 'visible'
      : navbar.classList.contains('menu-open');
  },
  
  closeMenu: (navbar, menuToggle, primaryNav, shouldFocus = false) => {
    if (navbarUtils.isWebflowNav(navbar)) {
      menuToggle.setAttribute('data-state', '');
      primaryNav.setAttribute('data-state', 'hidden');
    } else {
      toggleClass(navbar, 'menu-open', false);
      menuToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('menu-open');
    
    // Only remove black background if we're scrolled to top
    if (window.scrollY <= CONFIG.scrollThreshold) {
      navbar.classList.remove('is-scrolled');
    }
    
    unlockScroll();
    if (shouldFocus) menuToggle.focus();
  },
  
  openMenu: (navbar, menuToggle, primaryNav) => {
    if (navbarUtils.isWebflowNav(navbar)) {
      menuToggle.setAttribute('data-state', 'open');
      primaryNav.setAttribute('data-state', 'visible');
    } else {
      toggleClass(navbar, 'menu-open', true);
      menuToggle.setAttribute('aria-expanded', 'true');
    }
    document.body.classList.add('menu-open');
    navbar.classList.add('is-scrolled'); // Always add black bg when menu is open
    lockScroll();
  }
};

/**
 * Calculate scrollbar width
 * @returns {number} Width of the scrollbar in pixels
 */
function getScrollbarWidth() {
  // Create a temporary div with scrollbar
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  
  // Create inner div
  const inner = document.createElement('div');
  outer.appendChild(inner);
  
  // Calculate scrollbar width (outer width - inner width)
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  
  // Clean up
  outer.parentNode.removeChild(outer);
  
  return scrollbarWidth;
}

/**
 * Lock body scroll without layout shift
 */
function lockScroll() {
  // Store current scroll position
  scrollPosition = window.scrollY;
  
  // Calculate scrollbar width
  const scrollbarWidth = getScrollbarWidth();
  
  // Apply padding to body to prevent layout shift
  document.body.style.paddingRight = `${scrollbarWidth}px`;
  
  // Find navbar and check if it's fixed
  const navbar = document.querySelector('.navbar') || document.querySelector('[data-element="navbar"]');
  if (navbar && window.getComputedStyle(navbar).position === 'fixed') {
    // Get existing padding and add scrollbar width
    const currentPadding = parseFloat(window.getComputedStyle(navbar).paddingRight) || 0;
    navbar.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
  }
  
  // Lock scroll
  document.body.classList.add('scroll-locked');
  
  // Set the menu wrapper's scroll position
  const menuWrapper = document.querySelector('.nav-menu-wrapper');
  if (menuWrapper) {
    requestAnimationFrame(() => {
      menuWrapper.scrollTop = 0;
    });
  }
}

/**
 * Unlock body scroll and restore original state
 */
function unlockScroll() {
  // Remove scroll lock class
  document.body.classList.remove('scroll-locked');
  
  // Restore padding
  document.body.style.paddingRight = '';
  
  // Find navbar and restore original padding
  const navbar = document.querySelector('.navbar') || document.querySelector('[data-element="navbar"]');
  if (navbar && window.getComputedStyle(navbar).position === 'fixed') {
    navbar.style.paddingRight = '';
  }
  
  // Restore scroll position
  window.scrollTo(0, scrollPosition);
}

/**
 * Initialize the navbar component
 */
export function initNavbar() {
  // Support both navbar structures: standard and Webflow
  const navbar = document.querySelector('.navbar') || document.querySelector('[data-element="navbar"]');
  if (!navbar) {
    console.warn('Navbar element not found. Ensure .navbar or [data-element="navbar"] exists.');
    return;
  }
  
  // Find the menu toggle button (support both structures)
  const menuToggle = navbar.querySelector('.navbar-menu-toggle') || navbar.querySelector('.menu-button');
  
  // Find the primary navigation (support both structures)
  const primaryNav = navbar.querySelector('.navbar-primary-nav') || navbar.querySelector('.nav-menu-wrapper');
  
  // Enable transitions after a brief delay to ensure initial styles are applied
  setTimeout(() => {
    navbar.classList.add('js-enabled');
  }, 50);
  
  // Handle mobile menu toggle
  if (menuToggle && primaryNav) {
    setupMobileMenu(navbar, menuToggle, primaryNav);
  } else {
    console.warn('Menu toggle or primary navigation not found in navbar.');
  }
  
  // Handle anchor links
  setupSmoothScrolling(navbar);
  
  // Handle home page with hero section visibility
  setupHomePageNavbarVisibility(navbar);
  
  // Set up scroll detection
  let ticking = false;
  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Add/remove scrolled class based on scroll position
        if (window.scrollY > CONFIG.scrollThreshold) {
          navbar.classList.add('is-scrolled');
        } else if (!document.body.classList.contains('menu-open')) {
          // Only remove if menu isn't open
          navbar.classList.remove('is-scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  };
  
  // Add scroll event listener
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial check
  handleScroll();
  
  // Return controller for potential external control
  return {
    navbar,
    destroy: () => {
      // Cleanup code would go here
      unlockScroll();
      // Remove scroll event listener if it was set up
      window.removeEventListener('scroll', navbar._scrollHandler);
    }
  };
}

/**
 * Setup mobile menu functionality
 * @param {HTMLElement} navbar The navbar element
 * @param {HTMLElement} menuToggle The menu toggle button
 * @param {HTMLElement} primaryNav The primary navigation container
 */
function setupMobileMenu(navbar, menuToggle, primaryNav) {
  // Toggle menu
  menuToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = navbarUtils.isMenuOpen(navbar, primaryNav);
    if (isOpen) {
      navbarUtils.closeMenu(navbar, menuToggle, primaryNav);
    } else {
      navbarUtils.openMenu(navbar, menuToggle, primaryNav);
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const isMobile = window.innerWidth < CONFIG.breakpoint;
    if (isMobile && navbarUtils.isMenuOpen(navbar, primaryNav) && !navbar.contains(e.target)) {
      navbarUtils.closeMenu(navbar, menuToggle, primaryNav);
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < CONFIG.breakpoint;
    if (!isMobile && navbarUtils.isMenuOpen(navbar, primaryNav)) {
      navbarUtils.closeMenu(navbar, menuToggle, primaryNav);
    }
  });
  
  // Close menu when pressing escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbarUtils.isMenuOpen(navbar, primaryNav)) {
      navbarUtils.closeMenu(navbar, menuToggle, primaryNav, true);
    }
  });
  
  // Handle dropdown menus (if they exist)
  const dropdownToggleButtons = navbar.querySelectorAll('.navbar-dropdown-toggle');
  
  dropdownToggleButtons.forEach(button => {
    const dropdown = button.nextElementSibling;
    if (!dropdown) return;
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Toggle dropdown open state
      const isExpanded = toggleClass(button.parentElement, 'dropdown-open');
      button.setAttribute('aria-expanded', isExpanded.toString());
      
      // Animate dropdown height
      if (isExpanded) {
        dropdown.style.height = `${dropdown.scrollHeight}px`;
      } else {
        dropdown.style.height = '0';
      }
    });
  });
}

/**
 * Setup smooth scrolling for anchor links
 * @param {HTMLElement} navbar The navbar element
 */
function setupSmoothScrolling(navbar) {
  const navLinks = navbar.querySelectorAll('a[href^="#"]:not([href="#"])');
  const navbarHeight = navbar.offsetHeight;
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        e.preventDefault();
        
        // Close menu if open
        const menuToggle = navbar.querySelector('.navbar-menu-toggle') || navbar.querySelector('.menu-button');
        const primaryNav = navbar.querySelector('.navbar-primary-nav') || navbar.querySelector('.nav-menu-wrapper');
        
        if (navbarUtils.isMenuOpen(navbar, primaryNav) && menuToggle && primaryNav) {
          navbarUtils.closeMenu(navbar, menuToggle, primaryNav);
        }
        
        // Calculate scroll position
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - navbarHeight;
        
        // Scroll smoothly
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Setup navbar visibility for home pages
 * @param {HTMLElement} navbar The navbar element
 */
function setupHomePageNavbarVisibility(navbar) {
  // Check if we're on a home page
  const isHomePage = document.body.hasAttribute('data-page') && 
                    document.body.getAttribute('data-page') === 'home';
  
  if (!isHomePage) return;
  
  // Find the hero element
  const heroSection = document.querySelector('[data-element="hero"]')
  
  if (!heroSection) {
    console.warn('Hero section not found on home page. Ensure [data-element="hero"] exists.');
    return;
  }
  
  // Enable transitions
  navbar.classList.add('js-enabled');
  
  // Create scroll handler function with throttling
  let ticking = false;
  const handleScroll = () => {
    // Don't hide navbar if menu is open
    if (document.body.classList.contains('menu-open')) {
      return;
    }

    if (!ticking) {
      window.requestAnimationFrame(() => {
        const heroRect = heroSection.getBoundingClientRect();
        const heroBottom = heroRect.bottom;
        
        // If we've scrolled past the hero section
        if (heroBottom <= 0) {
          if (!navbar.classList.contains('visible')) {
            navbar.classList.add('visible');
          }
        } else {
          if (navbar.classList.contains('visible')) {
            navbar.classList.remove('visible');
          }
        }
        
        ticking = false;
      });
      
      ticking = true;
    }
  };
  
  // Store reference to the handler for cleanup
  navbar._scrollHandler = handleScroll;
  
  // Add scroll event listener
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial check in case page is loaded scrolled down
  handleScroll();
}

// Export for external use
export default {
  init: initNavbar
}; 