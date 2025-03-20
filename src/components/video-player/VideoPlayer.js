import Player from '@vimeo/player';
import { createIcons, icons } from 'lucide';
import { VIDEO_MODES, PLAYER_CONFIG } from './VideoConfig';
import { getOptimalQuality, getVimeoThumbnail, updateLoadingProgress, buildVideoUrl, extractVimeoId } from './VideoUtils';
import { handleVideoError } from './VideoError';

export class VideoPlayer {
    constructor() {
        this.players = new Map();
        this.videoContainers = document.querySelectorAll('.video-container');
        this.preloadedVideos = new Map();
        this.currentLightboxContainer = null;
        this.isLightboxOpen = false;

        // Initialize Intersection Observer
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Create lightbox first
        this.createLightbox();
        
        // Then setup event listeners
        this.setupEventListeners();
        
        // Finally initialize
        this.init();
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
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }

    async initializeContainer(container) {
        this.observer.observe(container);

        const mode = container.dataset.videoMode;
        const rawVideoInput = container.dataset.videoId;
        const videoId = extractVimeoId(rawVideoInput);
        const config = VIDEO_MODES[mode];
        
        if (!config || !videoId) {
            console.error('Invalid video configuration or URL:', rawVideoInput);
            return;
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
        const previewUrl = buildVideoUrl(videoId, config.previewParams, quality);
        
        previewIframe.src = previewUrl;
        previewIframe.allow = 'autoplay; fullscreen';
        previewIframe.style.pointerEvents = 'none';
        previewWrapper.insertBefore(previewIframe, previewWrapper.firstChild);

        // Initialize Vimeo player
        const player = new Player(previewIframe);
        
        // Store player reference with container info
        this.players.set(`${videoId}-${mode}`, {
            container,
            player,
            wrapper: previewWrapper,
            videoId
        });

        // Handle video load
        player.ready().then(async () => {
            try {
                await player.play();
                const spinner = previewWrapper.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.style.display = 'none'; // Completely hide the spinner
                    spinner.classList.add('hidden');
                }
                previewIframe.classList.add('loaded');
                const thumbnail = previewWrapper.querySelector('.thumbnail');
                if (thumbnail) thumbnail.classList.add('hidden');
                if (playButton) {
                    playButton.classList.add('visible');
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
                        await player.play();
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

        // Handle window resize for responsive behavior
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    openLightbox(container) {
        if (!this.lightbox || !this.lightboxContent) return;

        const videoId = container.dataset.videoId;
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
        // Update player dimensions or handle responsive behavior
        this.players.forEach(({ player }) => {
            player.getVideoHeight().then(height => {
                // Adjust player size if needed
            });
        });
    }

    init() {
        // Initialize Lucide icons
        createIcons({ icons });

        // Initialize each video container
        this.videoContainers.forEach(container => {
            this.initializeContainer(container);
        });
    }
}

// Export initialization function
export function initVideoPlayer() {
    return new VideoPlayer();
}
