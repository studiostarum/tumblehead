/**
 * Utility functions for video player functionality
 */

/**
 * Detect connection speed using the Network Information API
 * @returns {Promise<string>} Connection type (4g, 3g, 2g, etc.)
 */
export async function getConnectionSpeed() {
    if ('connection' in navigator) {
        return navigator.connection.effectiveType || '4g';
    }
    return '4g';
}

/**
 * Get optimal video quality based on connection speed
 * @returns {Promise<string>} Video quality setting
 */
export async function getOptimalQuality() {
    const speed = await getConnectionSpeed();
    const qualities = {
        'slow-2g': '360p',  // Lower quality for very slow connections
        '2g': '540p',
        '3g': '720p',
        '4g': '1080p'
    };
    return qualities[speed] || '720p'; // Default to 720p for better performance
}

/**
 * Fetch Vimeo video thumbnail
 * @param {string} videoId Vimeo video ID
 * @returns {Promise<string|null>} Thumbnail URL or null if not found
 */
export async function getVimeoThumbnail(videoId) {
    try {
        // Request a more appropriate size for previews
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=1280&height=720`);
        const data = await response.json();
        
        if (data.thumbnail_url) {
            // Use 720p for previews - good balance of quality and performance
            return data.thumbnail_url
                .replace(/_\d+x\d+\./, '_1280x720.')
                .replace(/&w=\d+&h=\d+/, '&w=1280&h=720');
        }
        return null;
    } catch (error) {
        console.error('Error fetching thumbnail:', error);
        return null;
    }
}

/**
 * Update loading progress bar
 * @param {VimeoPlayer} player Vimeo player instance
 * @param {HTMLElement} progressBar Progress bar element
 */
export function updateLoadingProgress(player, progressBar) {
    player.on('progress', data => {
        progressBar.style.width = (data.percent * 100) + '%';
    });
}

/**
 * Create a unique hash for video URLs
 * @returns {string} Unique hash string
 */
export function generateUniqueHash() {
    return `&h=${Math.random().toString(36).substring(7)}`;
}

/**
 * Build video URL with parameters
 * @param {string} videoId Vimeo video ID
 * @param {string} params URL parameters
 * @param {string} quality Video quality
 * @param {number} [startTime] Start time in seconds
 * @returns {string} Complete video URL
 */
export function buildVideoUrl(videoId, params, quality = null) {
    const urlParams = new URLSearchParams();
    
    // Add all params from config
    Object.entries(params).forEach(([key, value]) => {
        // Skip null values and duplicates
        if (value === null || urlParams.has(key)) return;
        
        // Handle special parameters
        if (key === 't') {
            urlParams.append('#t', value);
        } else {
            urlParams.append(key, value);
        }
    });

    // Add quality if provided and not already set
    if (quality && !urlParams.has('quality')) {
        urlParams.append('quality', quality);
    }

    // Add performance optimization parameters
    if (!urlParams.has('responsive')) {
        urlParams.append('responsive', '0');
    }
    if (!urlParams.has('dnt')) {
        urlParams.append('dnt', '1');
    }
    if (!urlParams.has('preload')) {
        urlParams.append('preload', 'auto');
    }

    // Add cache and performance hints
    urlParams.append('cache', '1');
    urlParams.append('player_id', '0');
    urlParams.append('api', '1');
    urlParams.append('origin', window.location.origin);

    return `https://player.vimeo.com/video/${videoId}?${urlParams.toString()}`;
}

/**
 * Extract Vimeo ID from various URL formats
 * @param {string} input URL or ID string
 * @returns {string|null} Vimeo ID or null if invalid
 */
export function extractVimeoId(input) {
    if (!input) return null;
    
    // Clean the input
    input = input.trim();
    
    // If it's just numbers, assume it's already an ID
    if (/^\d+$/.test(input)) {
        return input;
    }
    
    // Handle various URL formats
    const patterns = [
        /vimeo\.com\/(\d+)/,           // Standard URL
        /vimeo\.com\/video\/(\d+)/,    // /video/ URL
        /player\.vimeo\.com\/video\/(\d+)/, // Player URL
        /vimeo\.com\/channels\/[^\/]+\/(\d+)/, // Channel URL
        /vimeo\.com\/groups\/[^\/]+\/videos\/(\d+)/, // Group URL
    ];
    
    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}
