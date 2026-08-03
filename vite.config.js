import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Đảm bảo đường dẫn tương đối trong index.html sau khi build
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  }
});
