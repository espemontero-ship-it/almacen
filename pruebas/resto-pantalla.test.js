import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FichaNueva from '../app/articulo/[id]/FichaNueva.js';
import ListaHistorial from '../app/components/ListaHistorial.js';
import CabeceraMovil from '../app/components/CabeceraMovil.js';
import Buscador from '../app/components/Buscador.js';
import { redDeMentira } from './ayuda-pantalla.js';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

const CAMISETA = {
  id: 3, nombre: 'Camiseta', sinonimos: [], foto_url: null, etiquetas: ['Ropa'], total: 6, rotos: 0,
  tallas: [{ talla: 'S', cantidad: 2 }, { talla: 'M', cantidad: 4 }],
  sitios: [
    { id: 1, codigo: 'P1', nombre: 'latex weapons', cantidad: 4, rotos: 0, comentarios: null, talla: 'M' },
    { id: 2, codigo: 'C1', nombre: null, cantidad: 2, rotos: 0, comentarios: 'manchada', talla: 'S' },
  ],
};

describe('ficha del artículo', () => {
  it('60. arriba el total y las cajas; debajo una tarjeta por caja que lleva a la caja', () => {
    const { container } = render(<FichaNueva articulo={CAMISETA} idioma="es" puedeEditar={false} />);
    expect(container.querySelector('.fx-total').textContent).toBe('6 en total · P1, C1');
    const tarjetas = [...container.querySelectorAll('.fx-tarjeta')];
    expect(tarjetas.map(a => a.getAttribute('href'))).toEqual(['/sitio/1', '/sitio/2']);
    expect(tarjetas[1].textContent).toContain('manchada');
  });

  it('61. los botones de talla filtran las cajas', () => {
    const { container } = render(<FichaNueva articulo={CAMISETA} idioma="es" puedeEditar={false} />);
    fireEvent.click(screen.getByRole('button', { name: /^S/ }));
    expect([...container.querySelectorAll('.fx-caja')].map(c => c.textContent)).toEqual(['C1']);
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }));
    expect(container.querySelectorAll('.fx-tarjeta')).toHaveLength(2);
  });
});

describe('historial', () => {
  const cambios = [
    { id: 2, cuando: '2026-11-15T10:00:00Z', usuario_nombre: 'Espe', accion: 'llenado', detalle: { antes: null, despues: 'medias' }, sitio_id: 1, codigo: 'P1', sitio_nombre: 'latex weapons', articulo: null },
    { id: 1, cuando: '2026-11-15T09:00:00Z', usuario_nombre: null, accion: 'cantidad', detalle: { antes: 10, despues: 7 }, sitio_id: 1, codigo: 'P1', sitio_nombre: 'latex weapons', articulo: 'Espada' },
  ];

  it('62. cada cambio dice quién, qué y en qué caja', () => {
    const { container } = render(<ListaHistorial cambios={cambios} idioma="es" />);
    const lineas = [...container.querySelectorAll('.historial-linea')].map(li => li.textContent);
    expect(lineas[0]).toContain('Espe');
    expect(lineas[0]).toContain('Llenado: a medias');
    expect(lineas[1]).toContain('Alguien');
    expect(lineas[1]).toContain('Espada: cantidad 10 → 7');
    expect(container.querySelector('.historial-caja').getAttribute('href')).toBe('/sitio/1');
  });

  it('63. dentro de una caja no repite la caja; sin cambios lo dice', () => {
    const { container, rerender } = render(<ListaHistorial cambios={cambios} idioma="es" mostrarCaja={false} />);
    expect(container.querySelector('.historial-caja')).toBe(null);
    rerender(<ListaHistorial cambios={[]} idioma="es" />);
    expect(container.textContent).toBe('Todavía no hay cambios.');
  });
});

describe('cabecera del móvil', () => {
  const t = { titulo: 'Almacén', personas: 'Personas', salir: 'Salir', entrar: 'Entrar', cajas: 'Cajas' };
  const enlaces = () => screen.queryAllByRole('link').map(a => a.textContent);

  it('64. el menú empieza cerrado; al abrirlo, Historial y Cajas para todo el mundo y Entrar sin sesión', () => {
    render(<CabeceraMovil idioma="es" textos={t} puedeEditar={false} esAdmin={false} haySesion={false} />);
    expect(enlaces()).toEqual(['Almacén']);
    fireEvent.click(screen.getByRole('button', { name: /Menú/ }));
    expect(enlaces()).toEqual(['Almacén', 'Historial', 'Cajas', 'Entrar']);
  });

  it('65. + Crear caja solo para quien edita, Personas solo para administración, y Salir con sesión', () => {
    const { rerender } = render(<CabeceraMovil idioma="es" textos={t} puedeEditar esAdmin={false} haySesion />);
    fireEvent.click(screen.getByRole('button', { name: /Menú/ }));
    expect(enlaces()).toEqual(['Almacén', 'Historial', 'Cajas', '+ Crear caja']);
    expect(screen.getByRole('button', { name: 'Salir' })).toBeTruthy();
    rerender(<CabeceraMovil idioma="es" textos={t} puedeEditar esAdmin haySesion />);
    expect(enlaces()).toContain('Personas');
  });
});

describe('buscador', () => {
  it('66. al escribir salen las sugerencias, con el llenado de la caja', async () => {
    const red = redDeMentira(() => ({ lista: [{ tipo: 'caja', id: 1, codigo: 'P1', nombre: 'latex weapons', llenado: 'medias' }], aproximado: false }));
    const { container } = render(<Buscador idioma="es" />);
    fireEvent.change(container.querySelector('input'), { target: { value: 'p1' } });
    await waitFor(() => expect(container.querySelector('.sugerencia')).toBeTruthy(), { timeout: 2000 });
    expect(red[0].url).toBe('/api/sugerencias?q=p1');
    expect(container.querySelector('.sugerencia').textContent).toContain('P1 latex weapons · a medias');
    expect(container.querySelector('.sugerencia').getAttribute('href')).toBe('/sitio/1');
  });

  it('67. con una sola letra no busca', async () => {
    const red = redDeMentira(() => ({ lista: [] }));
    const { container } = render(<Buscador idioma="es" />);
    fireEvent.change(container.querySelector('input'), { target: { value: 'p' } });
    await new Promise(r => setTimeout(r, 400));
    expect(red).toHaveLength(0);
  });
});
