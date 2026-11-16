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
  it('161. cada fila lleva su resumen de artículos y cuándo se revisó; arriba, cuántas cajas salen', () => {
    const { container } = render(<ListaCajas cajas={CAJAS} idioma="es" puedeEditar={false} />);
    const p1 = container.querySelector('.lista-cajas-fila');
    expect(p1.textContent).toContain('3 artículos · 19 unidades');
    expect(p1.textContent).toContain('Revisada el 10 nov');
    expect(container.querySelector('.cajas-contador').textContent).toBe('4 cajas');
  });

  it('162. filtros: tipo de caja, sin revisar desde un día y sin revisar nunca; se combinan', () => {
    const { container } = render(<ListaCajas cajas={CAJAS} idioma="es" puedeEditar={false} />);
    fireEvent.change(container.querySelector('.cajas-filtros select'), { target: { value: 'P' } });
    expect(nombres(container)).toEqual(['P1', 'P2']);
    fireEvent.change(container.querySelector('.cajas-fecha'), { target: { value: '2026-11-12' } });
    expect(nombres(container)).toEqual(['P1', 'P2']);
    fireEvent.change(container.querySelector('.cajas-filtros select'), { target: { value: '' } });
    expect(nombres(container)).toEqual(['P1', 'P2', 'Espe House']);
    fireEvent.change(container.querySelector('.cajas-fecha'), { target: { value: '' } });
    fireEvent.click(container.querySelector('.cajas-tick input'));
    expect(nombres(container)).toEqual(['P2', 'Espe House']);
    fireEvent.change(container.querySelector('.cajas-filtros select'), { target: { value: 'otros' } });
    expect(nombres(container)).toEqual(['Espe House']);
    expect(container.querySelector('.cajas-contador').textContent).toBe('1 caja');
  });
});
