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

## Usage with Webflow

After building the project:

1. Copy the contents of `dist/js/main.js` to your Webflow project's custom code section
2. Ensure your hero section has the class `section-hero-a`
3. The navbar will automatically hide/show based on scroll position

## Features

- Animated navbar that fades in when scrolling past the hero section
- Smooth transitions and performance optimized
- Modern build setup with Vite
- Legacy browser support 