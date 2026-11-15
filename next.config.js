// La prueba de diseño arranca su propia copia de la app en otra carpeta (.next-diseno), para no chocar con la que esté abierta.
const nextConfig = process.env.CARPETA_NEXT ? { distDir: process.env.CARPETA_NEXT } : {};

export default nextConfig;
