import { useState } from 'react';

import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';
import { windowsActions } from '@store/windows';

import type { StoryDialogProps } from '@components/StoryDialog/@types';

import { Carousel } from '@components/Carousel';
import { embla, emblaApi } from '@components/Carousel/tests/embla';
import { StoryRegionsProvider } from '@components/StoryRegionsProvider';

import type { StoryWindowContent } from '../@types';

import { StoryWindowHost } from '../StoryWindowHost';
import { StoryWindowSessionContext } from '../context';

jest.mock('embla-carousel-react', () => ({ __esModule: true, default: () => [jest.fn(), emblaApi] }));
jest.mock('@components/StoryDialog', () => ({
  ...jest.requireActual('@components/StoryDialog'),
  StoryDialog: ({ children, mode }: StoryDialogProps) => (
    <div data-testid="shell" data-mode={mode}>
      {children}
    </div>
  ),
}));

const owner = { sessionId: 'model-presentation-test', pageId: 'page-a' };

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Count {count}
    </button>
  );
};

beforeEach(() => {
  embla.reset();
  store.dispatch(mainActions.setStoryPages(['page-a']));
  store.dispatch(mainActions.setPage('page-a'));
  store.dispatch(windowsActions.synchronizeSession(owner));
  store.dispatch(windowsActions.open({ ...owner, contentId: 'gallery' }));
});

afterEach(() => {
  store.dispatch(windowsActions.endSession(owner.sessionId));
});

const hostTree = (resolveContent: (id: string) => StoryWindowContent) => (
  <StoreProvider>
    <StoryWindowSessionContext value={owner.sessionId}>
      <StoryRegionsProvider>
        <StoryWindowHost resolveContent={resolveContent} />
      </StoryRegionsProvider>
    </StoryWindowSessionContext>
  </StoreProvider>
);

test('derives only mode from onSelect while preserving shell, carousel, local state and window identity', () => {
  let notify: ((index: number) => void) | undefined;
  const resolver = (): StoryWindowContent => ({
    title: 'Gallery',
    nodes: [
      {
        type: 'carousel',
        content: [
          { type: 'carouselSlide', content: [{ type: 'paragraph' }] },
          { type: 'carouselSlide', content: [{ type: 'image' }] },
          { type: 'carouselSlide', content: [{ type: 'video' }] },
        ],
      },
    ],
    render: (onSelect) => {
      notify = onSelect;

      return (
        <Carousel
          slides={[
            <Counter key="text" />,
            <img key="image" alt="Image" />,
            <p key="video" />,
          ]}
          onSelect={onSelect}
        />
      );
    },
  });
  const view = render(hostTree(resolver));
  const shell = screen.getByTestId('shell');
  const carousel = screen.getByRole('region');
  const initial = store.getState().windows.activeWindow;
  fireEvent.click(screen.getByText('Count 0'));
  fireEvent.click(screen.getByText('Следующий слайд'));
  expect(shell).toHaveAttribute('data-mode', 'media');
  expect(screen.getByText('2 из 3')).toBeInTheDocument();
  // A normal resolver rerender with equivalent new arrays must not restore slide zero's mode.
  view.rerender(hostTree(resolver));
  expect(shell).toHaveAttribute('data-mode', 'media');
  fireEvent.click(screen.getByText('Следующий слайд'));
  expect(shell).toHaveAttribute('data-mode', 'media');
  expect(screen.getByRole('region')).toBe(carousel);
  expect(screen.getByTestId('shell')).toBe(shell);
  expect(store.getState().windows.activeWindow).toBe(initial);
  fireEvent.click(screen.getByText('Предыдущий слайд'));
  fireEvent.click(screen.getByText('Предыдущий слайд'));
  expect(shell).toHaveAttribute('data-mode', 'default');
  expect(screen.getByText('Count 1')).toBeInTheDocument();
  const staleNotify = notify;
  act(() => store.dispatch(windowsActions.open({ ...owner, contentId: 'replacement' })));
  expect(shell).toHaveAttribute('data-mode', 'default');
  fireEvent.click(screen.getByText('Следующий слайд'));
  expect(shell).toHaveAttribute('data-mode', 'media');
  act(() => staleNotify?.(0));
  expect(shell).toHaveAttribute('data-mode', 'media');
  expect(screen.getByText('2 из 3')).toBeInTheDocument();
  view.unmount();
});

test('keeps explicit mode for opaque React children, even if they render media', () => {
  render(hostTree(() => ({
    title: 'Explicit',
    mode: 'default',
    children: <img alt="Opaque" />,
  })));
  expect(screen.getByTestId('shell')).toHaveAttribute('data-mode', 'default');
  expect(screen.getByAltText('Opaque')).toBeInTheDocument();
});
