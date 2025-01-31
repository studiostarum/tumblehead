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