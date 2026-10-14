import { useEffect, useState } from 'react';

import type { IRenderThumbParams, IRenderTrackParams } from 'react-range/lib/types';
import { Range, getTrackBackground } from 'react-range';

const STEP = 1;
const MIN = 0;
const MAX = 100;

import * as styles from './Slider.module.scss';

type SliderProps = {
  value: number;
  onChange?: (value: number) => void;
  onAfterChange?: (value: number) => void;
};

export const Slider = ({ value, onChange, onAfterChange }: SliderProps) => {
  const [values, setValues] = useState([value]);

  useEffect(() => {
    setValues([value]);
  }, [value]);

  const changeHandler = (values: number[]) => {
    setValues(values);

    if (onChange) {
      onChange(values[0]);
    }
  };

  const afterChangeHandler = (values: number[]) => {
    if (onAfterChange) {
      onAfterChange(values[0]);
    }
  };

  const Track = ({ props, children }: IRenderTrackParams) => {
    const trackStyleBackground = getTrackBackground({
      values,
      colors: ['var(--main)', '#ccc'],
      min: MIN,
      max: MAX,
    });

    const trackStyle = {
      background: trackStyleBackground,
    };

    return (
      <div
        style={props.style}
        className={styles.TrackWrapper}
        onMouseDown={props.onMouseDown}
        onTouchStart={props.onTouchStart}
      >
        <div
          ref={props.ref}
          style={trackStyle}
          className={styles.Track}
        >
          {children}
        </div>
      </div>
    );
  };

  const Thumb = ({ props }: IRenderThumbParams) => {
    const { key, style, ...rest } = props;

    return (
      <div
        key={key}
        style={style}
        className={styles.Thumb}
        {...rest}
      />
    );
  };

  return (
    <Range
      values={values}
      step={STEP}
      min={MIN}
      max={MAX}
      renderTrack={Track}
      renderThumb={Thumb}
      onChange={changeHandler}
      onFinalChange={afterChangeHandler}
    />
  );
};
