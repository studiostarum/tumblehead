export class VideoPlayer {
    constructor() {
        // Get all videos that match our criteria
        this.videos = document.querySelectorAll('video[autoplay][playsinline][muted][loop]');
        this.setupVideos();
        this.init();
    }

    setupVideos() {
        this.videos.forEach(video => {
            // Ensure all required attributes are set
            video.setAttribute('autoplay', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('muted', '');
            video.setAttribute('loop', '');
            
            // Force muted state and autoplay
            video.muted = true;
            video.play().catch(error => {
                console.warn('Auto-play failed:', error);
            });
        });
    }

    resetVideo(video) {
        video.currentTime = 0;
        video.muted = true;
        
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
            lightboxClose.addEventListener('click', () => {
                this.videos.forEach(video => this.resetVideo(video));
            });
        }

        if (lightboxBackdrop) {
            lightboxBackdrop.addEventListener('click', () => {
                this.videos.forEach(video => this.resetVideo(video));
            });
        }
    }
}