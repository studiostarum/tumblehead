# Plyr for Webflow Documentation

This folder contains documentation for implementing the Plyr video player in Webflow projects.

## Available Documentation

- [Implementing Plyr with Webflow CMS and Direct Video URLs](./webflow-plyr-cms-integration.md) - A comprehensive guide for using Plyr with CMS collections and direct video URLs.
- [Direct URL Example Implementation](./direct-url-example.md) - Specific examples for implementing Plyr with direct video URLs from a CMS, including code samples and troubleshooting tips.

## Project Overview

The Tumblehead project includes a custom implementation of the Plyr video player specifically designed for Webflow integration. This implementation supports:

- Standard HTML5 video playback
- YouTube and Vimeo embeds
- Integration with Webflow CMS collections
- Support for direct video URLs
- Automatic initialization with Webflow pagination and filtering

## Building the Project

To build the custom Plyr implementation:

```bash
npm run build
```

This will generate the `plyr-embed.min.js` file in the `dist` folder, which can be used in Webflow projects.

## Resources

- [Plyr Official Documentation](https://github.com/sampotts/plyr)
- [Webflow CMS Documentation](https://university.webflow.com/lesson/cms-dynamic-content)
- [HTML5 Video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) 