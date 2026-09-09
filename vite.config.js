import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // El puerto lo asigna el harness via $PORT; 5173 solo como fallback local.
  server: { port: Number(process.env.PORT) || 5173, host: true },
});
