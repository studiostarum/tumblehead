export class LogoSlider {
    constructor() {
        this.container = document.querySelector('.logo-slider');
        if (!this.container) return;

        this.slider = this.container.querySelector('.logo-slider_track');
        if (!this.slider) return;

        this.logos = [...this.slider.children];
        if (!this.logos.length) return;

        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.position = 0;
        this.speed = 0.5; // REMs per second
        this.totalShift = 0;
        this.safetyBuffer = 2;
        this.lastTimestamp = null;
        this.originalSetWidth = 0; // Will be calculated in setupClones

        // Add GPU optimization hint and container styles
        this.slider.style.willChange = 'transform';
        this.container.style.overflow = 'hidden';
        this.container.style.position = 'relative';
        this.slider.style.position = 'relative';
        this.slider.style.display = 'flex';
        this.slider.style.width = 'max-content';
        
        this.init();
    }

    pxToRem(px) {
        return px / parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    remToPx(rem) {
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    init() {
        this.setupClones();
        this.animate();
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Add visibility change handling for better performance
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    setupClones() {
        // Calculate required clones
        const viewportWidth = window.innerWidth;
        const sliderWidth = this.slider.offsetWidth;
        const requiredWidth = viewportWidth * 2;
        const numClones = Math.ceil(requiredWidth / sliderWidth);

        // Calculate original set width
        this.originalSetWidth = this.logos.reduce((sum, logo) => sum + this.pxToRem(logo.offsetWidth), 0);

        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();

        // Clone logos
        for (let i = 0; i < numClones; i++) {
            this.logos.forEach(logo => {
                const clone = logo.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                fragment.appendChild(clone);
            });
        }

        // Batch DOM update
        this.slider.appendChild(fragment);
        
        // Update logos array with all items including clones
        this.allLogos = [...this.slider.children];
    }

    resetTransformIfNeeded() {
        const currentTransform = Math.abs(this.position - this.totalShift);
        
        // Reset when we've moved through at least one complete set
        if (currentTransform >= this.originalSetWidth) {
            // Calculate how many complete sets we've moved through
            const sets = Math.floor(currentTransform / this.originalSetWidth);
            
            if (sets > 0) {
                const resetAmount = sets * this.originalSetWidth;
                this.position += resetAmount;
                this.totalShift += resetAmount;
            }
        }
    }

    animate() {
        const tick = (timestamp) => {
            // Initialize lastTimestamp on first run
            if (!this.lastTimestamp) {
                this.lastTimestamp = timestamp;
            }

            // Calculate time elapsed since last frame
            const deltaTime = timestamp - this.lastTimestamp;
            this.lastTimestamp = timestamp;

            // Calculate movement based on time elapsed (convert to seconds)
            const movement = (deltaTime / 250) * this.speed;
            this.position -= movement;
            
            // Check if first logo is completely out of view (plus safety buffer)
            const firstLogo = this.allLogos[0];
            const logoWidth = this.pxToRem(firstLogo.offsetWidth);
            const containerWidth = this.pxToRem(this.container.offsetWidth);
            
            // Only move the logo when it's completely out of view plus safety buffer
            if (Math.abs(this.position) >= (logoWidth + containerWidth + this.safetyBuffer)) {
                // Calculate the exact overshoot amount
                const overshoot = Math.abs(this.position) - logoWidth;
                
                // Move first logo to the end without changing visual position
                this.slider.style.transform = `translate3d(0rem, 0, 0)`;
                this.slider.appendChild(firstLogo);
                
                // Update our array of all logos
                this.allLogos = [...this.slider.children];
                
                // Reset position accounting for the moved logo and overshoot
                this.position = -overshoot;
                this.totalShift += logoWidth;
            }

            // Reset transform values if they get too large
            this.resetTransformIfNeeded();

            // Apply the transform with hardware acceleration for smoother animation
            const adjustedPosition = this.position - this.totalShift;
            this.slider.style.transform = `translate3d(${adjustedPosition}rem, 0, 0)`;
            
            this.animationFrameId = requestAnimationFrame(tick);
        };

        this.animationFrameId = requestAnimationFrame(tick);
    }

    handleResize() {
        // Debounce resize handler
        if (this.resizeTimeout) {
            window.clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = window.setTimeout(() => {
            const viewportWidth = window.innerWidth;
            const sliderWidth = this.slider.offsetWidth;
            const requiredWidth = viewportWidth * 2;

            if (sliderWidth < requiredWidth) {
                const fragment = document.createDocumentFragment();
                this.logos.forEach(logo => {
                    const clone = logo.cloneNode(true);
                    clone.setAttribute('aria-hidden', 'true');
                    fragment.appendChild(clone);
                });
                this.slider.appendChild(fragment);
                // Update all logos after adding new clones
                this.allLogos = [...this.slider.children];
            }
        }, 150); // Debounce delay
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animation when tab is not visible
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            // Reset timestamp so we don't get a huge jump when returning
            this.lastTimestamp = null;
        } else {
            // Resume animation when tab becomes visible
            if (!this.animationFrameId) {
                this.animate();
            }
        }
    }

    destroy() {
        // Cleanup method
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.resizeTimeout) {
            window.clearTimeout(this.resizeTimeout);
        }
        window.removeEventListener('resize', this.handleResize.bind(this));
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        this.slider.style.willChange = 'auto';
        
        // Clean up added styles
        this.container.style.overflow = '';
        this.container.style.position = '';
        this.slider.style.position = '';
        this.slider.style.display = '';
        this.slider.style.width = '';
    }
}

export default LogoSlider;