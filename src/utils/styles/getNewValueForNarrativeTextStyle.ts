// font-size || line-height
export const getNewValueForNarrativeTextStyle = (currentValue: number, isMoreAction: boolean) => {
  const step = 25;
  const limit = isMoreAction ? 150 : 75;

  let newValue;

  if (isMoreAction) {
    newValue = currentValue + step;

    if (newValue >= limit) {
      return limit;
    }
  } else {
    newValue = currentValue - step;

    if (newValue <= limit) {
      return limit;
    }
  }

  return newValue;
};
