import { useVibrationPreview } from '../../../src/hooks/effects/vibration/useVibrationPreview';
import { useFlashlight } from '../../../src/hooks/effects/flashlight/useFlashlight';
import { useInverseColor } from '../../../src/hooks/effects/useInverseColor';

export const PlacementControls = () => {
  const { start, stop } = useVibrationPreview();
  const { flashlightOn, flashlightOff } = useFlashlight({ withFrameShadow: true, speed: 1000 });
  const { inverseColorOn, inverseColorOff } = useInverseColor();
  const handlePreview = () => start(60000);
  const handleFlash = () => { void flashlightOn(); };

  const style = {
    position: 'fixed' as const,
    top: 0,
    right: 0,
    zIndex: 1000,
  };

  return (
    <aside style={style}>
      <button data-testid="preview" onClick={handlePreview}>
        Preview
      </button>

      <button data-testid="stop-preview" onClick={stop}>
        Stop preview
      </button>

      <button data-testid="flash" onClick={handleFlash}>
        Flash
      </button>

      <button data-testid="stop-flash" onClick={flashlightOff}>
        Stop flash
      </button>

      <button data-testid="invert" onClick={inverseColorOn}>
        Invert
      </button>

      <button data-testid="stop-invert" onClick={inverseColorOff}>
        Stop inversion
      </button>
    </aside>
  );
};
