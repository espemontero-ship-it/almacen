'use client';

export default function BotonIdioma({ idioma }) {
  function elegir(nuevo) {
    if (nuevo === idioma) return;
    document.cookie = `idioma=${nuevo}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <div className="idiomas" role="group" aria-label="Idioma / Language">
      <button
        type="button"
        className={idioma === 'es' ? 'idioma idioma-activo' : 'idioma'}
        aria-pressed={idioma === 'es'}
        onClick={() => elegir('es')}
      >
        ES
      </button>
      <button
        type="button"
        className={idioma === 'en' ? 'idioma idioma-activo' : 'idioma'}
        aria-pressed={idioma === 'en'}
        onClick={() => elegir('en')}
      >
        EN
      </button>
    </div>
  );
}
