import { ScrollLocker } from './utils';
import { createIcons, Play } from 'lucide';

const scrollLocker = new ScrollLocker();

function addPlayButton(wrapper, video, videoSrc, lightboxVideo, videoLightbox) {
    if (!wrapper.querySelector('.video-play-button')) {
        const playButton = document.createElement('button');
        playButton.className = 'video-play-button';
        playButton.setAttribute('aria-label', 'Play video');
        
        // Create play icon element
        const iconElement = document.createElement('div');
        iconElement.dataset.lucide = 'play';
        iconElement.className = 'play-icon';
        playButton.appendChild(iconElement);
        
        wrapper.appendChild(playButton);

        // Handle click on the wrapper or play button
        const openLightbox = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Set the video source in the lightbox
            lightboxVideo.src = videoSrc || video.src;
            lightboxVideo.currentTime = 0;
            
            // Show lightbox
            videoLightbox.style.display = 'block';
            lightboxVideo.play();
        };

        wrapper.addEventListener('click', openLightbox);
        playButton.addEventListener('click', openLightbox);
    }
}

export function initVideoLightbox() {
    const videoLightbox = document.querySelector('[data-video-lightbox="true"]');
    const lightboxVideo = videoLightbox?.querySelector('video');
    
    if (!videoLightbox || !lightboxVideo) return;

    // Add play buttons to all portfolio gallery videos
    const portfolioWrappers = document.querySelectorAll('.portfolio4-gallery1_image-wrapper');
    portfolioWrappers.forEach(wrapper => {
        const video = wrapper.querySelector('.portfolio4-gallery1_video');
        const videoSrc = wrapper.getAttribute('data-video-src');
        
        if (!video) return;
        addPlayButton(wrapper, video, videoSrc, lightboxVideo, videoLightbox);
    });

    // Add play buttons to work items videos
    const workItemsVideos = document.querySelectorAll('.work-items-video');
    workItemsVideos.forEach(wrapper => {
        const video = wrapper.querySelector('video');
        const videoSrc = video?.getAttribute('data-src') || video?.src;
        
        if (video) {
            addPlayButton(wrapper, video, videoSrc, lightboxVideo, videoLightbox);
        }
    });

    // Add play buttons to header videos
    const headerVideos = document.querySelectorAll('.portfolio4-header_video');
    headerVideos.forEach(video => {
        // Create wrapper if it doesn't exist
        let wrapper = video.parentElement;
        if (!wrapper.classList.contains('video-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            video.parentNode.insertBefore(wrapper, video);
            wrapper.appendChild(video);
        }
        
        const videoSrc = wrapper.getAttribute('data-video-src') || video.getAttribute('data-video-src');
        addPlayButton(wrapper, video, videoSrc, lightboxVideo, videoLightbox);
    });

    // Initialize Lucide icons
    createIcons({
        icons: {
            Play
        }
    });

    // Handle lightbox close button
    const closeButton = videoLightbox.querySelector('[data-lightbox-close]');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            lightboxVideo.pause();
            videoLightbox.style.display = 'none';
        });
    }

    // Close lightbox on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoLightbox.style.display === 'block') {
            lightboxVideo.pause();
            videoLightbox.style.display = 'none';
        }
    });

    // Create a MutationObserver to watch for display changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style') {
                const display = videoLightbox.style.display;
                if (display === 'block') {
                    scrollLocker.lock();
                } else if (display === 'none') {
                    scrollLocker.unlock();
                }
            }
        });
    });

    // Start observing the video lightbox for style changes
    observer.observe(videoLightbox, {
        attributes: true,
        attributeFilter: ['style']
    });

    // Clean up when the page is unloaded
    window.addEventListener('beforeunload', () => {
        observer.disconnect();
        scrollLocker.unlock();
    });
}