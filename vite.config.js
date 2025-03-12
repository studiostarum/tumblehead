import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                dev: resolve(__dirname, 'src/index.dev.html'),
                plyrEmbed: resolve(__dirname, 'src/js/plyr-embed.js')
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    // Separate output for plyr embed
                    if (chunkInfo.name === 'plyrEmbed') {
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
                    // Keep plyr-embed separate from main bundle
                    if (id.includes('plyr-embed')) {
                        return 'plyr-embed';
                    }
                    return 'bundle.min.js'; // Force all other JS into a single bundle
                }
            }
        },
        cssCodeSplit: false,
        sourcemap: true,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false,
                passes: 2
            }
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@styles': resolve(__dirname, 'src/styles'),
            '@modules': resolve(__dirname, 'src/js/modules')
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
    },
    server: {
        open: '/index.dev.html',
        port: 3000
    }
}); 