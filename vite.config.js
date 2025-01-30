import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    plugins: [],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: 'src/js/main.js',
            output: {
                // Generic bundle name with min suffix
                entryFileNames: 'bundle.min.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name.endsWith('.css')) {
                        return 'bundle.min.css';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
                // Ensure all CSS is bundled into one file
                manualChunks: undefined,
                inlineDynamicImports: true
            }
        },
        // Disable code splitting
        cssCodeSplit: false,
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                passes: 2
            },
            mangle: true
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    },
    css: {
        // Ensure CSS is extracted to a single file
        modules: false,
        // Add CSS minification options
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