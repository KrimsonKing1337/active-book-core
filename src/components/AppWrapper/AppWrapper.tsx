import type { PropsWithChildren } from 'react';

import { useState } from 'react';

import { createVisualEffects } from '../../controllers/visualEffects';
import { VisualEffectsContext } from '../../controllers/visualEffects/context';

import type { AppWrapperProps } from './@types';

import { AppContent } from './components/AppContent';

export type { AppWrapperProps } from './@types';

export const AppWrapper = (props: PropsWithChildren<AppWrapperProps>) => {
  const [ownedSession] = useState(() => props.visualEffects ?? createVisualEffects({ pages: props.config.pages }));
  const session = props.visualEffects ?? ownedSession;

  return (
    <VisualEffectsContext value={session}>
      <AppContent {...props} visualEffects={session} />
    </VisualEffectsContext>
  );
};
