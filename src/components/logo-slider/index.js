export function LogoSlider() {
    const container = document.querySelector(".logo-slider__container");
    const slider = document.querySelector(".logo-slider");
    
    if (container && slider) {
        const copy = container.cloneNode(true);
        slider.appendChild(copy);
    }
}

// Only run if we're in a browser environment
if (typeof document !== 'undefined') {
    LogoSlider();
}

export default LogoSlider;
