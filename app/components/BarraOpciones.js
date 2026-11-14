'use client';

// Barra de arriba del ordenador: forma G, con el estilo 3 elegido por ella
// (borde fino claro, esquinas rectas, letra 13 sin negritas, elegido y Buscar en negro).
export default function BarraOpciones({ children }) {
  return (
    <div className="esc solo-escritorio esc-barra-fija" data-barra="G">
      {children}
    </div>
  );
}
