import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 12000,
    host: '0.0.0.0',
    allowedHosts: ['work-1-ywgwxiwbtfgizmkl.prod-runtime.all-hands.dev', 'localhost'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
    cors: true,
  },
  build: {
    outDir: 'build',
  },
});