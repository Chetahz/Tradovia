import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
export default defineConfig({
  root: root + 'preview',
  publicDir: root + 'public',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: {
    alias: {
      '@': root,
      'next/link': root + 'preview/link.tsx',
      'next/image': root + 'preview/image.tsx',
    },
  },
  build: { outDir: root + 'dist-preview', emptyOutDir: true },
});
