import type {
  VisualEffectDefinition,
  VisualEffectInstance,
  VisualEffectRegistration,
} from '@active-book/types';

export type CreateVisualEffectsOptions = {
  definitions?: readonly VisualEffectDefinition[];
  pages: number;
};

/** Host metadata is separate from the author-controlled depth contract. */
export type HostVisualEffectDefinition = VisualEffectDefinition & {
  systemFeedback?: boolean;
};

export type VisualEffectChanges = {
  effect?: Partial<Omit<VisualEffectInstance, 'id' | 'definitionId'>>;
  lifetime?: VisualEffectRegistration['lifetime'];
};
