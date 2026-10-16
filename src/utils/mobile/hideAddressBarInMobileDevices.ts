export const hideAddressBarInMobileDevices = () => {
  setTimeout(() => {
    window.scrollTo(0, 1);
  }, 0);
};
