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
        this.speed = 0.03125; // REM per frame

        // Add GPU optimization hint
        this.slider.style.willChange = 'transform';
        
        this.init();
    }

    pxToRem(px) {
        return px / parseFloat(getComputedStyle(document.documentElement).fontSize);
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
    }

    animate() {
        const tick = () => {
            this.position -= this.speed;
            
            // Get the width of one complete set of logos in REMs
            const firstSetWidthPx = this.logos[0].offsetWidth * this.logos.length;
            const firstSetWidthRem = this.pxToRem(firstSetWidthPx);
            
            // Instead of resetting abruptly, check if we need to seamlessly reset
            if (Math.abs(this.position) >= firstSetWidthRem) {
                // Adjust position by the width of one set to create seamless loop
                this.position += firstSetWidthRem;
            }

            // Apply the transform with hardware acceleration for smoother animation
            this.slider.style.transform = `translate3d(${this.position}rem, 0, 0)`;
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
    }
}

export default LogoSlider;