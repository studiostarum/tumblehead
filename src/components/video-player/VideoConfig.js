/**
 * Video player configuration
 * Defines different modes and their parameters for video playback
 */

export const VIDEO_MODES = {
    'preview-with-lightbox': {
        enableLightbox: true,
        showPlayButton: true,
        previewParams: {
            background: 1,
            autoplay: 1,
            loop: 1,
            muted: 1,
            controls: 0,
            playsinline: 1,
            transparent: 1,
            autopause: 0
        },
        lightboxParams: {
            autoplay: 1,
            controls: 1,
            autopause: 0
        }
    },
    'preview-only': {
        enableLightbox: false,
        showPlayButton: false,
        previewParams: {
            background: 1,
            autoplay: 1,
            loop: 1,
            muted: 1,
            controls: 0,
            playsinline: 1,
            transparent: 1,
            autopause: 0
        }
    }
};

export const PLAYER_CONFIG = {
    preview: {
        autopause: false,
        background: true,
        muted: true,
        loop: true,
        controls: false,
        playsinline: true,
        autopause: false
    },
    lightbox: {
        autopause: false,
        muted: true,
        background: false,
        autopause: false
    }
};
