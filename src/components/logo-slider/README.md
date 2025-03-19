# Logo Slider Component

A smooth, infinite-scrolling logo slider component that works seamlessly with Webflow CMS.

## Features

- Automatic infinite scrolling
- Smooth animation with GPU acceleration
- Responsive design
- Dynamic logo cloning for seamless loops
- Webflow CMS integration ready
- No pause on hover
- Optimized performance

## Usage in Webflow

```html
<!-- Basic Logo Slider Setup -->
<div class="logo-slider">
    <div class="logo-slider_track">
        <!-- Webflow Collection List -->
        <div class="logo-slider_item">
            <img src="[Logo Image Field]" alt="[Company Name Field]" loading="lazy">
        </div>
        <!-- End Collection List -->
    </div>
</div>
```

## CSS Classes

- `.logo-slider` - Main container
- `.logo-slider_track` - Scrolling track container
- `.logo-slider_item` - Individual logo container
- `.logo-slider_item img` - Logo image

## Technical Details

- Uses `requestAnimationFrame` for smooth animation
- Implements GPU acceleration via `transform3d`
- Automatically calculates required clones based on viewport width
- Handles window resize events
- Default scroll speed: 0.5px per frame (configurable)

## Implementation Notes

1. Create a Webflow Collection for logos
2. Add required fields:
   - Logo Image (Asset field)
   - Company Name (for alt text)
3. Create a Collection List
4. Apply the provided class structure
5. Add the component's JavaScript to your project

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest) 