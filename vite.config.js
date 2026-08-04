import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    minify: true,
    cssMinify: true
  }
});
