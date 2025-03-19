# Tumblehead Website

Custom Webflow features for the Tumblehead Animation website.

## Features

- Animated Navigation Bar
- [Video Player Component](src/components/video-player/README.md) with Vimeo Integration
  - 7-second preview loops
  - Lightbox support
  - Responsive design
  - Accessibility features
  - Zero-config HTML structure
- Webflow CMS Integration

## Quick Start

```html
<!-- Minimal Video Player Setup -->
<div class="video-container" 
     data-video-mode="preview-with-lightbox" 
     data-video-id="https://vimeo.com/389461796" 
     tabindex="0"
     role="button" 
     aria-label="Click to play video in fullscreen">
</div>
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── video-player/    # Video player component
│   │   └── ...
│   ├── main.js             # Main entry point
│   └── ...
├── package.json
└── vite.config.js
```

## Dependencies

- [@vimeo/player](https://github.com/vimeo/player.js) - Official Vimeo Player SDK
- [lucide](https://lucide.dev/) - Icon library
- [Vite](https://vitejs.dev/) - Build tool and development server

## Development

The project uses Vite for development and building. Key npm scripts:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run verify` - Verify build output
- `npm run deploy` - Build and prepare for Cloudflare deployment

## License

ISC License 