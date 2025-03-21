/**
 * ScrollLock Utility
 * Handles scroll locking/unlocking while preventing content shift
 * by accounting for scrollbar width
 */

class ScrollLock {
    constructor() {
        this.isLocked = false;
        this.scrollbarWidth = this.calculateScrollbarWidth();
        // Add initial body class
        document.body.classList.add('scroll-lock');
        // Set scrollbar width as CSS variable
        document.documentElement.style.setProperty('--scrollbar-width', `${this.scrollbarWidth}px`);
    }

    /**
     * Calculate scrollbar width
     * @returns {number} Width of the scrollbar
     */
    calculateScrollbarWidth() {
        // Create a temporary div
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        document.body.appendChild(outer);

        // Create inner div
        const inner = document.createElement('div');
        outer.appendChild(inner);

        // Calculate width difference
        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

        // Clean up
        outer.parentNode.removeChild(outer);

        return scrollbarWidth;
    }

    /**
     * Lock scrolling
     */
    lock() {
        if (this.isLocked) return;

        // Store current scroll position
        this.scrollPosition = window.pageYOffset;

        // Add active class to body (scroll-lock class is already present)
        document.body.classList.add('active');
        document.body.style.top = `-${this.scrollPosition}px`;

        this.isLocked = true;
    }

    /**
     * Unlock scrolling
     */
    unlock() {
        if (!this.isLocked) return;

        // Remove only the active class
        document.body.classList.remove('active');
        const scrollPosition = this.scrollPosition;
        document.body.style.top = '';

        // Restore scroll position
        window.scrollTo(0, scrollPosition);

        this.isLocked = false;
    }
}

// Create and export a singleton instance
export const scrollLock = new ScrollLock(); 