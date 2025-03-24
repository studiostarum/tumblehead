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
            autopause: 0,
            responsive: 0,
            dnt: 1,
            quality: '540p',
            speed: 1,
            preload: 'auto',
            cache: 1,
            player_id: 0,
            api: 1,
            origin: window.location.origin
        },
        lightboxParams: {
            autoplay: 1,
            controls: 1,
            autopause: 0,
            responsive: 0,
            dnt: 1,
            quality: '1080p',
            speed: 1,
            preload: 'auto',
            cache: 1,
            player_id: 0,
            api: 1,
            origin: window.location.origin
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
            autopause: 0,
            responsive: 0,
            dnt: 1,
            quality: '540p',
            speed: 1,
            preload: 'auto',
            cache: 1,
            player_id: 0,
            api: 1,
            origin: window.location.origin
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
        autopause: false,
        responsive: false,
        quality: '720p',
        speed: 1,
        preload: 'auto',
        cache: 1,
        player_id: 0,
        api: 1,
        origin: window.location.origin
    },
    lightbox: {
        autopause: false,
        muted: true,
        background: false,
        autopause: false,
        responsive: false,
        quality: '1080p',
        speed: 1,
        preload: 'auto',
        cache: 1,
        player_id: 0,
        api: 1,
        origin: window.location.origin
    }
};
