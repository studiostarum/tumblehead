import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'src',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, 'src/js/main.js'),
            output: {
                entryFileNames: 'bundle.min.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith('.css')) {
                        return 'bundle.min.css';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
                manualChunks: undefined,
                inlineDynamicImports: true
            }
        },
        cssCodeSplit: false,
        sourcemap: true,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false,
                passes: 2
            },
            mangle: true
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    css: {
        modules: false,
        postcss: {
            minimize: true,
            minify: true
        }
    },
    server: {
        open: true,
        port: 3000
    }
}); 