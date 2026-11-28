import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ListaCajas from '../app/cajas/ListaCajas.js';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const CAJAS = [
  { id: 1, codigo: 'P1', nombre: 'latex weapons', letra: 'P', llenado: 'llena', articulos: 3, unidades: 19, revisada: '2026-11-10T10:00:00Z' },
  { id: 2, codigo: 'P2', nombre: null, letra: 'P', llenado: 'llena', articulos: 1, unidades: 1, revisada: null },
  { id: 3, codigo: 'C1', nombre: null, letra: 'C', llenado: 'medias', articulos: 2, unidades: 5, revisada: '2026-11-15T10:00:00Z' },
  { id: 4, codigo: null, nombre: 'Espe House', letra: null, llenado: 'llena', articulos: 0, unidades: 0, revisada: null },
];
const nombres = c => [...c.querySelectorAll('.lista-cajas-nombre strong')].map(s => s.textContent);

describe('pantalla Cajas', () => {
  it('161. tabla con títulos (Caja, Artículos, Unidades, Revisada, Llenado); cada fila con sus datos; arriba, cuántas cajas salen', () => {
    const { container } = render(<ListaCajas cajas={CAJAS} idioma="es" puedeEditar={false} />);
    expect([...container.querySelectorAll('.cajas-cab .orden-titulo')].map(b => b.textContent)).toEqual(['Caja', 'ArtículosArt.', 'UnidadesUd.', 'Revisada', 'Llenado']);
    expect([...container.querySelectorAll('.cajas-cab .solo-movil-linea')].map(b => b.textContent)).toEqual(['Art.', 'Ud.']);
    const p1 = container.querySelector('.lista-cajas-fila');
    expect([...p1.querySelectorAll('.cajas-num')].map(x => x.textContent)).toEqual(['3', '19']);
    expect(p1.querySelector('.cajas-col-revisada').textContent).toBe('10 nov');
    expect(container.querySelector('.cajas-contador').textContent).toBe('4 cajas');
  });

  it('162. filtros: tipo de caja y Revisión (Todas · Nunca revisadas · Sin revisar desde… con su fecha); se combinan', () => {
    const { container } = render(<ListaCajas cajas={CAJAS} idioma="es" puedeEditar={false} />);
    const [selTipo, selRevision] = container.querySelectorAll('.cajas-filtros select');
    fireEvent.change(selTipo, { target: { value: 'P' } });
    expect(nombres(container)).toEqual(['P1', 'P2']);
    expect(container.querySelector('.cajas-fecha')).toBe(null);
    fireEvent.change(selRevision, { target: { value: 'desde' } });
    fireEvent.change(container.querySelector('.cajas-fecha'), { target: { value: '2026-11-12' } });
    expect(nombres(container)).toEqual(['P1', 'P2']);
    fireEvent.change(selTipo, { target: { value: '' } });
    expect(nombres(container)).toEqual(['P1', 'P2', 'Espe House']);
    fireEvent.change(selRevision, { target: { value: 'nunca' } });
    expect(nombres(container)).toEqual(['P2', 'Espe House']);
    fireEvent.change(container.querySelector('.cajas-filtros select'), { target: { value: 'otros' } });
    expect(nombres(container)).toEqual(['Espe House']);
    expect(container.querySelector('.cajas-contador').textContent).toBe('1 caja');
  });
});

describe('ordenar por los títulos', () => {
  it('163. Cajas: tocar un título ordena de menor a mayor y otra vez al revés; las nunca revisadas van al final', () => {
    const { container } = render(<ListaCajas cajas={CAJAS} idioma="es" puedeEditar={false} />);
    const titulo = t => [...container.querySelectorAll('.cajas-cab .orden-titulo')].find(b => b.textContent.startsWith(t));
    fireEvent.click(titulo('Unidades'));
    expect(nombres(container)).toEqual(['Espe House', 'P2', 'C1', 'P1']);
    expect(titulo('Unidades').textContent).toBe('UnidadesUd. ▲');
    fireEvent.click(titulo('Unidades'));
    expect(nombres(container)).toEqual(['P1', 'C1', 'P2', 'Espe House']);
    fireEvent.click(titulo('Revisada'));
    expect(nombres(container).slice(0, 2)).toEqual(['P1', 'C1']);
    fireEvent.click(titulo('Revisada'));
    expect(nombres(container).slice(0, 2)).toEqual(['C1', 'P1']);
  });
});
