import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    esbuild: {
        loader: "jsx",
        include: /src\/.*\.jsx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            // Proxying API requests to the backend
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React — cached long-term
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // Auth — separate chunk, only needed after Clerk loads
                    'vendor-clerk': ['@clerk/clerk-react'],
                    // Icons — large tree, shared across pages
                    'vendor-icons': [
                        '@fortawesome/fontawesome-svg-core',
                        '@fortawesome/free-solid-svg-icons',
                        '@fortawesome/free-brands-svg-icons',
                        '@fortawesome/react-fontawesome',
                        'react-icons',
                        'lucide-react',
                    ],
                    // Animation libs
                    'vendor-animation': ['gsap', '@gsap/react', 'motion'],
                    // Networking & utilities
                    'vendor-utils': ['axios', 'socket.io-client', 'react-toastify'],
                },
            },
        },
    },
});
