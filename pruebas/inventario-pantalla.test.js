import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CajaEditable from '../app/sitio/[id]/CajaEditable.js';
import ListaHistorial from '../app/components/ListaHistorial.js';
import { CONTENIDO, redDeMentira } from './ayuda-pantalla.js';

const empuja = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: empuja }) }));
beforeEach(() => { window.localStorage.clear(); empuja.mockClear(); });
afterEach(() => vi.unstubAllGlobals());

const caja = props => render(<CajaEditable sitioId={7} contenido={CONTENIDO} etiquetas={[]} idioma="es" codigo="C1" resumen="2 artículos · 13 unidades" {...props} />);
const empezar = () => fireEvent.click(screen.getByRole('button', { name: 'Hacer inventario' }));
// La primera fila de un artículo (la Lista sale dos veces: ordenador y móvil).
const fila = (container, nombre) => [...container.querySelectorAll('.cx-tabla-caja tbody tr')].find(tr => tr.textContent.includes(nombre));

describe('inventario de una caja', () => {
  it('140. quien solo consulta no ve "Hacer inventario"', () => {
    caja({ soloVer: true });
    expect(screen.queryByRole('button', { name: 'Hacer inventario' })).toBe(null);
  });

  it('141. al empezar: "Quedan 2 de 2" en lugar del recuento, la leyenda y "Caja revisada"', () => {
    const { container } = caja();
    expect(container.textContent).toContain('2 artículos · 13 unidades');
    empezar();
    expect(container.textContent).toContain('Quedan 2 de 2');
    expect(container.textContent).not.toContain('2 artículos · 13 unidades');
    expect(container.textContent).toContain('Haz click para marcarlo como revisado o pulsa Caja revisada si la caja está correcta');
    expect(screen.getByRole('button', { name: 'Caja revisada' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Hacer inventario' })).toBe(null);
  });

  it('142. tocar un artículo lo marca: baja a "Revisados" y el contador baja; tocarlo otra vez lo desmarca', () => {
    const { container } = caja();
    empezar();
    fireEvent.click(fila(container, 'Espada'));
    expect(container.textContent).toContain('Quedan 1 de 2');
    expect(container.querySelector('.inv-apartado').textContent).toBe('Revisados (1)');
    expect(container.querySelector('.inv-bloque-revisados').textContent).toContain('Espada');
    fireEvent.click(fila(container.querySelector('.inv-bloque-revisados'), 'Espada'));
    expect(container.textContent).toContain('Quedan 2 de 2');
    expect(container.querySelector('.inv-apartado')).toBe(null);
  });

  it('143. tocar el − + o el ✕ no marca el artículo', () => {
    const { container } = caja();
    empezar();
    redDeMentira();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cantidad +' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Quitar: Espada' })[0]);
    expect(container.textContent).toContain('Quedan 2 de 2');
  });

  it('144. un artículo sin foto, al marcarlo, pide la foto (Falta foto · Saltar)', () => {
    const { container } = caja();
    empezar();
    fireEvent.click(fila(container, 'Copa'));
    expect(container.querySelector('.inv-bloque-revisados').textContent).toContain('Falta foto');
    fireEvent.click(screen.getAllByRole('button', { name: 'Saltar' })[0]);
    expect(container.querySelector('.inv-bloque-revisados').textContent).not.toContain('Falta foto');
  });

  it('145. "Caja revisada" con artículos sin marcar pregunta; "Están bien" los da por buenos y guarda la revisión', async () => {
    const red = redDeMentira(() => ({ ok: true, siguiente: null }));
    const { container } = caja();
    empezar();
    fireEvent.click(fila(container, 'Espada'));
    fireEvent.click(screen.getByRole('button', { name: 'Caja revisada' }));
    expect(container.textContent).toContain('Quedan 1 sin comprobar.');
    expect(screen.getByRole('button', { name: 'Quitarlos' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Están bien' }));
    await waitFor(() => expect(red).toHaveLength(1));
    expect(red[0].cuerpo).toEqual({ accion: 'revisarCaja', sitioId: 7 });
    await waitFor(() => expect(container.textContent).toContain('Caja revisada. Gracias.'));
    expect(screen.queryByRole('button', { name: 'Hacer inventario' })).toBe(null);
  });

  it('146. lo marcado se guarda en el navegador y sigue al volver a abrir la caja', () => {
    const { container, unmount } = caja();
    empezar();
    fireEvent.click(fila(container, 'Espada'));
    unmount();
    const otra = caja();
    expect(otra.container.textContent).toContain('Quedan 1 de 2');
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
