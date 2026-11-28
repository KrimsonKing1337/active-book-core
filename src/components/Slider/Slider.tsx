import { useEffect, useState } from 'react';

import type { IRenderThumbParams, IRenderTrackParams } from 'react-range/lib/types';
import { Range, getTrackBackground } from 'react-range';

import classNames from 'classnames';

const STEP = 1;
const MIN = 0;

import * as styles from './Slider.module.scss';

type SliderProps = {
  className?: string;
  value: number;
  max?: number;
  label?: string;
  onChange?: (value: number) => void;
  onAfterChange?: (value: number) => void;
};

export const Slider = ({
  className = '',
  value,
  max = 100,
  label,
  onChange,
  onAfterChange,
}: SliderProps) => {
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
    const trackWrapperClassNames = classNames({
      [styles.TrackWrapper]: true,
      [className]: !!className,
    });

    const trackStyleBackground = getTrackBackground({
      values,
      colors: ['var(--main)', '#ccc'],
      min: MIN,
      max,
    });

    const trackStyle = {
      background: trackStyleBackground,
    };

    return (
      <div
        style={props.style}
        className={trackWrapperClassNames}
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
    const {
      key,
      style,
      ...rest
    } = props;

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
      max={max}
      label={label}
      renderTrack={Track}
      renderThumb={Thumb}
      onChange={changeHandler}
      onFinalChange={afterChangeHandler}
    />
  );
};
