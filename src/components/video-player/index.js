export class VideoPlayer {
    constructor() {
        console.log('VideoPlayer constructor called');
        
        // Get all lightbox videos
        this.videos = document.querySelectorAll('.lightbox-video video');
        console.log('Found videos:', this.videos.length);

        const lightboxComponents = document.querySelectorAll('.lightbox_component');
        console.log('Found lightbox components:', lightboxComponents.length);
        
        this.setupVideos();
        this.init();
    }

    setupVideos() {
        this.videos.forEach((video, index) => {
            // Ensure all required attributes are set
            video.setAttribute('autoplay', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('muted', '');
            video.setAttribute('loop', '');
            video.setAttribute('controls', '');
            
            // Force muted state and autoplay
            video.muted = true;
            video.play().catch(error => {
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

    init() {
        // Get all close buttons and backdrops from all video components
        const lightboxComponents = document.querySelectorAll('.lightbox_component');
        console.log('Initializing lightbox components:', lightboxComponents.length);
        
        lightboxComponents.forEach((component, index) => {
            const lightboxClose = component.querySelector('.lightbox_close');
            const lightboxBackdrop = component.querySelector('.lightbox_backdrop');
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