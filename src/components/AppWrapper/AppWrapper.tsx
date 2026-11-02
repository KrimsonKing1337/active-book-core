import type { PropsWithChildren } from 'react';

import { useState } from 'react';

import { createVisualEffects, VisualEffectsContext } from '@controllers/visualEffects';

import type { AppWrapperProps } from './@types';

import { AppContent } from './components/AppContent';

export type { AppWrapperProps } from './@types';

export const AppWrapper = (props: PropsWithChildren<AppWrapperProps>) => {
  const [ownedSession] = useState(() => {
    if (props.visualEffects) {
      return props.visualEffects;
    }

    return createVisualEffects({ pages: props.config.pages });
  });

  const session = props.visualEffects ?? ownedSession;

  return (
    <VisualEffectsContext value={session}>
      <AppContent {...props} visualEffects={session} />
    </VisualEffectsContext>
  );
};
