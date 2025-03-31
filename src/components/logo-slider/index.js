export function LogoSlider() {
    const copy = document.querySelector(".logo-slider__container").cloneNode(true);
    document.querySelector(".logo-slider").appendChild(copy);
}

LogoSlider();

export default LogoSlider;
