import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CajaEditable from '../app/sitio/[id]/CajaEditable.js';
import ListaHistorial from '../app/components/ListaHistorial.js';
import AbrirInventario from '../app/inventario/AbrirInventario.js';
import CerrarInventario from '../app/inventario/CerrarInventario.js';
import EnlacesCajas from '../app/components/EnlacesCajas.js';
import { CONTENIDO, redDeMentira } from './ayuda-pantalla.js';

const empuja = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: empuja }) }));
beforeEach(() => { window.localStorage.clear(); empuja.mockClear(); });
afterEach(() => vi.unstubAllGlobals());

const caja = props => render(<CajaEditable sitioId={7} contenido={CONTENIDO} etiquetas={[]} idioma="es" codigo="C1" resumen="2 artículos · 13 unidades" revisionInicial={{ activa: false, marcas: [], saltadas: [], presentes: [], yo: 'Espe' }} {...props} />);
const empezar = () => fireEvent.click(screen.getByRole('button', { name: 'Hacer inventario' }));
// La primera fila de un artículo (la Lista sale dos veces: ordenador y móvil).
const fila = (container, nombre) => [...container.querySelectorAll('.cx-tabla-caja tbody tr')].find(tr => tr.textContent.includes(nombre));

// Servidor de mentira con la revisión compartida: guarda lo marcado (y quién) y responde al estado.
function servidor({ marcas = [], presentes = [], activa = true } = {}) {
  const estado = { activa, marcas: [...marcas], saltadas: [], presentes };
  const red = redDeMentira((url, c) => {
    if (c.accion === 'empezarRevision') { estado.activa = true; return { ok: true, ...estado }; }
    if (c.accion === 'estadoRevision') return { ok: true, ...estado };
    if (c.accion === 'marcarRevision') {
      estado.marcas = estado.marcas.filter(m => m.id !== c.id);
      if (c.marcado) estado.marcas.push({ id: c.id, nombre: 'Espe' });
      return { ok: true };
    }
    if (c.accion === 'marcarTodas') return { ok: true };
    if (c.accion === 'saltarFoto') { estado.saltadas.push(c.id); return { ok: true }; }
    if (c.accion === 'revisarCaja') { estado.activa = false; return { ok: true, siguiente: null }; }
    return { ok: true };
  });
  return { red, estado };
}
const acciones = red => red.map(l => l.cuerpo.accion);

