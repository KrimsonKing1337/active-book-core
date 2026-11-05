import { useGoToPage } from '@hooks/control/useGoToPage';

import * as styles from './PlaygroundPage.module.scss';

export const PlaygroundPage = ({ page }: {
  page: number
}) => {
  const { goToPage } = useGoToPage();
  const titles = ['Свет под водой', 'Город над облаками', 'Тишина пустыни', 'Лес после дождя'];
  const paragraphs = [
    'Море было тихим. На глубине просыпалось течение, и свет медленно растекался по стеклу подводной станции.',
    'Трамвай пролетел над крышами. На площади воздушного города звенели колокола, собирая утреннюю толпу.',
    'Песок скрыл следы каравана. Между красными скалами не было ни звука; только ветер шевелил карту.',
    'Капли падали с ветвей на папоротник. Влажная тропа вела к лесному дому, где уже зажгли огонь.',
  ];

  return (
    <>
      <article className={styles.Article} data-playground-page={page}>
        <p className={styles.Eyebrow}>
          ГЛАВА {page} · МОРЕ ВНУТРИ
        </p>

        <h1>
          {titles[page - 1]}
        </h1>

        <p className={styles.Lead}>
          На границе света и тьмы каждое движение оставляет след
        </p>

        <div className={styles.Illustration} aria-hidden="true">
          <span />
        </div>

        <button data-testid="content-next" onClick={() => goToPage(page === 4 ? 1 : page + 1)}>
          Продолжить историю
        </button>

        {Array.from({ length: 12 }, (_, index) => {
          return (
            <p key={index}>
              {paragraphs[page - 1]}
            </p>
          );
        })}
      </article>
    </>
  );
};
