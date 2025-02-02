export function initVideoAutoplay() {
    const videos = document.querySelectorAll('video');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const video = entry.target;
            // Play the video if it's in view
            if (entry.isIntersecting) {
                // Use requestAnimationFrame to synchronize with the browser's repaint cycle
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        // Play the video if it's not already playing
                        if (video.paused) {
                            video.play().catch(error => console.error('Error trying to play the video:', error));
                        }
                    }, 150); // Slightly increased delay
                });
            }
            // Pause the video if it's out of view
            else {
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    }, { threshold: 0.05 }); // Adjust the threshold as needed

    // Observe each video
    videos.forEach(video => {
        observer.observe(video);
    });
}
