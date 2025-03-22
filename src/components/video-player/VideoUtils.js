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
        'slow-2g': '540p',
        '2g': '720p',
        '3g': '1080p',
        '4g': '1440p'
    };
    return qualities[speed] || '1080p'; // Default to 1080p instead of auto
}

/**
 * Fetch Vimeo video thumbnail
 * @param {string} videoId Vimeo video ID
 * @returns {Promise<string|null>} Thumbnail URL or null if not found
 */
export async function getVimeoThumbnail(videoId) {
    try {
        // Request maximum size and quality in the oEmbed call
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=2560&height=1440`);
        const data = await response.json();
        
        // Try to get the highest quality thumbnail possible
        // First try the pictures object if available (newer API)
        if (data.thumbnail_url) {
            // Replace with the highest resolution possible
            // Vimeo supports: 1920x1080, 2560x1440, 3840x2160
            const highResUrl = data.thumbnail_url
                .replace(/_\d+x\d+\./, '_3840x2160.') // Try 4K first
                .replace(/&w=\d+&h=\d+/, '&w=3840&h=2160');
                
            // Verify if high-res exists, if not fallback to 1440p
            try {
                const testResponse = await fetch(highResUrl, { method: 'HEAD' });
                if (!testResponse.ok) {
                    return data.thumbnail_url
                        .replace(/_\d+x\d+\./, '_2560x1440.')
                        .replace(/&w=\d+&h=\d+/, '&w=2560&h=1440');
                }
                return highResUrl;
            } catch (e) {
                // Fallback to 1440p if 4K fails
                return data.thumbnail_url
                    .replace(/_\d+x\d+\./, '_2560x1440.')
                    .replace(/&w=\d+&h=\d+/, '&w=2560&h=1440');
            }
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
        // Skip null values
        if (value === null) return;
        
        // Handle special parameters
        if (key === 't') {
            urlParams.append('#t', value);
        } else {
            urlParams.append(key, value);
        }
    });

    // Add quality if provided
    if (quality) {
        urlParams.append('quality', quality);
    }

    // Disable responsive scaling
    urlParams.append('responsive', '0');
    urlParams.append('dnt', '1');

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
