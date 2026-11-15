import { describe, it, expect, beforeAll, afterAll, inject } from 'vitest';
import { chromium } from 'playwright';

// Prueba de diseño: el inicio es la guía maestra. Cada pantalla, en ordenador y en móvil, tiene que usar sus medidas:
// - botones, casillas y desplegables con borde: en el ordenador 33-34 de alto y letra de 13; en el móvil 43-44 de alto y letra de 15-16;
// - títulos de pantalla: 20 en el ordenador y 24 en el móvil, sin negrita;
// - ningún texto más pequeño que el gris de las tarjetas del inicio (12 en el ordenador, 14 en el móvil);
// - sin negrita en botones, casillas, rótulos ni títulos.
const VISTAS = {
  ordenador: { viewport: { width: 1280, height: 800 }, alto: [33, 34], letra: [12.6, 13.4], titulo: [19.5, 20.5], minimo: 11.95 },
  movil: { viewport: { width: 375, height: 812 }, alto: [43, 44], letra: [15, 16], titulo: [23.5, 24.5], minimo: 13.95 },
};

function medir() {
  const zoomDe = e => { let z = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const v = parseFloat(getComputedStyle(n).zoom); if (v && v !== 1) z *= v; } return z; };
  const visible = e => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none'; };
  const fuera = [];
  for (const e of document.querySelectorAll('body *')) {
    if (!visible(e) || e.closest('nextjs-portal')) continue;
    const t = e.tagName.toLowerCase();
    const c = getComputedStyle(e);
    const letra = Math.round(parseFloat(c.fontSize) * zoomDe(e) * 10) / 10;
    const alto = Math.round(e.getBoundingClientRect().height);
    const texto = (e.innerText || e.value || e.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 30);
    const negrita = parseInt(c.fontWeight, 10) >= 600;
    const control = (t === 'button' || t === 'select' || (t === 'input' && !['checkbox', 'radio', 'file', 'hidden'].includes(e.type)))
      && parseFloat(c.borderTopWidth) > 0;
    const propio = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    fuera.push({
      clase: String(e.className || ''), padre: String(e.parentElement?.className || ''),
      t, letra, alto, texto, negrita, control, propio, titulo: /^h[12]$/.test(t), simbolo: /^[−+▦☰▾▴]$/.test(texto),
    });
  }
  return fuera;
}

function revisar(nombre, elementos, v, fallos) {
  for (const e of elementos) {
    const donde = `${nombre}: «${e.texto}» (${e.t}.${e.clase} en .${e.padre})`;
    if (e.control && e.texto) {
      if (e.alto < v.alto[0] || e.alto > v.alto[1]) fallos.push(`${donde} mide ${e.alto} de alto (debe ${v.alto.join('-')})`);
      if (!e.simbolo && (e.letra < v.letra[0] || e.letra > v.letra[1])) fallos.push(`${donde} tiene letra ${e.letra} (debe ${v.letra.join('-')})`);
      if (e.negrita) fallos.push(`${donde} está en negrita`);
    }
    if (e.titulo) {
      if (e.letra < v.titulo[0] || e.letra > v.titulo[1]) fallos.push(`${donde} título con letra ${e.letra} (debe ${v.titulo.join('-')})`);
      if (e.negrita) fallos.push(`${donde} título en negrita`);
    }
    if (e.propio && e.texto && !e.simbolo && e.letra < v.minimo) fallos.push(`${donde} texto demasiado pequeño (${e.letra})`);
    if (e.t === 'label' && e.negrita) fallos.push(`${donde} rótulo en negrita`);
  }
}

const PANTALLAS = ids => [
  ['inicio', '/'],
  ['búsqueda', '/buscar?q=camiseta'],
  ['caja', `/sitio/${ids.p1}`],
  ['ficha', `/articulo/${ids.camiseta}`],
  ['historial', '/historial'],
  ['cajas', '/cajas'],
  ['crear caja', '/caja-nueva'],
  ['personas', '/personas'],
  ['recuperar', '/recuperar'],
  ['entrar', '/login'],
];

let navegador;
beforeAll(async () => { navegador = await chromium.launch(); });
afterAll(async () => { await navegador?.close(); });

for (const [nombreVista, v] of Object.entries(VISTAS)) {
  describe(`diseño en ${nombreVista}`, () => {
    it(`120. con sesión de administración, todas las pantallas usan las medidas del inicio (${nombreVista})`, async () => {
      const url = inject('url');
      const contexto = await navegador.newContext({ viewport: v.viewport });
      // Entra como administración desde la pantalla de entrar, igual que una persona.
      const pagina = await contexto.newPage();
      await pagina.goto(`${url}/login`, { waitUntil: 'networkidle' });
      await pagina.locator('input[name="usuario"]').fill('admin-diseno');
      await pagina.locator('input[name="password"]').fill('clave-diseno');
      await Promise.all([pagina.waitForURL(`${url}/`), pagina.locator('main button[type="submit"]').click()]);
      const fallos = [];
      for (const [nombre, ruta] of PANTALLAS(inject('ids'))) {
        const respuesta = await pagina.goto(url + ruta, { waitUntil: 'networkidle' });
        if (!respuesta.ok()) fallos.push(`${nombre}: la pantalla no ha cargado (${respuesta.status()})`);
        // Con la sesión de administración, la caja tiene que enseñar los botones de editar.
        if (nombre === 'caja' && (await pagina.getByText('Añadir artículo').count()) === 0) fallos.push('caja: no ha entrado con sesión de administración');
        revisar(nombre, await pagina.evaluate(medir), v, fallos);
      }
      await contexto.close();
      expect([...new Set(fallos)]).toEqual([]);
    });

    it(`121. sin entrar (solo ver), las pantallas también usan las medidas del inicio (${nombreVista})`, async () => {
      const url = inject('url');
      const contexto = await navegador.newContext({ viewport: v.viewport });
      const pagina = await contexto.newPage();
      const fallos = [];
      for (const [nombre, ruta] of PANTALLAS(inject('ids')).filter(([n]) => !['crear caja', 'personas'].includes(n))) {
        const respuesta = await pagina.goto(url + ruta, { waitUntil: 'networkidle' });
        if (!respuesta.ok()) fallos.push(`${nombre}: la pantalla no ha cargado (${respuesta.status()})`);
        revisar(nombre, await pagina.evaluate(medir), v, fallos);
      }
      await contexto.close();
      expect([...new Set(fallos)]).toEqual([]);
    });
  });
}
