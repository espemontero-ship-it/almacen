import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Escritorio from '../app/components/Escritorio.js';
import { FILAS } from './ayuda-pantalla.js';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const tarjetas = container => [...container.querySelectorAll('.esc-cuadricula > li')];

describe('inicio y búsqueda (tarjetas y lista)', () => {
  it('40. cada artículo sale una vez, con su total sumando cajas y en qué cajas está', () => {
    const { container } = render(<Escritorio filas={FILAS} idioma="es" />);
    const lista = tarjetas(container);
    expect(lista.map(li => li.querySelector('.esc-nombre').textContent)).toEqual(['Camiseta', 'Copa', 'Espada']);
    const copa = lista[1];
    expect(copa.textContent).toContain('15');
    expect(copa.textContent).toContain('C1, P1');
    expect(copa.querySelector('a').getAttribute('href')).toBe('/articulo/2');
  });

  it('41. el estado solo sale en la tarjeta si hay algo roto', () => {
    const { container } = render(<Escritorio filas={FILAS} idioma="es" />);
    const [camiseta, copa, espada] = tarjetas(container);
    expect(espada.querySelector('.estado-roto').textContent).toBe('8 buenas · 2 rotas');
    expect(copa.querySelector('.estado-roto')).toBe(null);
    expect(camiseta.textContent).toContain('S 2 · M 4');
  });

  it('42. la Lista tiene las columnas Artículo · Total · Cajas · Estado · Etiquetas', () => {
    const { container } = render(<Escritorio filas={FILAS} idioma="es" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Lista' })[0]);
    const cabeceras = [...container.querySelectorAll('.esc-lista-B thead th')].map(th => th.textContent).filter(Boolean);
    expect(cabeceras).toEqual(['Artículo', 'Total', 'Cajas', 'Estado', 'Etiquetas']);
  });

  it('43. en la Lista, un artículo en varias cajas se despliega y enseña cada caja', () => {
    const { container } = render(<Escritorio filas={FILAS} idioma="es" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Lista' })[0]);
    const filaCopa = [...container.querySelectorAll('.esc-lista-B tbody tr')].find(tr => tr.textContent.includes('Copa'));
    fireEvent.click(filaCopa);
    const detalle = [...container.querySelectorAll('.esc-caja-linea')].map(a => a.textContent);
    expect(detalle).toEqual(['C1 · 12', 'P1 · 3']);
  });

  it('44. los filtros de etiqueta y estado reducen lo que se ve y el contador', () => {
    const { container } = render(<Escritorio filas={FILAS} idioma="es" />);
    const filtros = container.querySelector('.esc-filtros');
    fireEvent.change(within(filtros).getByLabelText('Estado'), { target: { value: 'roto' } });
    expect(tarjetas(container).map(li => li.querySelector('.esc-nombre').textContent)).toEqual(['Espada']);
    expect(filtros.textContent).toContain('1 artículo');
    fireEvent.change(within(filtros).getByLabelText('Estado'), { target: { value: '' } });
    fireEvent.change(within(filtros).getByLabelText('Etiqueta'), { target: { value: 'Ropa' } });
    expect(tarjetas(container).map(li => li.querySelector('.esc-nombre').textContent)).toEqual(['Camiseta']);
  });

  it('45. en inglés, los textos salen en inglés', () => {
    const { container } = render(<Escritorio filas={FILAS} idioma="en" />);
    expect(container.textContent).toContain('3 items');
    expect(tarjetas(container)[2].querySelector('.estado-roto').textContent).toBe('8 good · 2 broken');
  });
});
