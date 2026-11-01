export type RendererMetrics = {
  mounts: number;
  unmounts: number;
  liveResources: number;
  activeTimers: number;
  pendingLoads: number;
  loads: number;
  lateCallbacks: number;
  playCalls: number;
};

export const metrics: Record<string, RendererMetrics> = {};

export const getMetrics = (id: string): RendererMetrics => {
  metrics[id] ??= {
    mounts: 0,
    unmounts: 0,
    liveResources: 0,
    activeTimers: 0,
    pendingLoads: 0,
    loads: 0,
    lateCallbacks: 0,
    playCalls: 0,
  };

  return metrics[id];
};
