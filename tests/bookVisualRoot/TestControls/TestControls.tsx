import { useDispatch, useSelector } from '../../../src/store';
import { mainActions, mainSelectors } from '../../../src/store/main';
import { useGoToPage } from '../../../src/hooks/control/useGoToPage';

const toolStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  zIndex: 1000,
};

export const TestControls = () => {
  const { goToPage } = useGoToPage();
  const dispatch = useDispatch();
  const isLoading = useSelector(mainSelectors.showLoader);
  const isAudioUnlocked = useSelector(mainSelectors.isAudioUnlocked);

  const handleFirst = () => goToPage(1);
  const handleSecond = () => goToPage(2);
  const handleEmpty = () => goToPage(3);
  const handleLoading = () => dispatch(mainActions.setShowLoader(!isLoading));

  return (
    <aside data-testid="editor-tools" style={toolStyle}>
      <button data-testid="first" onClick={handleFirst}>
        First
      </button>

      <button data-testid="second" onClick={handleSecond}>
        Second
      </button>

      <button data-testid="empty" onClick={handleEmpty}>
        Empty
      </button>

      <button data-testid="loading" onClick={handleLoading}>
        Loading
      </button>

      <output data-testid="audio-unlocked">
        {String(isAudioUnlocked)}
      </output>
    </aside>
  );
};
