export const readVolumeMatrix = async () => {
  const fixture = window.audioLifecycle;
  const levels = [
    0,
    25,
    50,
    100,
  ];
  const ids = [
    'audio',
    'bg',
    'music',
  ];
  const video = document.createElement('video');
  document.body.append(video);
  const failures = [];
  let checked = 0;
  const check = async (phase, expected) => {
    // AudioParam values become observable after the audio rendering quantum.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const id of ids) {
      const howl = fixture.get(id).howlInst;

      if (Math.abs(howl.volume() - expected) > 1e-12) {
        failures.push({
          id,
          phase,
          actual: howl.volume(),
          expected,
        });
      }

      for (const sound of Reflect.get(howl, '_sounds')) {
        if (!sound._paused && Math.abs(sound._node.gain.value - expected) > 1e-6) {
          failures.push({
            id,
            phase,
            actual: sound._node.gain.value,
            expected,
          });
        }
      }

      checked += 1;
    }

    if (Math.abs(video.volume - expected) > 1e-12) {
      failures.push({
        id: 'video',
        phase,
        actual: video.volume,
        expected,
      });
    }

    checked += 1;
  };

  for (const global of levels) {
    for (const category of levels) {
      for (const relative of levels) {
        video.setAttribute('data-relativeVolume', String(relative));

        for (const id of ids) {
          fixture.get(id).relativeVolume = relative;
        }

        fixture.store.dispatch(fixture.volumeActions.setAll({
          global,
          sfx: category,
          bg: category,
          music: category,
          videos: category,
        }));
        const expected = global * category * relative / 1_000_000;
        await check('setAll', expected);
        fixture.store.dispatch(fixture.volumeActions.setGlobal(global));
        await check('same global', expected);
        fixture.store.dispatch(fixture.volumeActions.setSfx(category));
        fixture.store.dispatch(fixture.volumeActions.setBg(category));
        fixture.store.dispatch(fixture.volumeActions.setMusic(category));
        fixture.store.dispatch(fixture.volumeActions.setVideos(category));
        await check('same categories', expected);

        for (const type of [
          'sfx',
          'bg',
          'music',
        ]) {
          const created = fixture.create({
            id: 'created',
            type,
            relativeVolume: relative,
          });

          if (Math.abs(created.howlInst.volume() - expected) > 1e-12) {
            failures.push({
              type,
              phase: 'constructor',
              actual: created.howlInst.volume(),
              expected,
            });
          }

          await created.unload();
          checked += 1;
        }
      }
    }
  }

  for (const id of ids) {
    await fixture.cleanup(id);
  }

  video.remove();

  return {
    checked,
    failures,
    resources: fixture.resourceCount(),
  };
};
