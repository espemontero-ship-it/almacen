const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let cliente = null;

function r2() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) return null;
  if (!cliente) {
    cliente = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return cliente;
}

const BUCKET = () => process.env.R2_BUCKET || 'almacen-fotos';

async function subirFoto(clave, contenido, tipo) {
  const c = r2();
  if (!c) throw new Error('Faltan las claves de R2.');
  await c.send(new PutObjectCommand({ Bucket: BUCKET(), Key: clave, Body: contenido, ContentType: tipo || 'image/jpeg' }));
}

async function urlFoto(clave) {
  const c = r2();
  if (!c || !clave) return null;
  return getSignedUrl(c, new GetObjectCommand({ Bucket: BUCKET(), Key: clave }), { expiresIn: 60 * 60 * 6 });
}

async function conFotos(filas) {
  return Promise.all(filas.map(async f => ({ ...f, foto_url: f.foto_clave ? await urlFoto(f.foto_clave) : null })));
}

module.exports = { subirFoto, urlFoto, conFotos };
