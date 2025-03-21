export class LogoSlider {
    constructor() {
        this.container = document.querySelector('.logo-slider');
        if (!this.container) return;

        this.slider = this.container.querySelector('.logo-slider_track');
        if (!this.slider) return;

        // Get only non-aria-hidden logos as originals
        this.logos = [...this.slider.children].filter(logo => !logo.getAttribute('aria-hidden'));
        if (!this.logos.length) return;

        // Clean up any existing clones
        [...this.slider.children].forEach(child => {
            if (child.getAttribute('aria-hidden')) {
                this.slider.removeChild(child);
            }
        });

        this.animationFrameId = null;
        this.resizeTimeout = null;
        this.position = 0;
        this.speed = 0.03125; // REM per frame
        this.totalShift = 0; // Track total shift for position calculations

        // Add GPU optimization hint
        this.slider.style.willChange = 'transform';
        
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
        // Calculate minimum required clones based on viewport width
        const viewportWidth = window.innerWidth;
        const singleSetWidth = this.logos.reduce((total, logo) => total + logo.offsetWidth, 0);
        const minSetsNeeded = Math.ceil((viewportWidth * 1.5) / singleSetWidth);
        const numClones = Math.max(1, minSetsNeeded - 1); // Ensure at least one set of clones

        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();

        // Clone logos only as many times as needed
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

    animate() {
        const tick = () => {
            this.position -= this.speed;
            
            // Check if first logo is out of view
            const firstLogo = this.allLogos[0];
            const logoWidth = this.pxToRem(firstLogo.offsetWidth);
            
            if (Math.abs(this.position) >= logoWidth) {
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
            // Clean up existing clones
            [...this.slider.children].forEach(child => {
                if (child.getAttribute('aria-hidden')) {
                    this.slider.removeChild(child);
                }
            });

            // Recalculate minimum required clones
            const viewportWidth = window.innerWidth;
            const singleSetWidth = this.logos.reduce((total, logo) => total + logo.offsetWidth, 0);
            const minSetsNeeded = Math.ceil((viewportWidth * 1.5) / singleSetWidth);
            const numClones = Math.max(1, minSetsNeeded - 1);

            const fragment = document.createDocumentFragment();
            for (let i = 0; i < numClones; i++) {
                this.logos.forEach(logo => {
                    const clone = logo.cloneNode(true);
                    clone.setAttribute('aria-hidden', 'true');
                    fragment.appendChild(clone);
                });
            }
            
            this.slider.appendChild(fragment);
            // Update all logos after adding new clones
            this.allLogos = [...this.slider.children];
            
            // Reset position and shift to prevent jumps
            this.position = 0;
            this.totalShift = 0;
            this.slider.style.transform = 'translate3d(0rem, 0, 0)';
        }, 150); // Debounce delay
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animation when tab is not visible
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
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

        // Clean up clones on destroy
        [...this.slider.children].forEach(child => {
            if (child.getAttribute('aria-hidden')) {
                this.slider.removeChild(child);
            }
        });
    }
}

export default LogoSlider;