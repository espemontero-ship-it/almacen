import { defineConfig } from 'vitest/config';

// Pruebas de lo que hace la app: cada archivo arranca su propia base de datos vacía en memoria.
export default defineConfig({
  test: {
    include: ['pruebas/**/*.test.js'],
    exclude: ['pruebas/**/*-pantalla.test.js', 'pruebas/diseno/**'],
    setupFiles: ['./pruebas/preparar.js'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
