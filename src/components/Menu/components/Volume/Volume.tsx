import { useDispatch, useSelector } from '@store';

import { volumeActions, volumeSelectors } from '@store/volume';
import { mainSelectors } from '@store/main';

import { Label } from '@components/Label';
import { Slider } from '@components/Slider';

import { set as localStorageSet } from '@utils/localStorage/localStorage';

import * as styles from './Volume.module.scss';

export const Volume = () => {
  const dispatch = useDispatch();

  const id = useSelector(mainSelectors.id);

  const allVolume = useSelector(volumeSelectors.all);
  const globalVolume = useSelector(volumeSelectors.global);
  const bgVolume = useSelector(volumeSelectors.bg);
  const sfxVolume = useSelector(volumeSelectors.sfx);
  const musicVolume = useSelector(volumeSelectors.music);
  const videosVolume = useSelector(volumeSelectors.videos);

  const afterChangeHandler = () => {
    // сохраняем значения в localstorage
    localStorageSet(id, { volume: allVolume });
  };

  const globalChangeHandler = (value: number) => {
    dispatch(volumeActions.setGlobal(value));
  };

  const bgChangeHandler = (value: number) => {
    dispatch(volumeActions.setBg(value));
  };

  const sfxChangeHandler = (value: number) => {
    dispatch(volumeActions.setSfx(value));
  };

  const musicChangeHandler = (value: number) => {
    dispatch(volumeActions.setMusic(value));
  };

  const videosChangeHandler = (value: number) => {
    dispatch(volumeActions.setVideos(value));
  };

  const volumeControls = [
    {
      id: 'global',
      label: 'Общая громкость',
      value: globalVolume,
      onChange: globalChangeHandler,
    },
    {
      id: 'music',
      label: 'Громкость музыки',
      value: musicVolume,
      onChange: musicChangeHandler,
    },
    {
      id: 'sfx',
      label: 'SFX',
      value: sfxVolume,
      onChange: sfxChangeHandler,
    },
    {
      id: 'bg',
      label: 'Фоновые звуки',
      value: bgVolume,
      onChange: bgChangeHandler,
    },
    {
      id: 'videos',
      label: 'Громкость видео',
      value: videosVolume,
      onChange: videosChangeHandler,
    },
  ];

  return (
    <div className={styles.Volume}>
      {volumeControls.map((controlCur) => {
        const {
          id,
          label,
          value,
          onChange,
        } = controlCur;

        return (
          <div key={id} className={styles.Item}>
            <Label label={label} />

            <Slider
              className={styles.Slider}
              value={value}
              onChange={onChange}
              onAfterChange={afterChangeHandler}
            />
          </div>
        );
      })}
    </div>
  );
};
