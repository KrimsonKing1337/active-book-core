type CssAnimationOptions = {
  node: HTMLElement;
  className: string;
  duration: number;
  delay?: number;
};

/** Demo-local class ownership. Playback and lifecycle remain in useAnimationPlayback. */
export const startCssAnimation = ({
  node,
  className,
  duration,
  delay = 0,
}: CssAnimationOptions) => {
  const durationBefore = node.style.getPropertyValue('--lab-duration');
  const delayBefore = node.style.getPropertyValue('--lab-delay');
  node.style.setProperty('--lab-duration', `${duration}ms`);
  node.style.setProperty('--lab-delay', `${delay}ms`);
  node.classList.add(className);
  const name = getComputedStyle(node).animationName;
  const animation = node.getAnimations().find((animationCur) => {
    return animationCur instanceof CSSAnimation && animationCur.animationName === name;
  });
  const cleanup = () => {
    node.classList.remove(className);
    if (durationBefore) {
      node.style.setProperty('--lab-duration', durationBefore);
    }
    else {
      node.style.removeProperty('--lab-duration');
    }
    if (delayBefore) {
      node.style.setProperty('--lab-delay', delayBefore);
    }
    else {
      node.style.removeProperty('--lab-delay');
    }
  };

  if (!animation || name.includes(',')) {
    cleanup();
    throw new Error(`Expected one named CSS animation for ${className}`);
  }

  return { animation, cleanup };
};
