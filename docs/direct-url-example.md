# Plyr with Direct Video URLs from Webflow CMS

This document provides a specific example of implementing Plyr with direct video URLs from a Webflow CMS collection.

## CMS Setup

1. Create a Webflow CMS collection named "Videos"
2. Add the following fields:
   - **Name**: Title (Type: Plain Text)
   - **Name**: Video URL (Type: Link)
   - **Name**: Poster Image (Type: Image)
   - **Name**: Description (Type: Rich Text)

## HTML Implementation

### Basic Implementation

Here's the HTML code to add to your Webflow custom code embed within a Collection List item:

```html
<div class="video-container relative w-full" style="padding-top: 56.25%;">
  <div class="absolute inset-0 w-full h-full">
    <video 
      data-plyr="true"
      data-src="{{ wf {&quot;path&quot;:&quot;video-url&quot;,&quot;type&quot;:&quot;Link&quot;} }}"
      data-poster="{{ wf {&quot;path&quot;:&quot;poster-image&quot;,&quot;type&quot;:&quot;Image&quot;} }}"
      playsinline>
    </video>
  </div>
</div>
```

### Responsive Grid Layout

For a responsive grid layout with multiple videos:

```html
<div class="video-grid">
  <!-- Inside your Collection List wrapper -->
  <div class="w-dyn-list">
    <div class="video-grid-inner w-dyn-items">
      <!-- Inside your Collection List item -->
      <div class="video-item w-dyn-item">
        <div class="video-container relative w-full" style="padding-top: 56.25%;">
          <div class="absolute inset-0 w-full h-full">
            <video 
              data-plyr="true"
              data-src="{{ wf {&quot;path&quot;:&quot;video-url&quot;,&quot;type&quot;:&quot;Link&quot;} }}"
              data-poster="{{ wf {&quot;path&quot;:&quot;poster-image&quot;,&quot;type&quot;:&quot;Image&quot;} }}"
              playsinline>
            </video>
          </div>
        </div>
        <h3 class="video-title">{{ wf {&quot;path&quot;:&quot;title&quot;,&quot;type&quot;:&quot;PlainText&quot;} }}</h3>
        <div class="video-description">{{ wf {&quot;path&quot;:&quot;description&quot;,&quot;type&quot;:&quot;RichText&quot;} }}</div>
      </div>
    </div>
  </div>
</div>

<!-- Add this CSS to your project's custom code or create a style tag -->
<style>
  .video-grid-inner {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 2rem;
  }
  
  @media (min-width: 640px) {
    .video-grid-inner {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .video-grid-inner {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  .video-title {
    margin-top: 1rem;
    font-weight: 600;
    font-size: 1.25rem;
  }
  
  .video-description {
    margin-top: 0.5rem;
  }
  
  .video-container {
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
</style>
```

## Testing with Sample Videos

Here are some sample MP4 URLs you can use for testing:

1. Big Buck Bunny (public domain): `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`

2. Elephants Dream (public domain): `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`

3. Tears of Steel (public domain): `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4`

Add these URLs to your CMS collection for testing.

## Troubleshooting Direct URLs

If your videos aren't playing, check these common issues:

1. **CORS Restrictions**: The video host must allow cross-origin requests. Add `crossorigin="anonymous"` to your video tag if needed.

2. **Content-Type Header**: The server hosting your video should provide the correct Content-Type header (e.g., `video/mp4`).

3. **File Format**: Make sure the file extension matches the actual format. Our script attempts to detect the format based on the file extension.

4. **URL Validity**: Ensure the URL is directly accessible and doesn't redirect or require authentication.

## Progressive Enhancement

For better user experience, consider implementing:

1. **Loading State**:
```html
<div class="video-loading absolute inset-0 flex items-center justify-center bg-gray-200" data-loading-indicator>
  <div class="spinner"></div>
</div>
```

2. **Fallback**:
```html
<div class="fallback-message" style="display: none;">
  Video could not be loaded. <a href="{{ wf {&quot;path&quot;:&quot;video-url&quot;,&quot;type&quot;:&quot;Link&quot;} }}" target="_blank">Watch directly</a>.
</div>

<script>
  // Add this if you're concerned about compatibility
  document.addEventListener('DOMContentLoaded', function() {
    const videoElements = document.querySelectorAll('video[data-plyr="true"]');
    videoElements.forEach(video => {
      video.addEventListener('error', function() {
        const fallback = this.closest('.video-item').querySelector('.fallback-message');
        if (fallback) fallback.style.display = 'block';
      });
    });
  });
</script>
```

This will ensure users have a good experience even if videos can't be loaded properly. 