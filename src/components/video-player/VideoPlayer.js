import Player from '@vimeo/player';
import { createIcons, icons } from 'lucide';
import { VIDEO_MODES, PLAYER_CONFIG } from './VideoConfig';
import { getOptimalQuality, getVimeoThumbnail, updateLoadingProgress, buildVideoUrl, extractVimeoId } from './VideoUtils';
import { handleVideoError } from './VideoError';
import { scrollLock } from '../../utils/scroll-lock/index';

export class VideoPlayer {
    constructor() {
        this.players = new Map();
        this.videoContainers = document.querySelectorAll('.video-container');
        this.preloadedVideos = new Map();
        this.currentLightboxContainer = null;
        this.isLightboxOpen = false;
        this.activeVideos = new Set(); // Track currently playing videos
        this.isPageVisible = true; // Track page visibility
        this.resizeTimeout = null; // For debouncing resize events
        this.prefetchQueue = new Set(); // Track videos being prefetched
        this.hasScrolled = false; // Track if user has scrolled on small screens
        this.scrollThreshold = 20; // Percentage of scroll to trigger reveal
        this.scrollRevealElements = new Set(); // Track all scroll reveal elements
        this.aboutToRevealTimeout = null; // For debouncing about-to-reveal state

        // Initialize Intersection Observer for videos
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            threshold: 0.2,
            rootMargin: '50px'
        });

        // Initialize Scroll Reveal Observer
        this.scrollRevealObserver = new IntersectionObserver(this.handleScrollReveal.bind(this), {
            threshold: 0.2,
            rootMargin: this.getScrollRevealRootMargin()
        });

        // Initialize Prefetch Observer with larger rootMargin
        this.prefetchObserver = new IntersectionObserver(this.handlePrefetch.bind(this), {
            threshold: 0,
            rootMargin: '200px' // Start prefetching when video is 200px from viewport
        });

        // Create lightbox first
        this.createLightbox();
        
        // Then setup event listeners
        this.setupEventListeners();
        
        // Finally initialize
        this.init();
    }

    getScrollRevealRootMargin() {
        // Check if we're in landscape mode on mobile
        const isLandscapeMobile = window.matchMedia('(orientation: landscape) and (max-height: 767px)').matches;
        const isSmallScreen = window.innerWidth <= 767;
        
        // Return different rootMargin based on screen size and orientation
        if (isLandscapeMobile) {
            return '100px'; // Show later on landscape mobile
        }
        if (isSmallScreen) {
            return '50px'; // Default margin for small screens
        }
        return '50px'; // Default margin
    }

    handleScrollReveal(entries) {
        const isSmallScreen = window.innerWidth <= 767;
        
        entries.forEach(entry => {
            const element = entry.target;
            
            if (entry.isIntersecting) {
                // On small screens, only show if user has scrolled threshold down
                if (isSmallScreen) {
                    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                    
                    if (scrollPercent >= this.scrollThreshold || this.hasScrolled) {
                        // Clear any pending about-to-reveal timeout
                        if (this.aboutToRevealTimeout) {
                            clearTimeout(this.aboutToRevealTimeout);
                        }
                        
                        // Add visible class immediately
                        element.classList.add('visible');
                        this.hasScrolled = true;
                    } else if (scrollPercent >= this.scrollThreshold - 5) {
                        // When approaching threshold, add about-to-reveal class
                        element.classList.add('about-to-reveal');
                        
                        // Set timeout to remove about-to-reveal class if not scrolled further
                        this.aboutToRevealTimeout = setTimeout(() => {
                            if (!this.hasScrolled) {
                                element.classList.remove('about-to-reveal');
                            }
                        }, 1000);
                    }
                } else {
                    element.classList.add('visible');
                }
            } else if (isSmallScreen && !this.hasScrolled) {
                // On small screens, ensure elements stay hidden until scrolling begins
                element.classList.remove('visible', 'about-to-reveal');
            }
        });
    }

    updateScrollRevealRootMargin() {
        // Update the scroll reveal observer's rootMargin
        this.scrollRevealObserver.disconnect();
        this.scrollRevealObserver = new IntersectionObserver(this.handleScrollReveal.bind(this), {
            threshold: 0.2,
            rootMargin: this.getScrollRevealRootMargin()
        });

        // Re-observe all scroll reveal elements
        document.querySelectorAll('[data-scroll-reveal]').forEach(element => {
            this.scrollRevealObserver.observe(element);
        });
    }

    createLightbox() {
        // Create lightbox only if it doesn't exist
        if (!document.querySelector('.lightbox')) {
            const lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.setAttribute('role', 'dialog');
            lightbox.setAttribute('aria-label', 'Video player');

            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.setAttribute('aria-label', 'Close video');
            
            const closeIcon = document.createElement('i');
            closeIcon.setAttribute('data-lucide', 'x');
            closeButton.appendChild(closeIcon);

            const content = document.createElement('div');
            content.className = 'lightbox-content';

            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';

            const iframe = document.createElement('iframe');
            iframe.src = 'about:blank';
            iframe.allow = 'autoplay; fullscreen';
            iframe.title = 'Video player';

            content.appendChild(spinner);
            content.appendChild(iframe);
            lightbox.appendChild(closeButton);
            lightbox.appendChild(content);

            document.body.appendChild(lightbox);

            // Store lightbox references
            this.lightbox = lightbox;
            this.lightboxContent = content;
            this.closeButton = closeButton;

            // Initialize Lucide icons after the elements are in the DOM
            createIcons({ icons });
        } else {
            // If lightbox already exists, store references
            this.lightbox = document.querySelector('.lightbox');
            this.lightboxContent = this.lightbox.querySelector('.lightbox-content');
            this.closeButton = this.lightbox.querySelector('.close-button');
        }
    }

    createPreviewWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = 'preview-wrapper';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        wrapper.appendChild(spinner);

        return wrapper;
    }

    createPlayButton() {
        const playButton = document.createElement('div');
        playButton.className = 'play-button';
        playButton.setAttribute('role', 'button');
        playButton.setAttribute('aria-label', 'Play video');
        return playButton;
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            const containerId = entry.target.dataset.videoId;
            const mode = entry.target.dataset.videoMode;
            const playerKey = `${containerId}-${mode}`;
            const playerData = this.players.get(playerKey);
            
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // If we have a player and it's not already active, play it
                if (playerData && !this.activeVideos.has(playerKey)) {
                    this.activeVideos.add(playerKey);
                    playerData.player.play().catch(err => {
                        console.warn('Could not play video:', err);
                        this.activeVideos.delete(playerKey);
                    });
                }
            }
        });
    }

    async initializeContainer(container) {
        // Clean up existing player if it exists
        const playerKey = `${container.dataset.videoId}-${container.dataset.videoMode}`;
        const existingPlayerData = this.players.get(playerKey);
        if (existingPlayerData) {
            // Destroy existing player
            if (existingPlayerData.player) {
                await existingPlayerData.player.destroy();
            }
            // Remove from players map
            this.players.delete(playerKey);
        }

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const mode = container.dataset.videoMode;
        const rawVideoInput = container.dataset.videoId;
        const portraitVideoId = container.dataset.portraitVideoId;
        const videoId = extractVimeoId(rawVideoInput);
        const config = VIDEO_MODES[mode];
        
        if (!config || !videoId) {
            console.error('Invalid video configuration or URL:', rawVideoInput);
            return;
        }

        // Handle custom aspect ratios
        if (container.dataset.aspectRatio) {
            container.style.setProperty('--custom-aspect-ratio', container.dataset.aspectRatio);
        }
        if (container.dataset.mobileAspectRatio) {
            container.style.setProperty('--mobile-aspect-ratio', container.dataset.mobileAspectRatio);
        }

        // Update the data attribute with the extracted ID for consistency
        container.dataset.videoId = videoId;

        // Create and inject preview wrapper
        const previewWrapper = this.createPreviewWrapper();
        container.appendChild(previewWrapper);

        // Add play button if needed
        const playButton = config.showPlayButton ? this.createPlayButton() : null;
        if (playButton) {
            previewWrapper.appendChild(playButton);
        }

        // Create and add thumbnail
        const thumbnailUrl = await getVimeoThumbnail(videoId);
        if (thumbnailUrl) {
            const thumbnail = document.createElement('img');
            thumbnail.className = 'thumbnail';
            thumbnail.src = thumbnailUrl;
            thumbnail.alt = 'Video thumbnail';
            thumbnail.loading = 'lazy';
            previewWrapper.insertBefore(thumbnail, previewWrapper.firstChild);
        }

        // Create and insert preview iframe
        const quality = await getOptimalQuality();
        const previewIframe = document.createElement('iframe');
        
        // Set up portrait mode handling
        const handlePortraitMode = () => {
            if (portraitVideoId && window.matchMedia('(orientation: portrait)').matches) {
                const portraitUrl = buildVideoUrl(portraitVideoId, config.previewParams, quality);
                previewIframe.src = portraitUrl;
            } else {
                const landscapeUrl = buildVideoUrl(videoId, config.previewParams, quality);
                previewIframe.src = landscapeUrl;
            }
        };

        // Initial URL setup
        handlePortraitMode();

        // Listen for orientation changes
        window.addEventListener('orientationchange', handlePortraitMode);
        
        previewIframe.allow = 'autoplay; fullscreen';
        previewIframe.style.pointerEvents = 'none';
        previewWrapper.insertBefore(previewIframe, previewWrapper.firstChild);

        // Initialize Vimeo player
        const player = new Player(previewIframe);
        
        // Store player reference with container info
        this.players.set(playerKey, {
            container,
            player,
            wrapper: previewWrapper,
            videoId,
            portraitVideoId,
            isPlaying: false,
            handlePortraitMode
        });

        // Add play state handling
        player.on('play', () => {
            const playerData = this.players.get(playerKey);
            if (playerData) {
                playerData.isPlaying = true;
                
                // Force hide spinner with direct DOM manipulation
                const spinner = playerData.wrapper.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.style.display = 'none';
                    spinner.style.opacity = '0';
                    spinner.style.visibility = 'hidden';
                    spinner.classList.add('hidden');
                }
                
                previewIframe.classList.add('loaded');
                
                // Hide thumbnail once video is playing
                const thumbnail = previewWrapper.querySelector('.thumbnail');
                if (thumbnail) thumbnail.classList.add('hidden');
                
                // Show play button if present
                if (playButton) {
                    playButton.classList.add('visible');
                }
            }
        });

        player.on('pause', () => {
            const playerData = this.players.get(playerKey);
            if (playerData) {
                playerData.isPlaying = false;
            }
        });

        // Handle video load
        player.ready().then(async () => {
            try {
                const playerData = this.players.get(playerKey);
                if (!playerData) return;
                
                // Immediately hide spinner when player is ready
                const spinner = previewWrapper.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.style.display = 'none';
                    spinner.style.opacity = '0';
                    spinner.style.visibility = 'hidden';
                    spinner.classList.add('hidden');
                }

                // Always play the video if page is visible
                if (this.isPageVisible) {
                    this.activeVideos.add(playerKey);
                    await player.play();
                }

                // Get custom start and end times from data attributes (with defaults)
                const startTime = parseFloat(container.dataset.videoStartTime) || 0;
                const endTime = parseFloat(container.dataset.videoEndTime) || startTime + 30;
                
                // Set initial playback position if startTime is specified
                if (startTime > 0) {
                    await player.setCurrentTime(startTime);
                }

                // Set up preview duration control with custom times
                player.on('timeupdate', async (data) => {
                    if (data.seconds >= endTime) {
                        await player.setCurrentTime(startTime);
                        // Only auto-play again if this video is still active
                        if (this.activeVideos.has(playerKey)) {
                            await player.play();
                        }
                    }
                });

                // Add click handler for lightbox mode
                if (config.enableLightbox) {
                    container.addEventListener('click', () => {
                        this.openLightbox(container);
                    });
                }

            } catch (error) {
                console.error('Preview playback error:', error);
                handleVideoError(container, player);
            }
        });

        // Add resize event handling
        player.on('resize', (data) => {
            const { videoWidth, videoHeight } = data;
            const containerAspect = container.clientWidth / container.clientHeight;
            const videoAspect = videoWidth / videoHeight;
            
            previewIframe.style.position = 'absolute';
            previewIframe.style.top = '50%';
            previewIframe.style.left = '50%';
            previewIframe.style.transform = 'translate(-50%, -50%)';
            
            if (videoAspect > containerAspect) {
                // Video is wider - fit to height
                const height = container.clientHeight;
                const width = height * videoAspect;
                previewIframe.style.height = `${height}px`;
                previewIframe.style.width = `${width}px`;
            } else {
                // Video is taller - fit to width
                const width = container.clientWidth;
                const height = width / videoAspect;
                previewIframe.style.width = `${width}px`;
                previewIframe.style.height = `${height}px`;
            }
        });
    }

    setupEventListeners() {
        // Only set up lightbox events if we have a lightbox
        if (this.lightbox && this.closeButton) {
            // Close on button click
            this.closeButton.addEventListener('click', () => {
                this.closeLightbox();
            });

            // Close on escape key
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.isLightboxOpen) {
                    this.closeLightbox();
                }
            });

            // Close on click outside
            this.lightbox.addEventListener('click', (event) => {
                if (event.target === this.lightbox) {
                    this.closeLightbox();
                }
            });
        }

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = document.visibilityState === 'visible';
            this.handleVisibilityChange();
        });

        // Handle window resize with debouncing
        window.addEventListener('resize', () => {
            // Clear existing timeout
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            // Set new timeout
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
                this.updateScrollRevealRootMargin();
            }, 250); // Wait 250ms after last resize event
        });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            // Wait for orientation change to complete
            setTimeout(() => {
                this.updateScrollRevealRootMargin();
            }, 100);
        });

        // Add scroll event listener for small screens with throttling
        const isSmallScreen = window.innerWidth <= 767;
        if (isSmallScreen) {
            let lastScrollTime = 0;
            const scrollThrottle = 100; // Throttle to 100ms

            window.addEventListener('scroll', () => {
                const now = Date.now();
                if (now - lastScrollTime < scrollThrottle) return;
                lastScrollTime = now;

                const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                
                if (scrollPercent >= this.scrollThreshold && !this.hasScrolled) {
                    this.hasScrolled = true;
                    // Recheck all scroll reveal elements
                    this.scrollRevealElements.forEach(element => {
                        if (this.isElementInViewport(element)) {
                            element.classList.add('visible');
                            element.classList.remove('about-to-reveal');
                        }
                    });
                } else if (scrollPercent < this.scrollThreshold && this.hasScrolled) {
                    // If user scrolls back to top, reset the scroll state
                    this.hasScrolled = false;
                    this.scrollRevealElements.forEach(element => {
                        element.classList.remove('visible', 'about-to-reveal');
                    });
                }
            });
        }
    }

    openLightbox(container) {
        if (!this.lightbox || !this.lightboxContent) return;

        const videoId = container.dataset.videoId; // Always use landscape video for lightbox
        const mode = container.dataset.videoMode;
        const config = VIDEO_MODES[mode];
        
        // Get custom start time from data attribute if available
        const startTime = parseFloat(container.dataset.videoStartTime) || 0;
        
        // Get iframe and spinner
        const iframe = this.lightboxContent.querySelector('iframe');
        const spinner = this.lightboxContent.querySelector('.loading-spinner');
        
        // Show spinner while loading
        if (spinner) {
            spinner.style.display = 'block';
            spinner.classList.remove('hidden');
        }
        
        // Set up lightbox iframe with proper parameters
        const lightboxParams = {...config.lightboxParams};
        if (startTime > 0) {
            lightboxParams.t = startTime + 's';
        }
        const lightboxUrl = buildVideoUrl(videoId, lightboxParams);
        iframe.src = lightboxUrl;
        
        // Lock scrolling
        scrollLock.lock();
        
        // Show lightbox
        this.lightbox.classList.add('active');
        this.isLightboxOpen = true;
        container.classList.add('lightbox-active');
        this.currentLightboxContainer = container;

        // Initialize lightbox player
        const lightboxPlayer = new Player(iframe);
        lightboxPlayer.ready().then(() => {
            iframe.classList.add('loaded');
            if (spinner) {
                spinner.style.display = 'none';
                spinner.classList.add('hidden');
            }
        });
    }

    closeLightbox() {
        if (this.lightbox) {
            // Unlock scrolling
            scrollLock.unlock();
            
            this.lightbox.classList.remove('active');
            this.isLightboxOpen = false;
            
            if (this.currentLightboxContainer) {
                this.currentLightboxContainer.classList.remove('lightbox-active');
                this.currentLightboxContainer = null;
            }

            // Reset iframe src and show spinner for next time
            const iframe = this.lightboxContent?.querySelector('iframe');
            const spinner = this.lightboxContent?.querySelector('.loading-spinner');
            if (iframe) {
                iframe.src = 'about:blank';
                iframe.classList.remove('loaded');
            }
            if (spinner) {
                spinner.style.display = 'block';
                spinner.classList.remove('hidden');
            }
        }
    }

    handleResize() {
        // Only update scroll reveal root margin and prefetch observer
        this.updateScrollRevealRootMargin();

        // Update prefetch observer
        this.prefetchObserver.disconnect();
        this.prefetchObserver = new IntersectionObserver(this.handlePrefetch.bind(this), {
            threshold: 0,
            rootMargin: '200px'
        });

        // Re-observe containers for prefetching
        this.videoContainers.forEach(container => {
            if (!this.isElementInViewport(container)) {
                this.prefetchObserver.observe(container);
            }
        });
    }

    // Add a forceful cleanup method for spinners
    forceHideSpinners() {
        // Hide all spinners in the document
        document.querySelectorAll('.loading-spinner').forEach(spinner => {
            spinner.style.display = 'none';
            spinner.style.opacity = '0';
            spinner.style.visibility = 'hidden';
            spinner.classList.add('hidden');
        });
    }

    init() {
        // Initialize Lucide icons
        createIcons({ icons });

        // Initialize all video containers at once
        this.videoContainers.forEach(container => {
            this.initializeContainer(container);
        });

        // Set up scroll reveal observer and track elements
        document.querySelectorAll('[data-scroll-reveal]').forEach(element => {
            this.scrollRevealElements.add(element);
            this.scrollRevealObserver.observe(element);
        });
        
        // Force hide spinners after a delay to catch any that might still be visible
        setTimeout(() => {
            this.forceHideSpinners();
        }, 3000);
    }

    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Handle page visibility changes
    handleVisibilityChange() {
        if (this.isPageVisible) {
            // Resume videos when page becomes visible again
            this.activeVideos.forEach(playerKey => {
                const playerData = this.players.get(playerKey);
                if (playerData) {
                    playerData.player.play().catch(err => {
                        console.warn('Could not resume video:', err);
                    });
                }
            });
            
            // Force hide any spinners that might still be showing
            setTimeout(() => {
                this.forceHideSpinners();
            }, 1000);
        } else {
            // Pause all videos when page is not visible
            this.players.forEach((playerData, key) => {
                if (this.activeVideos.has(key)) {
                    playerData.player.pause().catch(err => {
                        console.warn('Could not pause video:', err);
                    });
                }
            });
        }
    }

    handlePrefetch(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target;
                const videoId = container.dataset.videoId;
                
                // Only prefetch if:
                // 1. We have a valid video ID
                // 2. The container hasn't been initialized yet
                // 3. The video isn't already in the prefetch queue
                // 4. The video ID is a valid Vimeo ID (numeric)
                if (videoId && 
                    !container.dataset.initialized && 
                    !this.prefetchQueue.has(videoId) &&
                    /^\d+$/.test(videoId)) {
                    
                    this.prefetchQueue.add(videoId);
                    this.preloadVideo(videoId)
                        .then(() => {
                            this.prefetchQueue.delete(videoId);
                        })
                        .catch(error => {
                            console.warn(`Failed to prefetch video ${videoId}:`, error);
                            this.prefetchQueue.delete(videoId);
                        });
                }
            }
        });
    }

    async preloadVideo(videoId) {
        try {
            // Skip if already prefetching or prefetched
            if (this.prefetchQueue.has(videoId)) {
                return Promise.resolve();
            }

            this.prefetchQueue.add(videoId);
            
            // Get optimal quality for prefetching
            const quality = await getOptimalQuality();
            
            // Create a temporary player for prefetching
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            
            // Use minimal parameters for faster loading
            iframe.src = buildVideoUrl(videoId, {
                background: 1,
                autoplay: 0,
                loop: 0,
                muted: 1,
                controls: 0,
                playsinline: 1,
                transparent: 1,
                autopause: 0,
                responsive: 0,
                dnt: 1,
                quality: quality,
                speed: 1,
                preload: 'auto',
                cache: 1,
                player_id: 0,
                api: 1,
                origin: window.location.origin
            });
            
            // Add to document temporarily
            document.body.appendChild(iframe);
            
            // Create a promise that resolves when the player is ready
            const loadPromise = new Promise((resolve, reject) => {
                const tempPlayer = new Player(iframe);
                
                // Set a shorter timeout for prefetching
                const timeout = setTimeout(() => {
                    document.body.removeChild(iframe);
                    reject(new Error('Prefetch timeout'));
                }, 3000); // Reduced to 3 seconds for faster feedback
                
                // Try to load the video
                tempPlayer.ready().then(() => {
                    clearTimeout(timeout);
                    // Remove the iframe after successful load
                    document.body.removeChild(iframe);
                    resolve();
                }).catch(error => {
                    clearTimeout(timeout);
                    document.body.removeChild(iframe);
                    reject(error);
                });
            });
            
            // Return the promise
            return loadPromise;
        } catch (error) {
            console.warn('Error prefetching video:', error);
            // Don't block the queue on error
            return Promise.resolve();
        }
    }
}

// Export initialization function
export function initVideoPlayer() {
    return new VideoPlayer();
}
