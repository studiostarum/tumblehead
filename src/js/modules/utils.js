/**
 * Creates a throttled function that only invokes the provided function at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel` method to
 * cancel delayed invocations.
 *
 * @param {Function} func The function to throttle
 * @param {number} wait The number of milliseconds to throttle invocations to
 * @returns {Function} Returns the new throttled function
 */
export const throttle = (func, wait = 100) => {
    let timeout = null;
    let previous = 0;

    const throttled = function (...args) {
        const now = Date.now();

        if (!previous) {
            previous = now;
        }

        const remaining = wait - (now - previous);

        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(this, args);
            }, remaining);
        }
    };

    throttled.cancel = () => {
        clearTimeout(timeout);
        timeout = null;
        previous = 0;
    };

    return throttled;
};

/**
 * ScrollLocker utility class to manage scroll locking on the body
 */
export class ScrollLocker {
    constructor() {
        this.scrollPosition = 0;
        this.isLocked = false;
        this.originalStyle = {};
    }

    lock() {
        if (this.isLocked) return;

        // Store current scroll position and styles
        this.scrollPosition = window.scrollY;
        this.originalStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            width: document.body.style.width,
            height: document.body.style.height,
            top: document.body.style.top
        };

        // Apply locking styles
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = `-${this.scrollPosition}px`;

        this.isLocked = true;
    }

    unlock() {
        if (!this.isLocked) return;

        // Restore original styles
        document.body.style.overflow = this.originalStyle.overflow;
        document.body.style.position = this.originalStyle.position;
        document.body.style.width = this.originalStyle.width;
        document.body.style.height = this.originalStyle.height;
        document.body.style.top = this.originalStyle.top;

        // Restore scroll position
        window.scrollTo(0, this.scrollPosition);

        this.isLocked = false;
    }
} 