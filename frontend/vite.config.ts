
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const backendOrigin = (
    env.VITE_BACKEND_ORIGIN || 'https://localhost:44371'
  ).replace(/\/$/, '');

  return {
    plugins: [react()],

    server: {
      host: true,
      port: 3000,

      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
