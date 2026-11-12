import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import { useReaderWindow } from '@components/StoryWindowHost/hooks';

import { Overflow, MenuHeader } from '@components';

import { Item } from './Item';

import * as styles from './TableOfContents.module.scss';

export const TableOfContents = () => {
  const { isOpen, close } = useReaderWindow({ kind: 'tableOfContents' });
  const tableOfContents = useSelector(mainSelectors.tableOfContents);

  return (
    <Overflow id="table-of-contents" isOpen={isOpen} onClose={close}>
      <MenuHeader label="Оглавление" />

      <div className={styles.ItemsWrapper}>
        {tableOfContents.map((itemCur) => {
          const { title, pageNumber } = itemCur;

          const uuid = `${pageNumber}___${title}`;

          return (
            <Item key={uuid} {...itemCur} />
          );
        })}
      </div>

      <button className={styles.Button} onClick={close}>
        Закрыть
      </button>
    </Overflow>
  );
};
