import { defineConfig } from 'vitest/config';

// Prueba de diseño: arranca la app con una base de datos de prueba y la mide en un navegador de verdad (Chromium).
export default defineConfig({
  test: {
    include: ['pruebas/diseno/**/*.test.js'],
    globalSetup: ['./pruebas/diseno/arrancar.js'],
    testTimeout: 180000,
    hookTimeout: 300000,
  },
});
