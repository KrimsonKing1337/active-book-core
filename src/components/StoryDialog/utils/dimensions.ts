export const getDialogDimension = (value = 75): string => {
  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    throw new RangeError('Dialog dimensions must be finite percentages greater than 0 and at most 100');
  }

  return `${value}%`;
};
