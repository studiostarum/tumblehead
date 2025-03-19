export class LogoSlider {
    constructor() {
        this.container = document.querySelector('.logo-slider');
        if (!this.container) return;

        this.slider = this.container.querySelector('.logo-slider_track');
        if (!this.slider) return;

        this.logos = [...this.slider.children];
        if (!this.logos.length) return;

        this.init();
    }

    init() {
        // Calculate required clones
        const viewportWidth = window.innerWidth;
        const sliderWidth = this.slider.offsetWidth;
        const requiredWidth = viewportWidth * 2;
        const numClones = Math.ceil(requiredWidth / sliderWidth);

        // Clone logos
        for (let i = 0; i < numClones; i++) {
            this.logos.forEach(logo => {
                const clone = logo.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                this.slider.appendChild(clone);
            });
        }

        // Initialize animation
        this.animate();

        // Handle resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    animate() {
        let position = 0;
        const speed = 0.5; // Pixels per frame (slow speed)

        const tick = () => {
            position -= speed;

            // Reset position when we've scrolled one full set of logos
            const firstSetWidth = this.logos[0].offsetWidth * this.logos.length;
            if (Math.abs(position) >= firstSetWidth) {
                position = 0;
            }

            this.slider.style.transform = `translateX(${position}px)`;
            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }

    handleResize() {
        // Recalculate clone requirements on resize
        const viewportWidth = window.innerWidth;
        const sliderWidth = this.slider.offsetWidth;
        const requiredWidth = viewportWidth * 2;

        if (sliderWidth < requiredWidth) {
            this.logos.forEach(logo => {
                const clone = logo.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                this.slider.appendChild(clone);
            });
        }
    }
}

export default LogoSlider;