describe('inventario de una caja (compartido)', () => {
  it('140. quien solo consulta no ve "Hacer inventario"', () => {
    caja({ soloVer: true, revisionInicial: null });
    expect(screen.queryByRole('button', { name: 'Hacer inventario' })).toBe(null);
  });

  it('141. "Hacer inventario" lo empieza en el servidor: "Quedan 2 de 2" y "Caja revisada" (sin leyenda, quitada por ella)', async () => {
    const { red } = servidor({ activa: false });
    const { container } = caja();
    expect(container.textContent).toContain('2 artículos · 13 unidades');
    empezar();
    await waitFor(() => expect(container.textContent).toContain('Quedan 2 de 2'));
    expect(red[0].cuerpo).toEqual({ accion: 'empezarRevision', sitioId: 7 });
    expect(container.textContent).not.toContain('2 artículos · 13 unidades');
    expect(container.textContent).not.toContain('Haz click para marcarlo');
    expect(screen.getByRole('button', { name: 'Caja revisada' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hacer inventario' })).toBe(null);
  });

  it('142. tocar un artículo lo marca en el servidor con quién lo marcó, y baja a "Revisados"; tocarlo otra vez lo desmarca', async () => {
    const { red } = servidor();
    const { container } = caja({ revisionInicial: { activa: true, marcas: [], saltadas: [], presentes: [], yo: 'Espe' } });
    fireEvent.click(fila(container, 'Espada'));
    expect(container.textContent).toContain('Quedan 1 de 2');
    expect(container.querySelector('.inv-apartado').textContent).toBe('Revisados (1)');
    expect(container.querySelector('.inv-bloque-revisados').textContent).toContain('✓ Espe');
    await waitFor(() => expect(red).toHaveLength(1));
    expect(red[0].cuerpo).toEqual({ accion: 'marcarRevision', sitioId: 7, id: 1, marcado: true });
    fireEvent.click(fila(container.querySelector('.inv-bloque-revisados'), 'Espada'));
    expect(container.textContent).toContain('Quedan 2 de 2');
    await waitFor(() => expect(red).toHaveLength(2));
    expect(red[1].cuerpo).toEqual({ accion: 'marcarRevision', sitioId: 7, id: 1, marcado: false });
  });

  it('143. tocar el − + o el ✕ no marca el artículo', () => {
    const { red } = servidor();
    const { container } = caja({ revisionInicial: { activa: true, marcas: [], saltadas: [], presentes: [], yo: 'Espe' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Cantidad +' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Quitar: Espada' })[0]);
    expect(container.textContent).toContain('Quedan 2 de 2');
    expect(acciones(red)).not.toContain('marcarRevision');
  });

  it('144. un artículo sin foto, al marcarlo, pide la foto; "Saltar" se guarda en el servidor', async () => {
    const { red } = servidor();
    const { container } = caja({ revisionInicial: { activa: true, marcas: [{ id: 3, nombre: 'Ana' }], saltadas: [], presentes: [], yo: 'Espe' } });
    expect(container.querySelector('.inv-bloque-revisados').textContent).toContain('Falta foto');
    fireEvent.click(screen.getAllByRole('button', { name: 'Saltar' })[0]);
    expect(container.querySelector('.inv-bloque-revisados').textContent).not.toContain('Falta foto');
    await waitFor(() => expect(acciones(red)).toContain('saltarFoto'));
  });

  it('145. "Caja revisada" con artículos sin marcar pregunta; "Están bien" marca el resto y guarda la revisión', async () => {
    const { red } = servidor();
    const { container } = caja({ revisionInicial: { activa: true, marcas: [{ id: 1, nombre: 'Espe' }], saltadas: [], presentes: [], yo: 'Espe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Caja revisada' }));
    expect(container.textContent).toContain('Quedan 1 sin comprobar.');
    expect(screen.getByRole('button', { name: 'Quitarlos' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Están bien' }));
    await waitFor(() => expect(container.textContent).toContain('Caja revisada. Gracias.'));
    expect(acciones(red)).toEqual(['marcarTodas', 'revisarCaja']);
    expect(screen.queryByRole('button', { name: 'Hacer inventario' })).toBe(null);
  });

  it('146. si la caja ya está en revisión (o la abre un inventario), entra sola con lo que marcaron otros y quién está dentro', () => {
    servidor();
    const { container } = caja({ revisionInicial: { activa: true, marcas: [{ id: 3, nombre: 'Ana' }], saltadas: [], presentes: ['Ana', 'Luis'], yo: 'Espe' } });
    expect(container.textContent).toContain('Quedan 1 de 2');
    expect(container.querySelector('.inv-bloque-revisados').textContent).toContain('✓ Ana');
    expect(container.querySelector('.inv-tambien').textContent).toBe('Ana y Luis también están revisando esta caja');
    expect(screen.queryByRole('button', { name: 'Hacer inventario' })).toBe(null);
  });

  it('149. cada 5 segundos lee el estado: aparece lo que marca otra persona y se va el aviso de quien ha salido', async () => {
    vi.useFakeTimers();
    try {
      const { red, estado } = servidor({ presentes: ['Ana'] });
      const { container } = caja({ revisionInicial: { activa: true, marcas: [], saltadas: [], presentes: ['Ana'], yo: 'Espe' } });
      expect(container.querySelector('.inv-tambien')).toBeTruthy();
      estado.marcas.push({ id: 1, nombre: 'Ana' });
      estado.presentes = [];
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(acciones(red)).toEqual(['estadoRevision']);
      expect(container.textContent).toContain('Quedan 1 de 2');
      expect(container.querySelector('.inv-bloque-revisados').textContent).toContain('✓ Ana');
      expect(container.querySelector('.inv-tambien')).toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  it('150. si otra persona termina la revisión, la caja vuelve a verse normal', async () => {
    vi.useFakeTimers();
    try {
      const { estado } = servidor();
      const { container } = caja({ revisionInicial: { activa: true, marcas: [], saltadas: [], presentes: [], yo: 'Espe' } });
      estado.activa = false;
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(screen.getByRole('button', { name: 'Hacer inventario' })).toBeTruthy();
      expect(container.textContent).toContain('2 artículos · 13 unidades');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('borrar una caja', () => {
  it('147. el ✕ de la caja pregunta; con "Sí" la borra y vuelve a Cajas', async () => {
    const red = redDeMentira(() => ({ ok: true, id: 7 }));
    caja();
    fireEvent.click(screen.getByRole('button', { name: 'Borrar la caja C1' }));
    expect(screen.getByText('¿Borrar la caja C1 y todo lo que tiene?')).toBeTruthy();
    expect(red).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    await waitFor(() => expect(red).toHaveLength(1));
    expect(red[0].cuerpo).toEqual({ accion: 'borrarCaja', sitioId: 7 });
    await waitFor(() => expect(empuja).toHaveBeenCalledWith('/cajas'));
  });

  it('148. en el Historial, "Recuperar" sale solo en la última "Caja borrada" de cada caja y solo a quien edita', () => {
    const cambios = [
      { id: 3, cuando: '2026-11-15T12:00:00Z', usuario_nombre: 'Espe', accion: 'borrarCaja', detalle: { codigo: 'C1', nombre: null }, sitio_id: 7, codigo: 'C1', caja_recuperable: true, caja_borrada: true },
      { id: 2, cuando: '2026-11-15T11:00:00Z', usuario_nombre: 'Espe', accion: 'recuperarCaja', detalle: { codigo: 'C1', nombre: null }, sitio_id: 7, codigo: 'C1', caja_recuperable: true, caja_borrada: true },
      { id: 1, cuando: '2026-11-15T10:00:00Z', usuario_nombre: 'Espe', accion: 'borrarCaja', detalle: { codigo: 'C1', nombre: null }, sitio_id: 7, codigo: 'C1', caja_recuperable: true, caja_borrada: true },
    ];
    const { container, rerender } = render(<ListaHistorial cambios={cambios} idioma="es" puedeEditar />);
    const lineas = [...container.querySelectorAll('.historial-linea')];
    expect(lineas[0].textContent).toContain('Caja borrada: C1');
    expect(lineas[0].querySelector('button')?.textContent).toBe('Recuperar');
    expect(lineas[1].textContent).toContain('Caja recuperada: C1');
    expect(lineas[1].textContent.match(/C1/g)).toHaveLength(1);
    expect(lineas[2].querySelector('button')).toBe(null);
    rerender(<ListaHistorial cambios={cambios} idioma="es" />);
    expect(container.querySelector('button')).toBe(null);
  });
});

describe('pantalla Inventario', () => {
  const TIPOS = [{ letra: 'P', texto: 'P · Props', cajas: 2 }, { letra: 'C', texto: 'C · Cocina', cajas: 1 }];
  const CAJAS = [{ id: 1, texto: 'P1 latex weapons' }, { id: 2, texto: 'C1' }];

  it('158. "Abrir inventario" deja elegir general, por tipo (con cuántas cajas) o cajas sueltas, y lo abre', async () => {
    const red = redDeMentira(() => ({ ok: true, id: 1, cajas: 1 }));
    render(<AbrirInventario idioma="es" tipos={TIPOS} cajas={CAJAS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir inventario' }));
    fireEvent.click(screen.getByLabelText('Por tipo de caja'));
    expect(screen.getByLabelText('P · Props · 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abrir' }).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Cajas individuales'));
    fireEvent.click(screen.getByLabelText('C1'));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    await waitFor(() => expect(red).toHaveLength(1));
    expect(red[0].cuerpo).toEqual({ accion: 'abrirInventario', forma: 'cajas', letras: [], cajas: [2] });
  });

  it('159. "Cerrar inventario" pregunta cuántas cajas quedan y, al cerrar, lleva al resumen', async () => {
    const red = redDeMentira(() => ({ ok: true }));
    render(<CerrarInventario id={4} quedan={1} idioma="es" />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar inventario' }));
    expect(screen.getByText('¿Cerrar el inventario? Queda 1 caja sin revisar.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    await waitFor(() => expect(empuja).toHaveBeenCalledWith('/inventario?ver=4'));
    expect(red[0].cuerpo).toEqual({ accion: 'cerrarInventario', id: 4 });
  });
});

describe('ordenar la Lista de la caja y abrir cajas desde sus códigos', () => {
  it('164. en la caja, tocar "Total" ordena por cantidad (y otra vez al revés)', () => {
    const { container } = caja();
    const nombresMovil = () => [...container.querySelectorAll('.solo-movil .cx-tabla-caja tbody tr')].map(tr => tr.querySelector('.esc-nombre').textContent);
    fireEvent.click(container.querySelector('.solo-movil .cx-tabla-caja th:nth-child(3) .orden-titulo'));
    expect(nombresMovil()).toEqual(['Copa', 'Espada']);
    fireEvent.click(container.querySelector('.solo-movil .cx-tabla-caja th:nth-child(3) .orden-titulo'));
    expect(nombresMovil()).toEqual(['Espada', 'Copa']);
  });

  it('165. los códigos de caja llevan a su caja; dentro de una tarjeta, sin abrir el artículo', () => {
    empuja.mockClear();
    const cajas = [{ id: 1, texto: 'P1' }, { id: 2, texto: 'C1' }, { id: 1, texto: 'P1' }];
    const { container, rerender } = render(<EnlacesCajas cajas={cajas} />);
    expect([...container.querySelectorAll('a.enlace-caja')].map(a => a.getAttribute('href'))).toEqual(['/sitio/1', '/sitio/2']);
    const alArticulo = vi.fn();
    rerender(<a href="/articulo/9" onClick={alArticulo}><EnlacesCajas cajas={cajas} dentroDeEnlace /></a>);
    fireEvent.click(screen.getByRole('link', { name: 'C1' }));
    expect(empuja).toHaveBeenCalledWith('/sitio/2');
    expect(alArticulo).not.toHaveBeenCalled();
  });
});
