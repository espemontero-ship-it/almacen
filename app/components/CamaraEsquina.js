'use client';

import { useRouter } from 'next/navigation';
import BotonFoto from './BotonFoto';

// El botón de foto aprobado: la cámara en la esquina de abajo a la derecha de la foto (solo quien edita).
// Va encima de la foto (el padre la coloca). Nunca dentro de un enlace, para que tocarla no abra otra cosa.
// Al subir la foto, la pantalla se actualiza.
export default function CamaraEsquina({ articuloId, idioma, alSubir = null }) {
  const router = useRouter();
  return (
    <span className="cx-camara">
      <BotonFoto articuloId={articuloId} etiqueta={idioma === 'en' ? 'Photo' : 'Foto'} onSubida={url => (alSubir ? alSubir(url) : router.refresh())} />
    </span>
  );
}
