import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // Đảm bảo đường dẫn tương đối trong index.html và guide.html sau khi build
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        guide: resolve(__dirname, 'guide.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  }
});
