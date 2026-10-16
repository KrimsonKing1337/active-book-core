export const on = (n: number) => {
  navigator.vibrate(n);
};

export const off = () => {
  navigator.vibrate(0);
};
