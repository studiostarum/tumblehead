# Video Player Guide for Clients

This guide explains how to use and customize the video player component on your website. The video player supports preview loops, lightbox viewing, and responsive design.

## Basic Setup

The simplest way to add a video is to copy and paste this code:

```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="YOUR_VIMEO_ID"
     tabindex="0"
     role="button" 
     aria-label="Click to play video in fullscreen">
</div>
```

Replace `YOUR_VIMEO_ID` with your Vimeo video ID (the numbers at the end of your Vimeo URL).

## Available Options

### Video Modes
- `preview-with-lightbox`: Shows a preview loop and opens in lightbox when clicked
- `preview-only`: Shows only the preview loop without lightbox option

### Basic Options
- `data-video-id`: Your Vimeo video ID or URL
- `data-video-start-time`: When to start the preview (in seconds)
- `data-video-end-time`: When to end the preview (in seconds)

### Portrait Mode Support
- `data-portrait-video-id`: A different video to show in portrait mode (9:16)
- `data-responsive`: Enable responsive sizing

### Custom Sizing
- `data-aspect-ratio`: Custom aspect ratio (e.g., "16/9")
- `data-mobile-aspect-ratio`: Different aspect ratio for mobile devices

## Examples

### Basic Preview with Lightbox
```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="123456789"
     tabindex="0"
     role="button" 
     aria-label="Click to play video in fullscreen">
</div>
```

### Preview with Custom Timing
```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="123456789"
     data-video-start-time="10"
     data-video-end-time="25"
     tabindex="0"
     role="button" 
     aria-label="Click to play video in fullscreen">
</div>
```

### Portrait Mode Support
```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="123456789"
     data-portrait-video-id="987654321"
     data-responsive
     tabindex="0"
     role="button" 
     aria-label="Click to play video in fullscreen">
</div>
```

### Custom Aspect Ratio
```html
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="123456789"
     data-aspect-ratio="21/9"
     data-mobile-aspect-ratio="16/9"
     data-responsive
     tabindex="0"
     role="button" 
     aria-label="Click to play video in fullscreen">
</div>
```

## Tips

1. **Finding Your Vimeo ID**
   - Go to your video on Vimeo
   - The ID is the numbers at the end of the URL
   - Example: `https://vimeo.com/123456789` → ID is `123456789`

2. **Timing Your Previews**
   - `data-video-start-time`: When to start (in seconds)
   - `data-video-end-time`: When to end (in seconds)
   - If not specified, preview starts at 0 and plays for 30 seconds

3. **Portrait Mode**
   - Use `data-portrait-video-id` for a different video in portrait mode
   - The portrait video should be in 9:16 aspect ratio
   - The lightbox will always show the landscape version

4. **Responsive Design**
   - Add `data-responsive` to enable automatic sizing
   - Use `data-aspect-ratio` for custom proportions
   - Use `data-mobile-aspect-ratio` for different mobile proportions

## Common Issues

1. **Video Not Playing**
   - Check if the Vimeo ID is correct
   - Make sure the video is public or unlisted
   - Verify the video hasn't been deleted

2. **Preview Timing Issues**
   - Ensure start and end times are within video duration
   - Times should be in seconds (whole numbers)

3. **Portrait Mode Not Working**
   - Verify both video IDs are correct
   - Make sure `data-responsive` is added
   - Check if device is actually in portrait mode

## Need Help?

If you need to make changes to the video player:
1. Locate the video container in your HTML
2. Add or modify the data attributes as needed
3. Save and refresh your page

For more complex changes, please contact your developer. 