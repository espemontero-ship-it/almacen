'use client';

import { useState } from 'react';

const T = {
  es: {
    titulo: 'Usuarios',
    roles: { admin: 'Administración', editor: 'Edición', consulta: 'Solo consulta' },
    pendiente: 'Aún no ha elegido contraseña',
    nuevaContrasena: 'Nueva contraseña',
    invitar: 'Invitar a alguien',
    nombre: 'Nombre',
    usuario: 'Usuario',
    correo: 'Correo',
    acceso: 'Acceso',
    crear: 'Invitar',
    enlaceTexto: 'Envíale este enlace para que elija su contraseña (caduca en 7 días):',
    enviadoCorreo: 'También se le ha enviado por correo.',
    copiar: 'Copiar enlace',
    copiado: 'Copiado',
    error: 'No se ha podido hacer.',
  },
  en: {
    titulo: 'Users',
    roles: { admin: 'Admin', editor: 'Editor', consulta: 'View only' },
    pendiente: 'Has not chosen a password yet',
    nuevaContrasena: 'New password',
    invitar: 'Invite someone',
    nombre: 'Name',
    usuario: 'Username',
    correo: 'Email',
    acceso: 'Access',
    crear: 'Invite',
    enlaceTexto: 'Send them this link to choose their password (expires in 7 days):',
    enviadoCorreo: 'It has also been sent by email.',
    copiar: 'Copy link',
    copiado: 'Copied',
    error: 'Could not be done.',
  },
};

async function pedir(cuerpo) {
  const r = await fetch('/api/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || '');
  return datos;
}

function Enlace({ enlace, enviado, t }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="enlace-generado">
      <p>{t.enlaceTexto}</p>
      <p className="enlace-texto">{enlace}</p>
      {enviado && <p className="aviso">{t.enviadoCorreo}</p>}
      <button
        type="button"
        className="boton-secundario"
        onClick={async () => {
          await navigator.clipboard.writeText(enlace);
          setCopiado(true);
        }}
      >
        {copiado ? t.copiado : t.copiar}
      </button>
    </div>
  );
}

export default function GestionPersonas({ usuarios, idioma }) {
  const t = T[idioma === 'en' ? 'en' : 'es'];
  const [enlaces, setEnlaces] = useState({});
  const [nuevo, setNuevo] = useState(null);
  const [error, setError] = useState('');

  async function nuevaContrasena(id) {
    setError('');
    try {
      const { enlace } = await pedir({ accion: 'enlace', id });
      setEnlaces(e => ({ ...e, [id]: enlace }));
    } catch (err) {
      setError(err.message || t.error);
    }
  }

  async function invitar(evento) {
    evento.preventDefault();
    setError('');
    const d = new FormData(evento.currentTarget);
    try {
      const r = await pedir({
        accion: 'invitar',
        nombre: d.get('nombre'),
        usuario: d.get('usuario'),
        correo: d.get('correo'),
        rol: d.get('rol'),
      });
      setNuevo(r);
      evento.currentTarget.reset();
    } catch (err) {
      setError(err.message || t.error);
    }
  }

  return (
    <>
      <h1 className="sitio-titulo">{t.titulo}</h1>
      <ul className="lista">
        {usuarios.map(u => (
          <li key={u.id} className="persona">
            <div className="fila">
              <span className="fila-texto">
                <span className="nombre-persona">{u.nombre}</span>
                <span className="estado">{u.usuario}{u.correo ? ` · ${u.correo}` : ''}</span>
                <span className="estado">{t.roles[u.rol]}</span>
                {!u.activo && <span className="estado estado-roto">{t.pendiente}</span>}
              </span>
              <button type="button" className="boton-secundario" onClick={() => nuevaContrasena(u.id)}>
                {t.nuevaContrasena}
              </button>
            </div>
            {enlaces[u.id] && <Enlace enlace={enlaces[u.id]} t={t} />}
          </li>
        ))}
      </ul>
      {error && <p className="error">{error}</p>}
      <h2 className="grupo-titulo">{t.invitar}</h2>
      <form onSubmit={invitar} className="formulario">
        <label>
          {t.nombre}
          <input name="nombre" required />
        </label>
        <label>
          {t.usuario}
          <input name="usuario" autoCapitalize="none" required />
        </label>
        <label>
          {t.correo}
          <input name="correo" type="email" autoCapitalize="none" />
        </label>
        <label>
          {t.acceso}
          <select name="rol" defaultValue="editor">
            <option value="editor">{t.roles.editor}</option>
            <option value="consulta">{t.roles.consulta}</option>
            <option value="admin">{t.roles.admin}</option>
          </select>
        </label>
        <button type="submit" className="boton-principal">{t.crear}</button>
      </form>
      {nuevo && <Enlace enlace={nuevo.enlace} enviado={nuevo.enviado} t={t} />}
    </>
  );
}
