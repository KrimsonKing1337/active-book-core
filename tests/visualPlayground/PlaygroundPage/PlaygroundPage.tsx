import { PageWrapper } from '@components/PageWrapper';

import type { Settings } from '../@types';

import * as styles from './PlaygroundPage.module.scss';

export const PlaygroundPage = ({ settings, page }: {
  settings: Settings; page: number
}) => {
  return (
    <PageWrapper withoutToolbar={!settings.toolbar} data-playground-page={page}>
      <article className={styles.Article}>
        <p className={styles.Eyebrow}>
          ГЛАВА {page} · МОРЕ ВНУТРИ
        </p>

        <h1>
          Свет под водой
        </h1>

        <p className={styles.Lead}>
          На границе света и тьмы каждое движение оставляет след
        </p>

        <div className={styles.Illustration} aria-hidden="true">
          <span />
        </div>

        {Array.from({ length: 12 }, (_, index) => {
          return (
            <p key={index}>
              Море было тихим, но в глубине уже просыпалось течение. Она положила ладонь на холодную
              раму окна и увидела, как свет медленно растекается по стеклу. За окном не было берега —
              только дымка, далёкий маяк и обещание новой истории. Слова продолжались за краем страницы,
              и стоило прокрутить её вниз, чтобы услышать следующую волну.
            </p>
          );
        })}
      </article>
    </PageWrapper>
  );
};
