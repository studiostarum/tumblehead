# Scroll Lock Utility

A utility for managing scroll locking without content shift. Perfect for modals, menus, and other overlay components.

## Features

- Prevents content shift when locking scroll
- Maintains scroll position after unlocking
- Smooth transitions with CSS
- Handles fixed elements padding automatically
- Zero dependencies

## Usage

```javascript
import { scrollLock } from './utils/scroll-lock';

// Lock scrolling (e.g., when opening a modal)
scrollLock.lock();

// Unlock scrolling (e.g., when closing a modal)
scrollLock.unlock();
```

## CSS Classes

The utility uses two classes to manage scroll states:

- `.scroll-lock` - Base class, always present
- `.scroll-lock.active` - Added when scroll is locked

## Example with Modal

```javascript
const modal = document.querySelector('.modal');
const openButton = document.querySelector('.open-modal');
const closeButton = document.querySelector('.close-modal');

openButton.addEventListener('click', () => {
    modal.classList.add('visible');
    scrollLock.lock();
});

closeButton.addEventListener('click', () => {
    modal.classList.remove('visible');
    scrollLock.unlock();
});
```

## How It Works

1. The utility adds a `.scroll-lock` class to the body on initialization
2. When locking, it:
   - Stores the current scroll position
   - Adds `.active` class to body
   - Sets body position to fixed
   - Maintains the visual position using negative top offset
3. When unlocking, it:
   - Removes the `.active` class
   - Restores the original scroll position
   - Removes the fixed positioning

## Browser Support

Works in all modern browsers that support:
- CSS position: fixed
- classList API
- pageYOffset
- window.scrollTo() 