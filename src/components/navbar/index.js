/**
 * Navbar Component
 * 
 * Animated, responsive navigation bar with mobile menu support.
 * Compatible with both standard navbar and Webflow navbar structures.
 */

import './styles.css';
import { toggleClass, isElementInViewport } from '../../utils/dom';

// Configuration
const CONFIG = {
  breakpoint: 768,        // Mobile breakpoint (px)
  animationDuration: 300  // Animation duration (ms)
};

// Store original body styles to restore later
let originalBodyStyles = {
  overflow: '',
  paddingRight: '',
  position: '',
  top: '',
  width: ''
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
  const scrollY = window.scrollY;
  
  // Save original values
  originalBodyStyles.overflow = document.body.style.overflow;
  originalBodyStyles.paddingRight = document.body.style.paddingRight;
  originalBodyStyles.position = document.body.style.position;
  originalBodyStyles.top = document.body.style.top;
  originalBodyStyles.width = document.body.style.width;
  
  // Calculate scrollbar width
  const scrollbarWidth = getScrollbarWidth();
  
  // Add padding to compensate for missing scrollbar
  if (window.innerWidth > document.documentElement.clientWidth) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
  
  // Lock scroll while preserving position
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  document.body.classList.add('scroll-locked');
}

/**
 * Unlock body scroll and restore original state
 */
function unlockScroll() {
  // Get the scroll position from the body's top property
  const scrollY = document.body.style.top;
  
  // Restore original styles
  document.body.style.overflow = originalBodyStyles.overflow;
  document.body.style.paddingRight = originalBodyStyles.paddingRight;
  document.body.style.position = originalBodyStyles.position;
  document.body.style.top = originalBodyStyles.top;
  document.body.style.width = originalBodyStyles.width;
  document.body.classList.remove('scroll-locked');
  
  // Restore scroll position
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
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
  
  // Set scrollbar width CSS variable
  document.documentElement.style.setProperty('--scrollbar-width', `${getScrollbarWidth()}px`);
  
  // Set navbar height CSS variable
  document.documentElement.style.setProperty('--navbar-height', `${navbar.offsetHeight}px`);
  
  // Update navbar height on resize
  window.addEventListener('resize', () => {
    document.documentElement.style.setProperty('--navbar-height', `${navbar.offsetHeight}px`);
  });
  
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
    
    // Support both standard and Webflow structures
    const isWebflowNav = navbar.hasAttribute('data-element');
    
    if (isWebflowNav) {
      // Webflow navbar structure
      const isExpanded = menuToggle.getAttribute('data-state') === 'open';
      menuToggle.setAttribute('data-state', isExpanded ? '' : 'open');
      primaryNav.setAttribute('data-state', isExpanded ? 'hidden' : 'visible');
      
      document.body.classList.toggle('menu-open', !isExpanded);
      
      // Prevent scroll when menu is open using our scroll lock functions
      if (isExpanded) {
        unlockScroll();
      } else {
        lockScroll();
      }
    } else {
      // Standard navbar structure
      const isExpanded = toggleClass(navbar, 'menu-open');
      menuToggle.setAttribute('aria-expanded', isExpanded.toString());
      document.body.classList.toggle('menu-open', isExpanded);
      
      // Prevent scroll when menu is open using our scroll lock functions
      if (isExpanded) {
        lockScroll();
      } else {
        unlockScroll();
      }
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const isMobile = window.innerWidth < CONFIG.breakpoint;
    const isWebflowNav = navbar.hasAttribute('data-element');
    
    if (isWebflowNav) {
      // Webflow navbar structure
      const isMenuOpen = primaryNav.getAttribute('data-state') === 'visible';
      
      if (isMobile && isMenuOpen && !navbar.contains(e.target)) {
        menuToggle.setAttribute('data-state', '');
        primaryNav.setAttribute('data-state', 'hidden');
        document.body.classList.remove('menu-open');
        unlockScroll();
      }
    } else {
      // Standard navbar structure
      const isMenuOpen = navbar.classList.contains('menu-open');
      
      if (isMobile && isMenuOpen && !navbar.contains(e.target)) {
        toggleClass(navbar, 'menu-open', false);
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
        unlockScroll();
      }
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < CONFIG.breakpoint;
    const isWebflowNav = navbar.hasAttribute('data-element');
    
    if (isWebflowNav) {
      // Webflow navbar structure
      const isMenuOpen = primaryNav.getAttribute('data-state') === 'visible';
      
      if (!isMobile && isMenuOpen) {
        menuToggle.setAttribute('data-state', '');
        primaryNav.setAttribute('data-state', 'hidden');
        
        // Apply same animation delay before hiding
        setTimeout(() => {
          primaryNav.style.display = 'none';
        }, CONFIG.animationDuration);
        
        document.body.classList.remove('menu-open');
        unlockScroll();
      }
    } else {
      // Standard navbar structure
      if (!isMobile && navbar.classList.contains('menu-open')) {
        toggleClass(navbar, 'menu-open', false);
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
        unlockScroll();
      }
    }
  });
  
  // Close menu when pressing escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const isWebflowNav = navbar.hasAttribute('data-element');
      
      if (isWebflowNav) {
        // Webflow navbar structure
        const isMenuOpen = primaryNav.getAttribute('data-state') === 'visible';
        
        if (isMenuOpen) {
          menuToggle.setAttribute('data-state', '');
          primaryNav.setAttribute('data-state', 'hidden');
          
          // Apply same animation delay before hiding
          setTimeout(() => {
            primaryNav.style.display = 'none';
          }, CONFIG.animationDuration);
          
          document.body.classList.remove('menu-open');
          unlockScroll();
          menuToggle.focus();
        }
      } else {
        // Standard navbar structure
        if (navbar.classList.contains('menu-open')) {
          toggleClass(navbar, 'menu-open', false);
          menuToggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('menu-open');
          unlockScroll();
          menuToggle.focus();
        }
      }
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
        if (navbar.classList.contains('menu-open')) {
          const menuToggle = navbar.querySelector('.navbar-menu-toggle');
          if (menuToggle) {
            toggleClass(navbar, 'menu-open', false);
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
            unlockScroll();
          }
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