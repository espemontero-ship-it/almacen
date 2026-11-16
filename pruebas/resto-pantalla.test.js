import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FichaNueva from '../app/articulo/[id]/FichaNueva.js';
import ListaHistorial from '../app/components/ListaHistorial.js';
import CabeceraMovil from '../app/components/CabeceraMovil.js';
import Buscador from '../app/components/Buscador.js';
import { BotonesInicio, AnadirDesdeInicio } from '../app/components/AccionesInicio.js';
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
  const t = { titulo: 'Almacén', personas: 'Usuarios', salir: 'Salir', entrar: 'Entrar', cajas: 'Cajas' };
  const enlaces = () => screen.queryAllByRole('link').map(a => a.textContent);

  it('64. el menú empieza cerrado; al abrirlo, Artículos, Cajas e Historial para todo el mundo y Entrar sin sesión', () => {
    render(<CabeceraMovil idioma="es" textos={t} puedeEditar={false} esAdmin={false} haySesion={false} />);
    expect(enlaces()).toEqual(['Almacén']);
    fireEvent.click(screen.getByRole('button', { name: /Menú/ }));
    expect(enlaces()).toEqual(['Almacén', 'Artículos', 'Cajas', 'Historial', 'Entrar']);
  });

  it('65. orden: Artículos, Cajas, Inventario, Historial, Usuarios (los dos solo administración) y Salir; ya no está + Crear caja', () => {
    const { rerender } = render(<CabeceraMovil idioma="es" textos={t} puedeEditar esAdmin={false} haySesion />);
    fireEvent.click(screen.getByRole('button', { name: /Menú/ }));
    expect(enlaces()).toEqual(['Almacén', 'Artículos', 'Cajas', 'Historial']);
    expect(screen.getByRole('button', { name: 'Salir' })).toBeTruthy();
    rerender(<CabeceraMovil idioma="es" textos={t} puedeEditar esAdmin haySesion />);
    expect(enlaces()).toEqual(['Almacén', 'Artículos', 'Cajas', 'Inventario', 'Historial', 'Usuarios']);
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

describe('inicio: añadir artículo y caja', () => {
  it('166. "Añadir artículo" abre el formulario de la caja con el selector de caja; sin caja no añade', async () => {
    const red = redDeMentira(url => (url.startsWith('/api/sugerencias') || url.includes('buscar') ? { lista: [], articulos: [] } : { ok: true }));
    const { container } = render(<AnadirDesdeInicio idioma="es" cajas={[{ id: 7, texto: 'C1' }]} etiquetas={[]} alCerrar={() => {}} />);
    expect(container.querySelector('select').textContent).toContain('C1');
    expect(screen.getByPlaceholderText('Escribe el artículo')).toBeTruthy();
    expect(red.filter(r => r.cuerpo && r.cuerpo.accion)).toEqual([]);
  });

  it('167. junto al recuento salen "Añadir artículo" y "Añadir caja" (que lleva a crear caja)', () => {
    const alAnadir = vi.fn();
    render(<BotonesInicio idioma="es" alAnadir={alAnadir} />);
    fireEvent.click(screen.getByRole('button', { name: 'Añadir artículo' }));
    expect(alAnadir).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Añadir caja' }).getAttribute('href')).toBe('/caja-nueva');
  });
});
