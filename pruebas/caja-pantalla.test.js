import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CajaEditable from '../app/sitio/[id]/CajaEditable.js';
import Llenado from '../app/sitio/[id]/Llenado.js';
import { CONTENIDO, redDeMentira } from './ayuda-pantalla.js';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

describe('la caja', () => {
  it('50. quien solo consulta ve cantidades, rotas y comentarios, sin botones de editar', () => {
    const { container } = render(<CajaEditable sitioId={1} contenido={CONTENIDO} etiquetas={[]} idioma="es" soloVer />);
    expect(container.textContent).toContain('Espada');
    expect(container.textContent).toContain('hoja mellada');
    expect(screen.queryByRole('button', { name: 'Quitar' })).toBe(null);
    expect(screen.queryByRole('button', { name: 'Cantidad +' })).toBe(null);
    expect(screen.queryByText('Añadir artículo')).toBe(null);
    expect(container.querySelector('input')).toBe(null);
  });

  // Cada línea lleva sus botones dos veces: una versión para ordenador y otra para móvil.
  it('51. quien edita tiene − número +, rotas, comentario, Quitar y Añadir artículo', () => {
    render(<CajaEditable sitioId={1} contenido={CONTENIDO} etiquetas={[]} idioma="es" />);
    expect(screen.getAllByRole('button', { name: 'Cantidad +' })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Rotas +' })).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Quitar' }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByPlaceholderText('Añadir comentario').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Añadir artículo')).toBeTruthy();
  });

  it('52. pulsar + guarda la cantidad nueva al momento', async () => {
    const red = redDeMentira(() => ({ ok: true, fila: { id: 1, cantidad: 11, rotos: 2 } }));
    render(<CajaEditable sitioId={1} contenido={CONTENIDO} etiquetas={[]} idioma="es" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Cantidad +' })[0]);
    await waitFor(() => expect(red).toHaveLength(1));
    expect(red[0]).toEqual({ url: '/api/editar', cuerpo: { accion: 'cantidad', id: 1, cantidad: 11 } });
  });

  it('53. las rotas no pueden pasar de la cantidad', () => {
    const lleno = [{ ...CONTENIDO[1], rotos: 3 }];
    render(<CajaEditable sitioId={1} contenido={lleno} etiquetas={[]} idioma="es" />);
    const botones = screen.getAllByRole('button', { name: 'Rotas +' });
    expect(botones.length).toBeGreaterThan(0);
    expect(botones.every(b => b.disabled)).toBe(true);
  });

  it('54. Quitar pide confirmación; con "Sí, quitar" se quita y desaparece de la caja', async () => {
    const red = redDeMentira(() => ({ ok: true, fila: { id: 3 } }));
    const { container } = render(<CajaEditable sitioId={1} contenido={CONTENIDO} etiquetas={[]} idioma="es" />);
    const quitar = screen.getAllByRole('button', { name: 'Quitar' });
    fireEvent.click(quitar[quitar.length - 1]);
    expect(screen.getByText('¿Quitar «Copa» de esta caja?')).toBeTruthy();
    expect(red).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, quitar' }));
    await waitFor(() => expect(container.textContent).not.toContain('Copa'));
    expect(red[0].cuerpo).toEqual({ accion: 'quitar', id: 3 });
  });

  it('55. si falla al guardar, vuelve el valor de antes y lo dice', async () => {
    redDeMentira(() => ({ __estado: 400, error: 'No se ha podido guardar.' }));
    const { container } = render(<CajaEditable sitioId={1} contenido={CONTENIDO} etiquetas={[]} idioma="es" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Cantidad +' })[0]);
    await waitFor(() => expect(container.textContent).toContain('No se ha podido guardar.'));
    expect(container.querySelector('.cx-cantidad').textContent).toContain('10');
  });
});

describe('el llenado de la caja', () => {
  it('56. sin usuario: nada si nadie lo ha elegido, y la palabra si está elegido', () => {
    const vacio = render(<Llenado sitioId={1} llenado={null} idioma="es" soloVer />);
    expect(vacio.container.innerHTML).toBe('');
    const elegido = render(<Llenado sitioId={1} llenado="medias" idioma="es" soloVer />);
    expect(elegido.container.textContent).toBe('A medias');
    expect(elegido.container.querySelector('button')).toBe(null);
  });

  it('57. quien edita ve Vacía · A medias · Llena; pulsar uno lo marca y lo guarda', async () => {
    const red = redDeMentira();
    render(<Llenado sitioId={7} llenado="vacia" idioma="es" />);
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['Vacía', 'A medias', 'Llena']);
    expect(screen.getByRole('button', { name: 'Vacía' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Llena' }));
    expect(screen.getByRole('button', { name: 'Llena' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(red).toHaveLength(1));
    expect(red[0]).toEqual({ url: '/api/editar', cuerpo: { accion: 'llenado', sitioId: 7, llenado: 'llena' } });
  });

  it('58. si no se puede guardar, vuelve a lo que había y lo dice', async () => {
    redDeMentira(() => ({ __estado: 500 }));
    const { container } = render(<Llenado sitioId={7} llenado="vacia" idioma="es" />);
    fireEvent.click(screen.getByRole('button', { name: 'Llena' }));
    await waitFor(() => expect(container.textContent).toContain('Algo ha fallado'));
    expect(screen.getByRole('button', { name: 'Vacía' }).getAttribute('aria-pressed')).toBe('true');
  });
});
