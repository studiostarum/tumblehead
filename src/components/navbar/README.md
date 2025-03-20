# Scroll-Triggered Navbar Component

A JavaScript component that shows/hides a navbar based on scroll position relative to a trigger element, and reveals elements as they scroll into view.

## Usage

1. Add `data-scroll-trigger` attribute to the element that should trigger the navbar:
```html
<div data-scroll-trigger>
    <!-- Your content -->
</div>
```

2. Add `data-scroll-reveal` to any elements that should be hidden initially and revealed when they scroll into view:
```html
<div data-scroll-reveal>
    <!-- This content will be initially hidden and fade in when scrolled into view -->
</div>
```

3. The navbar will automatically initialize and handle show/hide behavior based on scroll position.

## Features

- Navbar appears when scrolling past the trigger element
- Elements with `data-scroll-reveal` are initially hidden and fade in when scrolled into view
- Smooth transitions using CSS transforms and opacity
- Respects user's reduced motion preferences
- Uses Intersection Observer for optimal performance
- Minimal CSS footprint to work with existing Webflow styles

## Technical Details

The component uses the Intersection Observer API to efficiently track when users scroll past the trigger element and when reveal elements enter the viewport. When the trigger element exits the viewport (scrolling up), the navbar appears with a smooth transition. Elements with `data-scroll-reveal` remain hidden until they enter the viewport. 