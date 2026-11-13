import { useState } from 'react';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { StoryDialog } from '../StoryDialog';

jest.mock('embla-carousel-react', () => {
  throw new Error('Standalone StoryDialog must not load Embla');
});
jest.mock('@components/Carousel/context', () => {
  throw new Error('Standalone StoryDialog must not load Carousel contexts');
});

const StatefulContent = () => {
  const [count, setCount] = useState(0);

  return (
    <button type="button" onClick={() => setCount((previous) => previous + 1)}>
      Count {count}
    </button>
  );
};

test('standalone presentation controls preserve the shell and child state without Carousel dependencies', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const props = {
    container,
    isOpen: true,
    title: 'Independent dialog',
    onOpenChange: jest.fn(),
  };
  const view = render(
    <StoryDialog {...props} mode="media">
      <StatefulContent />
    </StoryDialog>,
  );
  const shell = screen.getByRole('dialog');
  fireEvent.click(screen.getByText('Count 0'));
  fireEvent.click(screen.getByText('Заполнить область'));
  expect(shell).toHaveAttribute('data-object-fit', 'cover');
  fireEvent.click(screen.getByText('Развернуть окно'));
  expect(shell).toHaveAttribute('data-fullscreen', 'true');
  view.rerender(
    <StoryDialog {...props} mode="default">
      <StatefulContent />
    </StoryDialog>,
  );
  expect(screen.getByRole('dialog')).toBe(shell);
  expect(screen.getByText('Count 1')).toBeInTheDocument();
  expect(screen.queryByText('Заполнить область')).not.toBeInTheDocument();
  view.unmount();
  container.remove();
  localStorage.clear();
});
