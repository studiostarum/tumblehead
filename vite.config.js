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
            }
        }
    };

    // Development specific configuration
    if (command === 'serve') {
        return {
            ...baseConfig,
            server: {
                open: 'index.html',
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
                    'bundle': resolve(__dirname, 'src/main.js'),
                },
                output: {
                    format: 'iife',
                    entryFileNames: '[name].min.js',
                    chunkFileNames: '[name].min.js',
                    assetFileNames: (assetInfo) => {
                        const info = assetInfo.name.split('.');
                        const extType = info[info.length - 1];
                        if (/\.(mp4|webm|ogg)$/i.test(assetInfo.name)) {
                            return `media/[name][extname]`;
                        }
                        if (/\.(woff|woff2|eot|ttf|otf)$/i.test(assetInfo.name)) {
                            return `fonts/[name][extname]`;
                        }
                        if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
                            return `images/[name][extname]`;
                        }
                        if (extType === 'css') {
                            return `bundle.min.css`;
                        }
                        return `assets/[name][extname]`;
                    }
                }
            },
            cssCodeSplit: false,
            sourcemap: false,
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true,
                    passes: 2
                },
                format: {
                    comments: false
                }
            }
        }
    };
}); 