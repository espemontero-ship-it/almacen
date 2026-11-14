import FormularioInvitacion from './FormularioInvitacion';
import Cabecera from '../../components/Cabecera';
import { idiomaActual } from '../../../lib/idioma';
const { leerInvitacion } = require('../../../lib/usuarios.cjs');

export const dynamic = 'force-dynamic';

export default async function Invitacion({ params }) {
  const { token } = await params;
  const usuario = await leerInvitacion(token);
  const idioma = await idiomaActual();
  return (
    <>
      <Cabecera idioma={idioma} soloEscritorio />
      <main className="pantalla-entrada pantalla-entrar">
        <h1 className="titulo-app">Almacén</h1>
        {usuario ? (
          <FormularioInvitacion token={token} nombre={usuario.nombre} usuario={usuario.usuario} />
        ) : (
          <p className="aviso">Este enlace ya no sirve. Pide uno nuevo.</p>
        )}
      </main>
    </>
  );
}
