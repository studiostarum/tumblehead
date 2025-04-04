export class VideoPlayer {
    constructor() {
        // Get all videos that match our criteria
        this.videos = document.querySelectorAll('video[autoplay][playsinline][muted][loop]');
        this.init();
    }

    resetVideo(video) {
        video.currentTime = 0; // Reset to beginning
        video.muted = true;    // Ensure video is muted
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