import { render } from '@testing-library/react';

import { AppModeContext } from '@components/App/AppModeContext';
import { StoryRegionsProvider } from '@components/StoryRegionsProvider';
import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import { VisualSelectionOutline } from '@components/VisualSelectionOutline';

import { StoryRoot } from './StoryRoot';

jest.mock('@components/VisualSelectionOutline', () => ({
  VisualSelectionOutline: jest.fn(() => null),
}));

test('selection mounts only in editor and receives the selected surface without replacing book content', () => {
  const selected: VisualSurfaceItem = {
    id: 'selected',
    placement: { region: 'story' },
    depth: { plane: 'background' },
    content: null,
  };
  const surfaces = [selected];
  const outline = jest.mocked(VisualSelectionOutline);
  outline.mockReturnValue(null);

  const view = render(
    <AppModeContext value="reader">
      <StoryRegionsProvider>
        <StoryRoot surfaces={surfaces} selectedVisualEffectId="selected">
          <input aria-label="Book state" defaultValue="persistent" />
        </StoryRoot>
      </StoryRegionsProvider>
    </AppModeContext>,
  );
  const input = view.getByRole('textbox');
  expect(outline).not.toHaveBeenCalled();

  view.rerender(
    <AppModeContext value="editor">
      <StoryRegionsProvider>
        <StoryRoot surfaces={surfaces} selectedVisualEffectId="selected">
          <input aria-label="Book state" defaultValue="persistent" />
        </StoryRoot>
      </StoryRegionsProvider>
    </AppModeContext>,
  );
  expect(outline).toHaveBeenCalled();
  expect(outline.mock.calls.at(-1)?.[0].item).toBe(selected);
  expect(view.getByRole('textbox')).toBe(input);

  outline.mockClear();
  view.rerender(
    <AppModeContext value="reader">
      <StoryRegionsProvider>
        <StoryRoot surfaces={surfaces} selectedVisualEffectId="selected">
          <input aria-label="Book state" defaultValue="persistent" />
        </StoryRoot>
      </StoryRegionsProvider>
    </AppModeContext>,
  );
  expect(outline).not.toHaveBeenCalled();
  expect(view.getByRole('textbox')).toBe(input);
});
