export class VideoPlayer {
    constructor() {
        // Get all videos that match our criteria
        this.videos = document.querySelectorAll('.lightbox-video video');
        console.log('VideoPlayer initialized with', this.videos.length, 'videos');
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
        // Add click handlers for both lightbox close and backdrop
        const lightboxClose = document.querySelector('.lightbox_close');
        const lightboxBackdrop = document.querySelector('.lightbox_backdrop');

        if (lightboxClose) {
            console.log('Lightbox close button found and listener attached');
            lightboxClose.addEventListener('click', () => {
                console.log('Lightbox close button clicked');
                this.videos.forEach((video, index) => {
                    console.log(`Resetting video ${index}`);
                    this.resetVideo(video);
                });
            });
        } else {
            console.warn('Lightbox close button not found');
        }

        if (lightboxBackdrop) {
            console.log('Lightbox backdrop found and listener attached');
            lightboxBackdrop.addEventListener('click', () => {
                console.log('Lightbox backdrop clicked');
                this.videos.forEach((video, index) => {
                    console.log(`Resetting video ${index}`);
                    this.resetVideo(video);
                });
            });
        } else {
            console.warn('Lightbox backdrop not found');
        }
    }
}