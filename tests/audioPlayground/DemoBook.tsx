import { AppWrapper } from '@components/AppWrapper';

import { effects } from './effects';
import {
  type Scene,
  quietScene,
  scenes,
} from './story';

import * as styles from './AudioPlayground.module.scss';

const audioDescriptions = effects.map(({ label: _label, ...description }) => description);

const bookConfig = {
  id: 'audio-playground',
  pages: scenes.length,
  defaultTheme: 'dark',
};

const quietConfig = {
  id: 'audio-playground-quiet',
  pages: 1,
  defaultTheme: 'dark',
};

const toStoryPage = ({
  id,
  title,
  story,
}: Scene) => ({
  id,
  content: (
    <article className={styles.Narrative}>
      <h2>
        {title}
      </h2>

      <p>
        {story}
      </p>
    </article>
  ),
});

const storyPages = scenes.map(toStoryPage);
const quietPages = [toStoryPage(quietScene)];

const requestedPageId = new URLSearchParams(window.location.search).get('page');
const initialPage = scenes.find(({ id }) => id === requestedPageId) ?? scenes[0];

type DemoBookProps = {
  isQuiet: boolean;
};

export const DemoBook = ({ isQuiet }: DemoBookProps) => {
  if (isQuiet) {
    return (
      <AppWrapper
        bookKey={quietConfig.id}
        initialPageId={quietScene.id}
        storyPages={quietPages}
        config={quietConfig}
        tableOfContents={[]}
        withoutToolbar
      />
    );
  }

  return (
    <AppWrapper
      bookKey={bookConfig.id}
      initialPageId={initialPage.id}
      storyPages={storyPages}
      audioDescriptions={audioDescriptions}
      config={bookConfig}
      tableOfContents={[]}
      withoutToolbar
    />
  );
};
