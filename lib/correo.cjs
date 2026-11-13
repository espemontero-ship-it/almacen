let transporte = null;

function obtenerTransporte() {
  if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) return null;
  if (!transporte) {
    const nodemailer = require('nodemailer');
    transporte = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_APP_PASSWORD },
    });
  }
  return transporte;
}

async function enviar({ para, asunto, html, copiaEnConsola }) {
  const t = obtenerTransporte();
  if (!t) {
    console.log(`[correo] Sin SMTP configurado; no se envía. ${copiaEnConsola}`);
    return { enviado: false };
  }
  await t.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to: para, subject: asunto, html });
  return { enviado: true };
}

function enviarRecuperacion(para, { nombre, enlace }) {
  return enviar({
    para,
    asunto: 'Almacén NOL · Nueva contraseña / New password',
    html: `<p>Hola, ${nombre}. Para elegir una contraseña nueva, abre este enlace (caduca en 2 horas):</p>
<p>Hi ${nombre}. To choose a new password, open this link (expires in 2 hours):</p>
<p><a href="${enlace}">${enlace}</a></p>
<p>Si no lo has pedido tú, ignora este correo. / If you didn't ask for this, just ignore this email.</p>`,
    copiaEnConsola: `Recuperación para ${para}: ${enlace}`,
  });
}

function enviarInvitacion(para, { nombre, enlace }) {
  return enviar({
    para,
    asunto: 'Almacén NOL · Acceso / Access',
    html: `<p>Hola, ${nombre}. Te han dado acceso a la app del almacén. Elige tu contraseña aquí (caduca en 7 días):</p>
<p>Hi ${nombre}. You've been given access to the warehouse app. Choose your password here (expires in 7 days):</p>
<p><a href="${enlace}">${enlace}</a></p>`,
    copiaEnConsola: `Invitación para ${para}: ${enlace}`,
  });
}

module.exports = { enviarRecuperacion, enviarInvitacion };
