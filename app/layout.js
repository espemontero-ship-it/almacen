import './globals.css';
import { idiomaActual } from '../lib/idioma';

export const metadata = {
  title: 'Almacén',
  description: 'Inventario del almacén',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default async function RootLayout({ children }) {
  const idioma = await idiomaActual();
  return (
    <html lang={idioma}>
      <body>{children}</body>
    </html>
  );
}
