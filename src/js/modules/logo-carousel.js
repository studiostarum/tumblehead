/**
 * Infinite horizontal scroll animation for lists (awards/logos)
 */

export function initInfiniteScroll(selector, options = {}) {
    const component = document.querySelector(selector);
    
    // If the component doesn't exist, don't proceed
    if (!component) return;
    
    // Default options
    const defaults = {
        scrollSpeed: 0.5,
        containerClass: 'scroll-animation-container',
        wrapperSelector: '.awards-list-wrapper, .client-list-wrapper'
    };
    
    const settings = { ...defaults, ...options };
    
    // Variables for the animation
    let currentPosition = 0;
    let isAnimating = true;
    let animationFrameId = null;
    let totalWidth = 0;
    let neededDuplicates = 0;
    
    // Remove any inline transform from the component that might interfere
    component.style.transform = 'none';
    component.style.willChange = 'transform';
    
    // Create container for animation
    const animationContainer = document.createElement('div');
    animationContainer.className = settings.containerClass;
    
    // Get original wrappers - use the correct selector based on the component
    let wrapperSelector = '';
    if (component.classList.contains('awards-list-component')) {
        wrapperSelector = '.awards-list-wrapper';
    } else if (component.classList.contains('client-list-component')) {
        wrapperSelector = '.client-list-wrapper';
    } else {
        wrapperSelector = settings.wrapperSelector.split(', ')[0]; // Default to first selector
    }
    
    const originalWrappers = component.querySelectorAll(wrapperSelector);
    
    function setupCarousel() {
        // Clear the animation container
        animationContainer.innerHTML = '';
        
        // Move all existing wrappers into the animation container
        originalWrappers.forEach(wrapper => {
            animationContainer.appendChild(wrapper.cloneNode(true));
        });
        
        // Calculate total width of all wrappers
        totalWidth = 0;
        const wrappers = animationContainer.querySelectorAll(wrapperSelector);
        wrappers.forEach(wrapper => {
            totalWidth += wrapper.offsetWidth;
        });
        
        // Calculate needed duplicates based on current window width
        const visibleWidth = window.innerWidth;
        neededDuplicates = Math.ceil((visibleWidth * 2) / totalWidth) + 1;
        
        // Create duplicates before the original content
        for (let i = 0; i < neededDuplicates; i++) {
            wrappers.forEach(wrapper => {
                animationContainer.insertBefore(wrapper.cloneNode(true), animationContainer.firstChild);
            });
        }
        
        // Create duplicates after the original content
        for (let i = 0; i < neededDuplicates; i++) {
            wrappers.forEach(wrapper => {
                animationContainer.appendChild(wrapper.cloneNode(true));
            });
        }
        
        // Set initial position to show the middle set of items
        currentPosition = -totalWidth * neededDuplicates;
        animationContainer.style.transform = `translateX(${currentPosition}px)`;
    }
    
    // Clear the component and insert the animation container
    component.innerHTML = '';
    component.appendChild(animationContainer);
    
    // Initial setup
    setupCarousel();
    
    function animate() {
        if (!isAnimating) return;
        
        currentPosition -= settings.scrollSpeed;
        
        // Reset position when we've scrolled one full width
        if (Math.abs(currentPosition) >= totalWidth * (neededDuplicates + 1)) {
            currentPosition += totalWidth;
        }
        
        animationContainer.style.transform = `translateX(${currentPosition}px)`;
        animationFrameId = requestAnimationFrame(animate);
    }
    
    function pauseAnimation() {
        isAnimating = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    
    function resumeAnimation() {
        if (!isAnimating) {
            isAnimating = true;
            animationFrameId = requestAnimationFrame(animate);
        }
    }
    
    // Visibility handling
    document.addEventListener('visibilitychange', () => {
        document.hidden ? pauseAnimation() : resumeAnimation();
    });
    
    // Start animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Handle window resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Clear the previous timeout
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        // Set a new timeout to prevent multiple rapid executions
        resizeTimeout = setTimeout(() => {
            // Pause animation during resize
            pauseAnimation();
            
            // Recalculate and rebuild carousel
            setupCarousel();
            
            // Resume animation
            resumeAnimation();
        }, 250); // Wait for 250ms after last resize event
    });
    
    // Return control functions
    return {
        pause: pauseAnimation,
        resume: resumeAnimation,
        destroy: () => {
            pauseAnimation();
            document.removeEventListener('visibilitychange', () => {
                document.hidden ? pauseAnimation() : resumeAnimation();
            });
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
        }
    };
}

// Initialize both scrollers
export function initLogoCarousel() {
    // Initialize awards scroll if it exists
    initInfiniteScroll('.awards-list-component');
    
    // Initialize client logos scroll
    initInfiniteScroll('.client-list-component', {
        scrollSpeed: 0.3 // Slightly slower for client logos
    });
} 