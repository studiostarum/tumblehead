# Tumblehead Website

A modern, component-based frontend implementation for the Tumblehead website, featuring an animated navbar, logo carousel, and embedded video player integration with Webflow CMS.

---

## 1. Project Overview

This project has been refactored to follow a component-based architecture, improving organization, maintainability, and scalability. The codebase includes:

- **Component-based architecture** with self-contained UI modules
- **Plyr video player integration** for Webflow with lightbox functionality
- **Animated navbar** with scroll-aware behavior
- **Logo carousel** component
- **Modern build system** using Vite with optimized production output

---

## 2. Directory Structure

```
tumblehead/
├── dist/                # Production build output
├── docs/                # Documentation files
├── node_modules/        # Dependencies
├── scripts/             # Build and utility scripts
├── src/
│   ├── assets/          # Static assets
│   │   ├── icons/
│   │   └── images/
│   ├── components/      # Reusable UI components
│   │   ├── category-filters/
│   │   ├── hero/
│   │   ├── logo-carousel/
│   │   ├── navbar/
│   │   ├── project-grid/
│   │   └── video-player/
│   │       ├── index.js       # Main component exports
│   │       └── styles.css     # Component styles
│   ├── styles/          # Global styles
│   │   ├── main.css     # Main stylesheet
│   ├── utils/           # Utility functions
│   │   ├── dom.js       # DOM manipulation utilities
│   │   ├── scroll.js    # Scroll utilities
│   │   └── video.js     # Video utilities
│   ├── index.dev.html   # Development HTML template
│   ├── index.html       # Production HTML template
│   ├── main.js          # Main application entry point
├── .gitignore
├── package.json
├── README.md
├── REFACTORING.md
└── vite.config.js
```

---

## 3. Components

### 3.1 Video Player (Plyr Integration for Webflow)

A feature-rich video player implementation using Plyr, optimized for integration with Webflow CMS:

- **Preview Mode**: Autoplay (muted) videos with no controls
- **Lightbox Mode**: Expands to full-screen lightbox with unmuted playback and controls
- **Performance Optimized**:
  - Lazy loading with IntersectionObserver
  - Optimized for iOS Safari and Chrome
  - Smart preloading strategy
  - Reduced initial payload
- **Scroll Locking**: Locks page scrolling when lightbox is open
- **Seamless Experience**: Preview continues playing when lightbox opens
- **Accessibility**: Full keyboard navigation and screen reader support
- **Flexible Aspect Ratios**: Support for multiple aspect ratios including custom ratios

#### Quick Start

1. Add the script to your Webflow project:
```html
<script src="https://your-domain.com/plyr-embed.min.js" type="module"></script>
```

2. Add a video container with the required attributes:
```html
<!-- Preview Mode -->
<div class="video-container">
  <video 
    data-mode="preview"
    data-aspect-ratio="16:9"
    data-src="preview-video.mp4"
    data-poster="poster-image.jpg">
  </video>
</div>

<!-- Lightbox Mode with Preview -->
<div class="video-container">
  <video 
    data-mode="lightbox"
    data-aspect-ratio="16:9"
    data-src="full-quality-video.mp4"
    data-src-preview="preview-video.mp4"
    data-poster="poster-image.jpg">
  </video>
</div>
```

#### Configuration Options

| Attribute              | Values                                 | Description                                                     |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `data-mode`            | `preview`, `lightbox`                  | `preview`: Autoplay muted video with no controls<br>`lightbox`: Shows preview with play button, opens in lightbox |
| `data-aspect-ratio`    | `16:9`, `4:3`, `1:1`, `9:16`, `custom` | Sets video aspect ratio (default: 16:9)                         |
| `data-custom-ratio`    | `width:height`                         | Required when using custom aspect ratio                         |
| `data-src`             | URL                                    | Video source URL (full quality for lightbox)                    |
| `data-src-preview`     | URL                                    | Optional preview video URL (lighter version for lightbox preview) |
| `data-poster`          | URL                                    | Poster image URL                                                |
| `playsinline`          | -                                      | Prevents fullscreen on mobile                                   |
| `loop`                 | -                                      | Loops the video (recommended for preview mode)                   |

#### Performance Recommendations

1. **Video Formats**:
   - Use WebM format for preview videos when possible (better compression)
   - Keep preview videos under 2MB
   - Use appropriate video dimensions (don't load 1080p for small previews)

2. **Loading Strategy**:
   - Always provide a poster image for better perceived performance
   - Use `data-src-preview` for lighter versions of videos in lightbox mode
   - Videos are lazy-loaded as they approach the viewport

3. **Mobile Optimization**:
   - Preview videos should be short (10-15 seconds)
   - Use lower resolution/bitrate for preview videos
   - Ensure poster images are WebP format and optimized

For detailed customization options, see the [Webflow Plyr CMS Integration](docs/webflow-plyr-cms-integration.md) documentation.

---

### 3.2 Navbar

A responsive, animated navigation bar:

- Smooth fade-in/out animation based on scroll position
- Mobile-friendly with hamburger menu
- Scroll-aware visibility (hides when scrolling down, shows when scrolling up)
- Dropdown menu support

---

### 3.3 Logo Carousel

A smooth, responsive logo carousel with dynamic content duplication:

- **Infinite Scrolling**: Seamless continuous animation from right to left with logos always entering from the right
- **Viewport Filling**: Automatically duplicates logos to fill the entire viewport width plus extra buffer
- **Dynamic Content Duplication**: Calculates optimal number of duplicates based on viewport width
- **Responsive**: Adapts to viewport changes with ResizeObserver for smooth transitions
- **Performance Optimized**: Uses CSS transforms and minimal DOM manipulation for smooth animation
- **Visual Effects**: Grayscale filter with hover state for interactive client logos
- **Pause on Hover**: Animation pauses when user hovers over logos

---

## 4. Development Workflow

### 4.1 Installation

```bash
npm install
```

### 4.2 Development Server

```bash
npm run dev
```

This starts a development server at http://localhost:3000 with the `index.dev.html` template.

### 4.3 Production Build

```bash
npm run build
```

Generates optimized production files in the `dist/` directory.

### 4.4 Preview Production Build

```bash
npm run preview
```

---

## 5. Integrating with Webflow

### 5.1 Video Player Integration

The video player is designed to work seamlessly with Webflow CMS. Simply follow the [Quick Start](#quick-start) guide in the Components section above.

For detailed customization options and CMS integration specifics, see the [Webflow Plyr CMS Integration](docs/webflow-plyr-cms-integration.md) documentation.

---

## 6. Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Internet Explorer is not supported

---

## 7. License

ISC 