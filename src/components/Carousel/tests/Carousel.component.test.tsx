import { useState } from 'react';

import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { Carousel, useCarouselSlideActive } from '../index';

import { embla } from './embla';

jest.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: () => [() => {}, jest.requireActual('./embla').emblaApi],
}));

beforeEach(() => embla.reset());

const Counter = ({ id }: {
  id: string;
}) => {
  const [count, setCount] = useState(0);
  const isActive = useCarouselSlideActive();

  return (
    <button data-testid={id} data-active={isActive} onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
};

test('activity matches inert and aria-hidden; switching preserves child state', () => {
  render(<Carousel slides={[<Counter key="a" id="a" />, <Counter key="b" id="b" />]} />);
  const first = screen.getByTestId('a');
  const second = screen.getByTestId('b');
  fireEvent.click(first);
  fireEvent.click(screen.getByRole('button', { name: 'Следующий слайд' }));

  expect(first).toHaveAttribute('data-active', 'false');
  expect(first.closest('[data-carousel-slide]')).toHaveAttribute('inert');
  expect(first.closest('[data-carousel-slide]')).toHaveAttribute('aria-hidden', 'true');
  expect(second).toHaveAttribute('data-active', 'true');
  expect(second.closest('[data-carousel-slide]')).not.toHaveAttribute('inert');
  expect(first.textContent).toBe('1');

  fireEvent.click(screen.getByRole('button', { name: 'Предыдущий слайд' }));
  expect(screen.getByTestId('a')).toBe(first);
  expect(first).toHaveAttribute('data-active', 'true');
});

test('outside a carousel the activity hook returns true', () => {
  render(<Counter id="outside" />);
  expect(screen.getByTestId('outside')).toHaveAttribute('data-active', 'true');
});

test('explicit React keys preserve child identity when slides are reordered', () => {
  const slides = [<Counter key="a" id="a" />, <Counter key="b" id="b" />];
  const { rerender } = render(<Carousel slides={slides} />);
  const first = screen.getByTestId('a');
  fireEvent.click(first);
  rerender(<Carousel slides={[slides[1], slides[0]]} />);

  expect(screen.getByTestId('a')).toBe(first);
  expect(first.textContent).toBe('1');
  expect(first).toHaveAttribute('data-active', 'false');
  expect(screen.getByTestId('b')).toHaveAttribute('data-active', 'true');
});

test('empty slides render neither a counter nor focusable navigation', () => {
  embla.count = 0;
  const onSelect = jest.fn();
  const { container } = render(<Carousel slides={[]} onSelect={onSelect} />);

  expect(container).toBeEmptyDOMElement();
  expect(onSelect).not.toHaveBeenCalled();
});

test('arrow keys on descendants do not navigate the carousel', () => {
  render(<Carousel slides={[<Counter key="a" id="a" />]} />);
  const onSelect = jest.fn();
  embla.listeners.select.add(onSelect);
  fireEvent.keyDown(screen.getByTestId('a'), { key: 'ArrowRight' });
  expect(onSelect).not.toHaveBeenCalled();
  act(() => embla.listeners.select.delete(onSelect));
});
