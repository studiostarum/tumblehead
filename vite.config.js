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
                dev: resolve(__dirname, 'src/index.dev.html')
            },
            output: {
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith('.css')) {
                        return 'assets/[name].[hash].css';
                    }
                    return 'assets/[name].[hash][extname]';
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