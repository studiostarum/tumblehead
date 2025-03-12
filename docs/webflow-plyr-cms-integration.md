# Implementing Plyr Video Player with Webflow CMS and Direct Video URLs

This guide explains how to integrate the Plyr video player with Webflow CMS collections using direct video URLs. This implementation allows you to create beautiful, customized video galleries with CMS-driven content.

## Table of Contents

- [Overview](#overview)
- [Setup Requirements](#setup-requirements)
- [Installation Process](#installation-process)
- [CMS Collection Configuration](#cms-collection-configuration)
- [HTML Implementation](#html-implementation)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)

## Overview

This implementation enables:
- Using Plyr's customizable video player interface with Webflow CMS
- Playing videos from direct URL sources (MP4, WebM, MOV)
- Supporting YouTube and Vimeo embed URLs
- Compatibility with Webflow pagination, load more, and filtering
- Responsive layout with Tailwind-like styling
- Lazy loading for better performance

## Setup Requirements

- A Webflow account with CMS functionality
- Direct video file URLs or YouTube/Vimeo video IDs
- Basic understanding of HTML and CSS
- Our custom Plyr implementation script (`plyr-embed.min.js`)

## Installation Process

### 1. Add Required Scripts and Styles to Your Webflow Project

Go to your Webflow project's settings:

1. **Project Settings** > **Custom Code**
2. In the **Head** section, add:

```html
<!-- Plyr CSS -->
<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
<style>
  /* Optional Tailwind-inspired styling */
  .relative { position: relative; }
  .absolute { position: absolute; }
  .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
  .w-full { width: 100%; }
  .h-full { height: 100%; }
  
  /* Set aspect ratio container */
  .aspect-video {
    position: relative;
    padding-top: 56.25%; /* 16:9 Aspect Ratio */
  }
</style>
```

3. In the **Footer** section, add:

```html
<!-- Plyr JS -->
<script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
<!-- Your custom Plyr implementation -->
<script src="https://your-cdn-url.com/plyr-embed.min.js"></script>
```

Replace `https://your-cdn-url.com/plyr-embed.min.js` with the actual URL where you host the script.

### 2. Hosting Your Custom Script

Options for hosting your `plyr-embed.min.js` file:

1. **Webflow Assets**:
   - Upload the file via the Webflow Assets panel
   - Copy the provided URL for use in the script tag

2. **CDN Services**:
   - Services like Cloudflare Pages, Netlify, or AWS S3
   - Upload your `dist/plyr-embed.min.js` file and use the public URL

3. **GitHub Pages**:
   - Create a GitHub repository
   - Upload your `plyr-embed.min.js` file
   - Enable GitHub Pages for direct linking

## CMS Collection Configuration

### 1. Create or Configure Your Video Collection

In Webflow CMS, create or modify a collection with these fields:

| Field Name | Type | Description |
|------------|------|-------------|
| Title | Plain Text | Video title |
| Video URL | Link | Direct link to your video file (mp4, webm, etc.) |
| Poster Image | Image | Thumbnail/poster for the video |
| Description | Plain Text | Video description (optional) |
| Category | Option | For filtering (optional) |

### 2. Important Field Notes

For the **Video URL** field:
- Use direct links to video files (e.g., `https://example.com/videos/my-video.mp4`)
- Supported formats: MP4, WebM, MOV
- For YouTube videos, store the video ID (e.g., `dQw4w9WgXcQ`)
- For Vimeo videos, store the video ID (e.g., `76979871`)

## HTML Implementation

### Direct Video URLs in Collection List

Add this custom code inside your Webflow collection list item:

```html
<div class="video-container aspect-video">
  <div class="absolute inset-0">
    <video 
      data-plyr="true"
      data-src="{{ wf {&quot;path&quot;:&quot;video-url&quot;,&quot;type&quot;:&quot;Link&quot;} }}"
      data-poster="{{ wf {&quot;path&quot;:&quot;poster-image&quot;,&quot;type&quot;:&quot;Image&quot;} }}"
      playsinline>
    </video>
  </div>
</div>
```

### YouTube or Vimeo in Collection List

For YouTube or Vimeo videos:

```html
<div class="video-container aspect-video">
  <div class="absolute inset-0">
    <div 
      data-plyr-provider="youtube" <!-- or "vimeo" -->
      data-plyr-embed-id="{{ wf {&quot;path&quot;:&quot;video-id&quot;,&quot;type&quot;:&quot;PlainText&quot;} }}">
    </div>
  </div>
</div>
```

### Complete Collection Item Example

```html
<div class="video-item">
  <!-- Video Container -->
  <div class="video-container aspect-video">
    <div class="absolute inset-0">
      <video 
        data-plyr="true"
        data-src="{{ wf {&quot;path&quot;:&quot;video-url&quot;,&quot;type&quot;:&quot;Link&quot;} }}"
        data-poster="{{ wf {&quot;path&quot;:&quot;poster-image&quot;,&quot;type&quot;:&quot;Image&quot;} }}"
        playsinline>
      </video>
    </div>
  </div>
  
  <!-- Video Information -->
  <h3 class="video-title">{{ wf {&quot;path&quot;:&quot;title&quot;,&quot;type&quot;:&quot;PlainText&quot;} }}</h3>
  <p class="video-description">{{ wf {&quot;path&quot;:&quot;description&quot;,&quot;type&quot;:&quot;PlainText&quot;} }}</p>
</div>
```

## Advanced Configuration

### Video Player Options

Our implementation includes the following data attributes:

| Attribute | Description |
|-----------|-------------|
| `data-plyr="true"` | Identifies elements to be initialized with Plyr |
| `data-src` | Source URL for the video |
| `data-poster` | Poster/thumbnail image URL |
| `data-muted="true"` | Start video muted |
| `data-autoplay="true"` | Attempt to autoplay when in view |
| `data-lazy-load="true"` | Enable lazy loading and viewing optimization |
| `data-plyr-provider` | For embeds: "youtube" or "vimeo" |
| `data-plyr-embed-id` | For embeds: the video ID |

### Webflow Interactions Support

The implementation includes built-in support for:
- Webflow's native pagination
- "Load More" buttons
- Finsweet CMS Filter
- Dynamic content changes

This means Plyr will automatically initialize on new videos as they're loaded.

### Customizing Player Appearance

Add this code to the **Head** section to customize the player:

```html
<style>
  /* Plyr Theme Customization */
  :root {
    --plyr-color-main: #0073e6;           /* Main theme color */
    --plyr-video-control-color: #ffffff;  /* Controls color */
    --plyr-menu-background: #ffffff;      /* Menu background */
    --plyr-menu-color: #4a5464;           /* Menu text color */
  }
  
  /* Rounded corners */
  .plyr {
    border-radius: 8px;
    overflow: hidden;
  }
  
  /* Larger play button */
  .plyr__control--overlaid {
    padding: 20px;
  }
  
  /* Progress bar height */
  .plyr--full-ui input[type=range] {
    height: 6px;
  }
</style>
```

## Troubleshooting

### Common Issues and Solutions

1. **Videos not showing:**
   - Check if the URL in your CMS is correct and directly points to a video file
   - Verify the video URL is accessible and doesn't require authentication
   - Make sure data attributes are correctly set
   - Check browser console for errors

2. **Plyr controls not appearing:**
   - Check that both Plyr CSS and JS are loading correctly
   - Verify your custom script is loading (check console)
   - Look for JavaScript errors in browser console

3. **Videos load but don't play:**
   - Some hosts block cross-origin video playback - ensure videos have proper CORS headers
   - Try adding `crossorigin="anonymous"` to your video tag
   - For autoplay, note that browsers restrict this without user interaction
   - Mobile devices may restrict autoplay regardless of settings

4. **Issues with CMS filtering or pagination:**
   - Check if the Finsweet attributes are correctly configured
   - Ensure the page has fully loaded before using filters
   - Try increasing the initialization delay in the script (current value: 500ms)

### Browser Compatibility

This implementation supports:
- Chrome 70+
- Firefox 68+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Android Chrome 70+

### Performance Optimization

- Use appropriately sized video files and compress them
- Enable lazy loading with `data-lazy-load="true"`
- Use poster images to provide immediate visual feedback
- Consider using adaptive bitrate streaming for large video collections

For any additional issues, check the [Plyr documentation](https://github.com/sampotts/plyr) or the browser console for specific error messages. 