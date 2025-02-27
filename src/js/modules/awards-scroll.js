/**
 * Infinite horizontal scroll animation for awards/logos list
 */

export function initAwardsScroll() {
    const awardsComponent = document.querySelector('.awards-list-component');
    
    // If the awards component doesn't exist, don't proceed
    if (!awardsComponent) return;
    
    // Variables for the animation
    let currentPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame
    let isAnimating = true; // Track animation state
    let animationFrameId = null; // Store animation frame ID for cancellation
    
    // Duplicate the content for a seamless loop
    // We copy the existing list wrappers to create a continuous loop
    const originalWrappers = awardsComponent.querySelectorAll('.awards-list-wrapper');
    
    // Remove any inline transform from the component that might interfere
    awardsComponent.style.transform = 'none';
    awardsComponent.style.willChange = 'transform';
    
    // Create container for animation - will allow us to create a seamless loop
    const animationContainer = document.createElement('div');
    animationContainer.className = 'awards-animation-container';
    
    // Move all existing wrappers into the animation container
    originalWrappers.forEach(wrapper => {
        animationContainer.appendChild(wrapper.cloneNode(true));
    });
    
    // Clear the awards component and insert the animation container
    awardsComponent.innerHTML = '';
    awardsComponent.appendChild(animationContainer);
    
    // Calculate total width of all wrappers
    let totalWidth = 0;
    const wrappers = animationContainer.querySelectorAll('.awards-list-wrapper');
    wrappers.forEach(wrapper => {
        totalWidth += wrapper.offsetWidth;
    });
    
    // Duplicate wrappers to ensure we have enough content for a seamless loop
    // We need to duplicate enough times to cover at least twice the visible area
    const visibleWidth = awardsComponent.offsetWidth;
    const neededDuplicates = Math.ceil((visibleWidth * 2) / totalWidth);
    
    for (let i = 0; i < neededDuplicates; i++) {
        wrappers.forEach(wrapper => {
            animationContainer.appendChild(wrapper.cloneNode(true));
        });
    }
    
    // Animation function using requestAnimationFrame
    function animate() {
        if (!isAnimating) return; // Don't proceed if animation is paused
        
        // Move the container
        currentPosition -= scrollSpeed;
        
        // Reset position when we've scrolled full width to create seamless loop
        if (Math.abs(currentPosition) >= totalWidth) {
            currentPosition += totalWidth;
        }
        
        // Apply transform
        animationContainer.style.transform = `translateX(${currentPosition}px)`;
        
        // Continue animation
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Function to pause animation
    function pauseAnimation() {
        isAnimating = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    
    // Function to resume animation
    function resumeAnimation() {
        if (!isAnimating) {
            isAnimating = true;
            animationFrameId = requestAnimationFrame(animate);
        }
    }
    
    // Add event listeners for pausing on hover/touch
    awardsComponent.addEventListener('mouseenter', pauseAnimation);
    awardsComponent.addEventListener('mouseleave', resumeAnimation);
    awardsComponent.addEventListener('touchstart', pauseAnimation, { passive: true });
    awardsComponent.addEventListener('touchend', resumeAnimation);
    
    // Handle visibility changes (pause when page is not visible)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseAnimation();
        } else {
            resumeAnimation();
        }
    });
    
    // Start the animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Handle window resize to recalculate dimensions
    window.addEventListener('resize', () => {
        // Recalculate totalWidth if needed
        totalWidth = 0;
        animationContainer.querySelectorAll('.awards-list-wrapper').forEach(wrapper => {
            totalWidth += wrapper.offsetWidth;
        });
    });
} 