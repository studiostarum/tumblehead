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
- Auto-playing video previews with a centered play button
- Smooth transition to lightbox mode when clicked
- Playing videos from direct URL sources (MP4, WebM, MOV)
- Supporting YouTube and Vimeo embed URLs
- Compatibility with Webflow pagination, load more, and filtering
- Responsive layout with custom styling
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
  /* Video container styles */
  .video-container {
    position: relative;
    width: 100%;
    padding-top: 56.25%; /* 16:9 Aspect Ratio */
    overflow: hidden;
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }
  
  .video-inner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
  }
  
  .video-inner video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  /* Preview mode styling */
  .video-container.preview-mode {
    cursor: pointer;
  }
  
  .preview-play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
    background: rgba(255, 73, 77, 0.8);
    color: white;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }
  
  .preview-play-button:hover {
    transform: translate(-50%, -50%) scale(1.1);
    background: rgba(255, 73, 77, 1);
  }
  
  /* Lightbox mode styling */
  .video-lightbox-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0);
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }
  
  .video-lightbox-backdrop.active {
    opacity: 1;
    background: rgba(0, 0, 0, 0.85);
    pointer-events: all;
  }
  
  /* Lightbox container */
  .video-lightbox-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 1200px;
    height: 0;
    padding-top: 0;
    padding-bottom: calc(90% * 9 / 16); /* Maintain 16:9 aspect ratio */
    max-height: 90vh;
    z-index: 9999;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    display: none;
  }
  
  .video-lightbox-container.lightbox-mode {
    display: block;
    animation: scaleIn 0.4s ease forwards;
  }
  
  @keyframes scaleIn {
    0% {
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 0;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
  
  .lightbox-close {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    z-index: 10000;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  .lightbox-close.active {
    opacity: 1;
    pointer-events: all;
  }
</style>
```

3. In the **Footer** section, add:

```html
<!-- Plyr JS -->
<script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
<!-- Lucide icons (for play button) -->
<script src="https://unpkg.com/lucide@latest"></script>
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
<div class="video-container">
  <div class="video-inner">
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
<div class="video-container">
  <div class="video-inner">
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
  <div class="video-container">
    <div class="video-inner">
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

### Preview & Lightbox Mode Behavior

Our player implementation has two states that work together but remain separate in the DOM:

1. **Preview Mode**:
   - Auto-plays the video (muted) when the page loads
   - Shows only a centered play button (no player controls)
   - Acts as a teaser/preview of the content
   - Clicking anywhere on the video or the play button opens the lightbox
   - **Stays in place in your page layout**
   - **Continues playing while the lightbox is open**

2. **Lightbox Mode**:
   - Creates a new video container in a fixed position, separate from your original video
   - Shows a dark overlay behind the video
   - Displays a centered, larger player with full controls
   - **Begins playing from the same timestamp as the preview video**
   - Plays with sound (unmuted)
   - **Locks page scrolling** to keep focus on the video
   - Can be closed by clicking outside, pressing ESC, or the close button
   - When closed, the original preview video continues playing undisturbed
   - **Restores the exact scroll position** when closed

This approach ensures your page layout never breaks when videos are played in lightbox mode, as the original video element always stays in its original position. The continuous playback between preview and lightbox creates a seamless viewing experience.

### Video Player Options

Our implementation includes the following data attributes:

| Attribute | Description |
|-----------|-------------|
| `data-plyr="true"` | Identifies elements to be initialized with Plyr |
| `data-src` | Source URL for the video |
| `data-poster` | Poster/thumbnail image URL |
| `data-muted="true"` | Start video muted (default for preview mode) |
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
  
  /* Custom play button color */
  .preview-play-button {
    background: rgba(0, 115, 230, 0.8);  /* Match your brand color */
  }
  
  .preview-play-button:hover {
    background: rgba(0, 115, 230, 1);
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

1. **Videos not showing in preview mode:**
   - Check if the URL in your CMS is correct and directly points to a video file
   - Verify the video URL is accessible and doesn't require authentication
   - Make sure data attributes are correctly set
   - Check browser console for errors

2. **Preview auto-play not working:**
   - Auto-play is often blocked by browsers, especially on mobile
   - Videos must be muted to auto-play (our implementation handles this)
   - Try adding a poster image as a fallback when auto-play is blocked

3. **Lightbox not expanding properly:**
   - Check that your HTML structure matches the required structure
   - Ensure the video-container and video-inner classes are correctly applied
   - Verify that no CSS from your theme is conflicting with the lightbox styles

4. **Videos load but don't play:**
   - Some hosts block cross-origin video playback - ensure videos have proper CORS headers
   - Try adding `crossorigin="anonymous"` to your video tag
   - For autoplay, note that browsers restrict this without user interaction
   - Mobile devices may restrict autoplay regardless of settings

5. **Issues with CMS filtering or pagination:**
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