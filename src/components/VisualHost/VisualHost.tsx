import type { StoryRegion } from '@components/StoryRegionsProvider/context';

import { useStoryRegions } from '@components/StoryRegionsProvider';

import * as styles from './VisualHost.module.scss';

/** A stable portal destination. Its children use the real region as containing block. */
export const VisualHost = ({ region }: {
  region: StoryRegion 
}) => {
  const { hostRefs } = useStoryRegions();

  return (
    <div
      ref={hostRefs[region]}
      className={styles.Host}
      data-visual-host={region}
      inert
    />
  );
};
