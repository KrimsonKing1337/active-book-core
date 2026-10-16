export const getIsMobile = () => {
  return !!(window as any).cordova;
};
