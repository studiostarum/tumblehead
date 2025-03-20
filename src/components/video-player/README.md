# Video Player Component

A responsive, accessible video player component with Vimeo integration, featuring preview loops and lightbox functionality.

## Features

- 7-second preview loops
- Lightbox support
- Responsive design
- Accessibility features
- Automatic element injection
- Smart video quality selection
- Multiple video modes
- Webflow CMS compatible

## Usage

### Minimal HTML Structure

The component requires only the base container with data attributes. All other elements (preview wrapper, loading spinner, play button, lightbox, etc.) are automatically injected:

```html
<!-- With lightbox -->
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="https://vimeo.com/389461796" 
     data-video-start-time="15"
     data-video-end-time="45"
     tabindex="0" 
     role="button" 
     aria-label="Click to play video in fullbox">
</div>

<!-- Preview only -->
<div class="video-container" 
     data-video-mode="preview-only" 
     data-video-id="933270643"
     data-video-start-time="5"
     data-video-end-time="20">
</div>
```

### Required Attributes

- `class="video-container"` - Required for component initialization
- `data-video-mode` - Either "preview-with-lightbox" or "preview-only"
- `data-video-id` - Vimeo video URL or ID
- `tabindex="0"` - Required for lightbox mode (keyboard accessibility)
- `role="button"` - Required for lightbox mode (accessibility)
- `aria-label` - Required for lightbox mode (accessibility)

### Optional Attributes

- `data-video-start-time` - Start time in seconds for preview playback (default: 0)
- `data-video-end-time` - End time in seconds for preview playback (default: start time + 30)

### Webflow CMS Integration

In your Webflow CMS Collection Template:

```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="{{ wf {&quot;path&quot;:&quot;video-url&quot;,&quot;type&quot;:&quot;PlainText&quot;} }}"
     data-video-start-time="10"
     data-video-end-time="25"
     tabindex="0" 
     role="button" 
     aria-label="Click to play video in fullscreen">
</div>
```

### Supported Video URL Formats

The component accepts various Vimeo URL formats:

- Full URL: `https://vimeo.com/389461796`
- Player URL: `https://player.vimeo.com/video/389461796`
- Video ID: `389461796`
- Channel URL: `https://vimeo.com/channels/channelname/389461796`
- Group URL: `https://vimeo.com/groups/groupname/videos/389461796`

### Automatically Injected Elements

The component automatically creates and injects:

1. Preview wrapper with:
   - Loading spinner
   - Thumbnail image
   - Video iframe
   - Play button (for lightbox mode)

2. Lightbox container with:
   - Close button with icon
   - Content wrapper
   - Loading spinner
   - Video iframe

### Configuration

Video modes are configured in `VideoConfig.js`:

```javascript
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
        // ... configuration for preview-only mode
    }
};
```

## Styling

The component includes modular CSS files:

- `video-player.css` - Base styles
- `controls.css` - Play button and controls
- `loading.css` - Loading spinner and progress
- `lightbox.css` - Lightbox styles
- `responsive.css` - Responsive design rules

## Accessibility

The component includes:

- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- Reduced motion support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- Responsive design for all screen sizes

## Dependencies

- [@vimeo/player](https://github.com/vimeo/player.js) - Vimeo Player SDK
- [lucide](https://lucide.dev/) - Icon library 