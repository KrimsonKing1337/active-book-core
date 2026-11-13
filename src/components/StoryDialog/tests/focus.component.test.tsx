import { render, screen } from '@testing-library/react';

import { usePresentationFocus } from '../hooks';

const Toolbar = ({ isMedia }: {
  isMedia: boolean
}) => {
  const { fullscreenRef, setFitRef } = usePresentationFocus();

  return (
    <div>
      <button ref={fullscreenRef} type="button">
        Fullscreen
      </button>

      {isMedia && (
        <button ref={setFitRef} type="button">
          Fit
        </button>
      )}
    </div>
  );
};

test('keeps focus on existing controls when presentation removes the focused fit button', () => {
  const { rerender } = render(<Toolbar isMedia />);
  screen.getByRole('button', { name: 'Fit' }).focus();
  rerender(<Toolbar isMedia />);
  expect(screen.getByRole('button', { name: 'Fit' })).toHaveFocus();
  rerender(<Toolbar isMedia={false} />);
  expect(screen.getByRole('button', { name: 'Fullscreen' })).toHaveFocus();
});
