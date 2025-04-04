export class VideoPlayer {
    constructor() {
        console.log('VideoPlayer constructor called');
        this.initializeAll();
        this.setupFinsweetEvents();
    }

    initializeAll() {
        // Get all lightbox videos
        this.videos = document.querySelectorAll('.lightbox-video video');
        console.log('Found videos:', this.videos.length);

        const lightboxComponents = document.querySelectorAll('.lightbox_component');
        console.log('Found lightbox components:', lightboxComponents.length);
        
        this.setupVideos();
        this.init();
        this.setupEscapeKey();
    }

    setupFinsweetEvents() {
        // Listen for Finsweet filter completion
        document.addEventListener('finsweet:cms:filter:finish', () => {
            console.log('Finsweet filter finished, reinitializing videos');
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                this.initializeAll();
            }, 100);
        });

        // Listen for Finsweet pagination events if needed
        document.addEventListener('finsweet:cms:pagination:finish', () => {
            console.log('Finsweet pagination finished, reinitializing videos');
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                this.initializeAll();
            }, 100);
        });
    }

    setupVideos() {
        this.videos.forEach((video, index) => {
            // Clean up existing event listeners if any
            const clonedVideo = video.cloneNode(true);
            video.parentNode.replaceChild(clonedVideo, video);
            
            // Ensure all required attributes are set
            clonedVideo.setAttribute('autoplay', '');
            clonedVideo.setAttribute('playsinline', '');
            clonedVideo.setAttribute('muted', '');
            clonedVideo.setAttribute('loop', '');
            clonedVideo.setAttribute('controls', '');
            
            // Force muted state and autoplay
            clonedVideo.muted = true;
            clonedVideo.play().catch(error => {
                console.warn(`Auto-play failed for video ${index}:`, error);
            });
        });
    }

    resetVideo(video) {
        const previousTime = video.currentTime;
        video.currentTime = 0;
        video.muted = true;
        
        console.log('Video reset:', {
            previousTime: previousTime.toFixed(2),
            newTime: video.currentTime,
            muted: video.muted,
            paused: video.paused,
            src: video.src
        });
        
        // Ensure video continues playing after reset
        video.play().catch(error => {
            console.warn('Video replay failed:', error);
        });
    }

    setupEscapeKey() {
        // Remove existing event listener if any
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }

        // Create new event handler
        this.escapeHandler = (event) => {
            if (event.key === 'Escape') {
                console.log('Escape key pressed');
                const visibleLightboxes = document.querySelectorAll('.lightbox_component[style*="opacity: 1"]');
                visibleLightboxes.forEach((lightbox, index) => {
                    const video = this.videos[index];
                    if (video) {
                        console.log('Resetting video due to escape key');
                        this.resetVideo(video);
                    }
                });
            }
        };

        // Add new event listener
        document.addEventListener('keydown', this.escapeHandler);
    }

    init() {
        // Get all close buttons and backdrops from all video components
        const lightboxComponents = document.querySelectorAll('.lightbox_component');
        console.log('Initializing lightbox components:', lightboxComponents.length);
        
        lightboxComponents.forEach((component, index) => {
            // Clean up existing event listeners
            const clonedComponent = component.cloneNode(true);
            component.parentNode.replaceChild(clonedComponent, component);

            const lightboxClose = clonedComponent.querySelector('.lightbox_close');
            const lightboxBackdrop = clonedComponent.querySelector('.lightbox_backdrop');
            const video = this.videos[index];

            if (lightboxClose) {
                console.log(`Lightbox close button found for video ${index}`);
                lightboxClose.addEventListener('click', () => {
                    console.log(`Lightbox close button clicked for video ${index}`);
                    if (video) this.resetVideo(video);
                });
            } else {
                console.warn(`Lightbox close button not found for video ${index}`);
            }

            if (lightboxBackdrop) {
                console.log(`Lightbox backdrop found for video ${index}`);
                lightboxBackdrop.addEventListener('click', () => {
                    console.log(`Lightbox backdrop clicked for video ${index}`);
                    if (video) this.resetVideo(video);
                });
            } else {
                console.warn(`Lightbox backdrop not found for video ${index}`);
            }
        });
    }
}