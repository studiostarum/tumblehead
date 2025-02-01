/**
 * Video Autoplay Controller for Finsweet CMS Filter integration
 */
class VideoAutoplayController {
    constructor() {
        this.initialize();
    }

    /**
     * Initialize the video autoplay controller
     * @private
     */
    initialize() {
        // Initialize Finsweet attributes array if it doesn't exist
        window.fsAttributes = window.fsAttributes || [];
        
        // Push the CMS filter instance setup
        window.fsAttributes.push([
            'cmsfilter',
            (filterInstances) => {
                // Get the first instance
                const [filterInstance] = filterInstances;
                
                if (!filterInstance) {
                    console.warn('VideoAutoplay: No filter instance found');
                    return;
                }

                // Listen for render complete event
                filterInstance.listInstance.on('renderitems', () => this.handleVideoAutoplay());
            },
        ]);
    }

    /**
     * Handle video autoplay for all videos in the filtered content
     * @private
     */
    handleVideoAutoplay() {
        const videos = document.querySelectorAll('video[autoplay]');
        
        videos.forEach(video => {
            try {
                // Reset the video source to trigger autoplay
                const currentSrc = video.src;
                video.src = '';
                video.src = currentSrc;
                
                // Ensure autoplay attributes are set
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                
                // Force play (needed for some browsers)
                video.play().catch(error => {
                    console.warn('VideoAutoplay: Autoplay failed:', error);
                });
            } catch (error) {
                console.error('VideoAutoplay: Error handling video:', error);
            }
        });
    }
}

/**
 * Initialize the video autoplay controller
 * @returns {VideoAutoplayController} The controller instance
 */
export const initVideoAutoplay = () => {
    return new VideoAutoplayController();
}; 