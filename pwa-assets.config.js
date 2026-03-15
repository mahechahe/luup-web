import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: {
    ...minimalPreset,
    maskable: {
      sizes: [512],
      padding: 0.15,
      resizeOptions: { background: 'transparent' },
    },
    apple: {
      sizes: [180],
      padding: 0.1,
      resizeOptions: { background: 'transparent' },
    },
  },
  images: ['public/logo.png'],
});
