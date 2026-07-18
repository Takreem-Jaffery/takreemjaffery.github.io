import { defineConfig } from 'vite';

// base: './' makes the build use relative asset paths, so it works whether
// you deploy to a GitHub Pages *project* site (username.github.io/repo-name)
// or a *user/org* site (username.github.io) without editing this file.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
