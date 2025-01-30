# Tumblehead Website

This project contains the animated navbar implementation for the Tumblehead website.

## Project Structure

```
project-root/
├── src/
│   ├── js/
│   │   ├── modules/
│   │   │   ├── navbar.js
│   │   │   └── utils.js
│   │   └── main.js
│   └── styles/
│       └── navbar.css
├── public/
│   └── assets/
├── dist/
├── package.json
├── vite.config.js
└── README.md
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Development:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Features

- Animated navbar that fades in when scrolling past the hero section
- Smooth transitions and performance optimized
- Modern build setup with Vite

# Navbar Component Documentation

## Overview
The navbar component provides a smooth scroll-based visibility animation that automatically shows/hides the navigation bar based on the user's scroll position relative to a hero section. The navbar animation is active only on pages with a hero section and remains always visible on other pages.

## Features
- Smooth fade-in/fade-out animation with transform
- Context-aware behavior (animated with hero section, always visible without)
- Scroll position based visibility
- Performance optimized with throttling
- Semantic HTML with data attributes
- Clean destruction and event cleanup

## Implementation

### HTML Structure
Add the following data attributes to your HTML elements:

```html
<!-- Page with animated navbar (e.g., home page) -->
<body>
    <!-- Navbar element -->
    <nav data-navbar>
        <!-- Your navbar content -->
    </nav>

    <!-- Hero section -->
    <section data-hero>
        <!-- Your hero content -->
    </section>
</body>

<!-- Page with static navbar -->
<body>
    <nav data-navbar>
        <!-- Your navbar content -->
    </nav>
</body>
```

### Data Attributes
- `data-navbar`: Add to your navbar element
- `data-hero`: Add to your hero section element (only on pages where you want the navbar to animate)
- `data-state`: Automatically managed by the controller (values: "visible" | "hidden")

### JavaScript Usage
```javascript
import { initNavbar } from './js/modules/navbar';

// Initialize the navbar
const navbarController = initNavbar();

// Clean up when needed (e.g., page unmount)
navbarController.destroy();
```

### CSS Customization
The navbar uses the following CSS classes that you can customize:

```css
[data-navbar] {
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

[data-navbar][data-state="visible"] {
    opacity: 1;
    transform: translateY(0);
}
```

## Behavior
1. **Pages with Hero Section**:
   - Navbar starts hidden
   - Shows when scrolling past the hero section
   - Hides when scrolling back to the hero section
   - Smooth transition animations

2. **Pages without Hero Section**:
   - Navbar is always visible
   - No scroll-based animations
   - No event listeners attached

## Performance
- Uses throttling to optimize scroll event handling
- Event listeners are only attached when hero section is present
- Proper cleanup on destruction
- Passive scroll event listener for better scroll performance

## Browser Support
- Works in all modern browsers
- Uses standard CSS transforms and transitions
- No special polyfills required

## Troubleshooting
If the navbar isn't working as expected, check:
1. Data attributes are correctly set on your HTML elements
2. JavaScript is properly initialized
3. No CSS conflicts are overriding the transitions
4. Console for any error messages

## Error Handling
The component includes built-in error handling:
- Warns if hero section is not found
- Errors if navbar element is not found
- Graceful fallback to visible state if elements are missing 