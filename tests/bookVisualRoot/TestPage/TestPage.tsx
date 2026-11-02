import { useState } from 'react';

import { PageWrapper } from '../../../src/components/PageWrapper';
import { useBackground } from '../../../src/hooks/effects/background';
import { useFrameEffect } from '../../../src/hooks/effects/frame/useFrameEffect';

type TestPageProps = {
  name: string;
};

export const TestPage = ({ name }: TestPageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const height = isExpanded ? 2400 : 1600;
  const handleExpand = () => setIsExpanded(true);

  useBackground({
    id: `background-${name}`,
    kind: 'background',
    style: { backgroundColor: '#203040' },
  });

  useFrameEffect({
    id: `behind-${name}`,
    kind: 'shadow',
    layer: 'behind',
    shadow: {
      id: `shadow-${name}`,
      sides: ['left', 'right'],
      thickness: 30,
      style: { color: '#ff8000' },
    },
  });

  useFrameEffect({
    id: `above-${name}`,
    kind: 'component',
    layer: 'above',
  });

  useFrameEffect({
    id: `overlay-${name}`,
    kind: 'component',
    layer: 'overlay',
  });

  return (
    <PageWrapper>
      <button data-testid="expand" onClick={handleExpand}>
        Expand {name}
      </button>

      <article data-testid={`page-${name}`} style={{ height }}>
        Page {name}
      </article>
    </PageWrapper>
  );
};
