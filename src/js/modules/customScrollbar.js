export function initCustomScrollbar() {
    const scrollableElements = document.querySelectorAll('.category-filter-menu, .category-filter-inner-menu');

    scrollableElements.forEach(element => {
        // Update scrollbar on load
        updateScrollbarPosition(element);

        // Update scrollbar on scroll
        element.addEventListener('scroll', () => {
            updateScrollbarPosition(element);
        });

        // Update on window resize
        window.addEventListener('resize', () => {
            updateScrollbarPosition(element);
        });
    });
}

function updateScrollbarPosition(element) {
    // Calculate scroll percentage
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;
    const scrollLeft = element.scrollLeft;
    
    // Only show scrollbar if content is scrollable
    if (scrollWidth <= clientWidth) {
        element.style.setProperty('--scrollbar-width', '0%');
        return;
    }

    // Calculate scrollbar width and position
    const scrollableWidth = scrollWidth - clientWidth;
    const scrollPercentage = scrollLeft / scrollableWidth;
    const scrollbarWidth = (clientWidth / scrollWidth) * 100;
    const scrollbarLeft = (scrollPercentage * (clientWidth - (clientWidth * (scrollbarWidth / 100)))) + 8; // 8px is the padding

    // Update CSS custom properties
    element.style.setProperty('--scrollbar-width', `${scrollbarWidth}%`);
    element.style.setProperty('--scrollbar-left', `${scrollbarLeft}px`);
} 