import type {
  VisualEffectDefinition,
  VisualEffectInstance,
  VisualEffectRegistration,
} from '@active-book/types';

export type CreateVisualEffectsOptions = {
  definitions: readonly VisualEffectDefinition[];
  pages: number;
};

export type VisualEffectChanges = {
  effect?: Partial<Omit<VisualEffectInstance, 'id' | 'definitionId'>>;
  lifetime?: VisualEffectRegistration['lifetime'];
};
