import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export const aliases = {
  '@': path.resolve(__dirname, './src'),
  '@public': `${path.resolve(__dirname, './public/')}`,
  '@components': path.resolve(__dirname, './src/components'),
  '@auth': path.resolve(__dirname, './src/auth'),
  '@app': path.resolve(__dirname, './src/app'),
  '@shared': path.resolve(__dirname, './src/shared'),
  '@utils': path.resolve(__dirname, './src/utils'),
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: aliases,
  },
});
