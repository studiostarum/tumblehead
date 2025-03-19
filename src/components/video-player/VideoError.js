/**
 * Error handling functionality for video player
 */

const ERROR_MESSAGES = {
    default: 'Video playback error. Click to retry.',
    network: 'Network error. Check your connection and click to retry.',
    NotFoundError: 'Video not found. Please check the video ID.',
    InvalidVideoId: 'Invalid video ID provided.',
    PrivateVideoError: 'This video is private.',
    maxRetries: 'Too many retry attempts. Please refresh the page.'
};

const MAX_RETRIES = 3;

/**
 * Handle video playback errors
 * @param {HTMLElement} container Container element
 * @param {VimeoPlayer} player Vimeo player instance
 * @returns {Function} Cleanup function
 */
export function handleVideoError(container, player) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    container.appendChild(errorMessage);

    let retryCount = 0;
    let checkPlaybackInterval = null;
    let isPlaying = false;

    // Cleanup function for intervals
    const cleanup = () => {
        if (checkPlaybackInterval) {
            clearInterval(checkPlaybackInterval);
            checkPlaybackInterval = null;
        }
    };

    // Handle specific error types
    player.on('error', async (error) => {
        console.error('Video error:', error);
        errorMessage.textContent = ERROR_MESSAGES[error.name] || ERROR_MESSAGES.default;
        errorMessage.classList.add('visible');

        // Try to automatically recover from playback issues
        try {
            const state = await player.getPaused();
            if (!state) {
                await player.pause();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await player.play();
                errorMessage.classList.remove('visible');
            }
        } catch (e) {
            console.error('Auto-recovery failed:', e);
        }
    });

    // Monitor playback state
    player.on('play', () => {
        isPlaying = true;
        startPlaybackCheck();
    });

    player.on('pause', () => {
        isPlaying = false;
        cleanup();
    });

    player.on('ended', () => {
        isPlaying = false;
        cleanup();
    });

    // Periodic check for frozen playback
    function startPlaybackCheck() {
        cleanup(); // Clear any existing interval
        let lastTime = 0;
        let frozenCount = 0;

        checkPlaybackInterval = setInterval(async () => {
            if (isPlaying) {
                try {
                    const currentTime = await player.getCurrentTime();
                    if (currentTime === lastTime) {
                        frozenCount++;
                        if (frozenCount > 3) {
                            errorMessage.textContent = 'Playback frozen. Click to resume.';
                            errorMessage.classList.add('visible');
                            frozenCount = 0;
                        }
                    } else {
                        frozenCount = 0;
                    }
                    lastTime = currentTime;
                } catch (error) {
                    console.error('Error checking playback:', error);
                    cleanup();
                }
            }
        }, 1000);
    }

    // Handle retry attempts
    errorMessage.addEventListener('click', async () => {
        if (retryCount >= MAX_RETRIES) {
            errorMessage.textContent = ERROR_MESSAGES.maxRetries;
            return;
        }

        retryCount++;
        errorMessage.classList.remove('visible');

        try {
            // First try: reload using loadVideo
            if (retryCount === 1) {
                const videoId = new URL(player.element.src).pathname.split('/')[2];
                await player.loadVideo(videoId);
                await player.play();
            }
            // Second try: quality adjustment
            else if (retryCount === 2) {
                const newQuality = await getOptimalQuality();
                const videoId = new URL(player.element.src).pathname.split('/')[2];
                await player.loadVideo(videoId, { quality: newQuality });
                await player.play();
            }
            // Third try: complete iframe replacement
            else {
                cleanup(); // Clean up before replacing
                const oldIframe = player.element;
                const newIframe = document.createElement('iframe');
                newIframe.src = oldIframe.src;
                newIframe.className = oldIframe.className;
                newIframe.allow = oldIframe.allow;
                oldIframe.parentNode.replaceChild(newIframe, oldIframe);
                const newPlayer = new Vimeo.Player(newIframe);
                await newPlayer.play();
                // Update player reference
                Object.assign(player, newPlayer);
            }
        } catch (error) {
            console.error('Error during retry:', error);
            errorMessage.textContent = `Retry ${retryCount}/${MAX_RETRIES} failed. Click to try again.`;
            errorMessage.classList.add('visible');
        }
    });

    // Add network status monitoring
    if ('connection' in navigator) {
        navigator.connection.addEventListener('change', async () => {
            if (errorMessage.classList.contains('visible')) {
                const quality = await getOptimalQuality();
                const videoId = new URL(player.element.src).pathname.split('/')[2];
                try {
                    await player.loadVideo(videoId, { quality });
                    await player.play();
                    errorMessage.classList.remove('visible');
                } catch (error) {
                    console.error('Network change recovery failed:', error);
                }
            }
        });
    }

    return cleanup;
}
