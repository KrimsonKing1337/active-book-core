type VolumeFactors = {
  global: number;
  category: number;
  relative: number;
};

// All factors are normalized to 0..1 at the caller; media APIs use the same range.
export const getMediaVolume = ({
  global,
  category,
  relative,
}: VolumeFactors) => {
  return global * category * relative;
};
