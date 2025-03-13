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
                open: '/home.dev.html',
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
                        if (chunkInfo.name === 'plyr-embed') {
                            return 'plyr-embed.min.js';
                        }
                        return 'bundle.min.js';
                    },
                    chunkFileNames: (chunkInfo) => {
                        if (chunkInfo.name.includes('plyr')) {
                            return 'plyr-embed.min.js';
                        }
                        return 'bundle.min.js';
                    },
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name.endsWith('.css')) {
                            return 'bundle.min.css';
                        }
                        return 'assets/[name].[extname]';
                    },
                    manualChunks: (id) => {
                        // Keep plyr in its own chunk to prevent circular dependencies
                        if (id.includes('plyr.js') || id.includes('plyr/dist')) {
                            return 'plyr-vendor';
                        }
                        
                        // Keep video player components separate
                        if (id.includes('components/video-player')) {
                            return 'plyr-embed';
                        }
                        
                        // Everything else goes in the main bundle
                        return 'bundle';
                    }
                }
            },
            // Extracting CSS to a separate file is intentional for production
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