# Tumblehead Website

A modern, component-based frontend implementation for the Tumblehead website, featuring an animated navbar, logo carousel, and embedded video player integration with Webflow CMS.

## Project Overview

This project has been refactored to follow a component-based architecture, improving organization, maintainability, and scalability. The codebase includes:

- **Component-based architecture** with self-contained UI modules
- **Plyr video player integration** for Webflow with lightbox functionality
- **Animated navbar** with scroll-aware behavior
- **Logo carousel** component
- **Modern build system** using Vite with optimized production output

## Directory Structure

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

## Components

### Video Player (Plyr Integration for Webflow)

A feature-rich video player implementation using Plyr, optimized for integration with Webflow CMS:

- **Preview Mode**: Autoplay (muted) videos as previews with centered play button
- **Lightbox Mode**: Expands to full-screen lightbox with unmuted playback
- **Scroll Locking**: Locks page scrolling when lightbox is open
- **Seamless Experience**: Preview continues playing when lightbox opens
- **Accessibility**: Full keyboard navigation and screen reader support

### Navbar

A responsive, animated navigation bar:

- Smooth fade-in/out animation based on scroll position
- Mobile-friendly with hamburger menu
- Scroll-aware visibility (hides when scrolling down, shows when scrolling up)
- Dropdown menu support

### Logo Carousel

A smooth, responsive logo carousel:

- Infinite scrolling
- Touch-enabled for mobile devices
- Pause on hover
- Configurable scroll speed and behavior

## Build System

The project uses Vite for fast development and optimized production builds:

### Entry Points

The build system maintains two distinct entry points:

1. **main.js**: Main application entry point, included in `bundle.min.js`
2. **webflow-plyr.js**: Standalone Webflow Plyr integration, builds to `plyr-embed.min.js`

### Output Files

The production build generates the following optimized files:

- **bundle.min.js**: Main application JavaScript
- **plyr-embed.min.js**: Standalone Webflow Plyr integration
- **bundle.min.css**: Combined CSS styles
- **index.html**: Production HTML template

CSS is intentionally kept as a separate file in production for:
- Parallel loading of CSS and JavaScript
- Prevention of Flash of Unstyled Content (FOUC)
- Better cache control

## Development Workflow

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

This starts a development server at http://localhost:3000 with the `index.dev.html` template.

### Production Build

```bash
npm run build
```

Generates optimized production files in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Integrating with Webflow

### Video Player Integration

To use the Plyr video player in Webflow:

1. Add this script tag to your Webflow project:
```html
<script src="https://your-domain.com/plyr-embed.min.js" type="module"></script>
```

2. Add video containers with the following structure:
```html
<div class="video-container">
  <div class="video-inner">
    <video 
      data-plyr="true" 
      data-preview-mode="true" 
      data-autoplay="true" 
      data-muted="true"
      data-src="your-video-url.mp4"
      data-poster="your-poster-image.jpg"
      playsinline
      loop>
    </video>
  </div>
</div>
```

3. Configure with data attributes:
   - `data-preview-mode="true"`: Enables preview/lightbox functionality
   - `data-autoplay="true"`: Autoplays in preview mode
   - `data-muted="true"`: Mutes in preview mode (unmutes in lightbox)
   - `data-src`: Video source URL
   - `data-poster`: Poster image URL

For detailed customization options, see the [Webflow Plyr CMS Integration](docs/webflow-plyr-cms-integration.md) documentation.

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Internet Explorer is not supported

## License

ISC 