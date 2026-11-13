import FormularioInvitacion from './FormularioInvitacion';
const { leerInvitacion } = require('../../../lib/usuarios.cjs');

export const dynamic = 'force-dynamic';

export default async function Invitacion({ params }) {
  const { token } = await params;
  const usuario = await leerInvitacion(token);
  return (
    <main className="pantalla-entrada">
      <h1 className="titulo-app">Almacén</h1>
      {usuario ? (
        <FormularioInvitacion token={token} nombre={usuario.nombre} usuario={usuario.usuario} />
      ) : (
        <p className="aviso">Este enlace ya no sirve. Pide uno nuevo.</p>
      )}
    </main>
  );
}
