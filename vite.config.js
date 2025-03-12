import { defineConfig } from 'vite';
import { resolve } from 'path';

// Create different configs based on command (dev vs build)
export default defineConfig(({ command }) => {
    // Base configuration shared between dev and build
    const baseConfig = {
        root: 'src',
        publicDir: '../public',
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
                '@styles': resolve(__dirname, 'src/styles'),
                '@components': resolve(__dirname, 'src/components'),
                '@utils': resolve(__dirname, 'src/utils'),
                '@integrations': resolve(__dirname, 'src/integrations')
            }
        },
        css: {
            modules: false,
            postcss: {
                plugins: []
            },
            preprocessorOptions: {
                css: {
                    additionalData: '@import "./styles/main.css";'
                }
            }
        }
    };

    // Development specific configuration
    if (command === 'serve') {
        return {
            ...baseConfig,
            server: {
                open: '/index.dev.html',
                port: 3000
            }
        };
    }
    
    // Production build configuration
    return {
        ...baseConfig,
        build: {
            outDir: '../dist',
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'src/index.html'),
                },
                output: {
                    entryFileNames: (chunkInfo) => {
                        // Separate output for webflow-plyr integration
                        if (chunkInfo.name === 'webflowPlyr') {
                            return 'plyr-embed.min.js';
                        }
                        return 'bundle.min.js';
                    },
                    chunkFileNames: 'bundle.min.js',
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name.endsWith('.css')) {
                            return 'bundle.min.css';
                        }
                        return 'assets/[name].[extname]';
                    },
                    manualChunks: (id) => {
                        // Keep webflow-plyr integration separate from main bundle
                        if (id.includes('webflow-plyr') || id.includes('components/video-player') || id.includes('integrations/webflow')) {
                            return 'plyr-embed';
                        }
                        return 'bundle.min.js'; // Force all other JS into a single bundle
                    }
                }
            },
            // Extracting CSS to a separate file is intentional for production:
            // 1. Allows parallel loading of CSS and JS
            // 2. Prevents Flash of Unstyled Content (FOUC)
            // 3. Enables proper caching strategies
            cssCodeSplit: false,
            sourcemap: true,
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    passes: 2
                }
            }
        }
    };
}); 