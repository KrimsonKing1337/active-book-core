import classNames from 'classnames';

import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import { useReaderWindow } from '@components/StoryWindowHost/hooks';

import { Overflow } from '@components/Overflow';
import { MenuHeader } from '@components/MenuHeader';

import { Item } from './Item';
import { useBookmarks } from './hooks';

import * as styles from './Bookmarks.module.scss';

const buttonAddClassNames = classNames([styles.Button, styles.isAdd]);

export const Bookmarks = () => {
  const { isOpen, close } = useReaderWindow({ kind: 'bookmarks' });
  const { bookmarks, setBookmarks } = useBookmarks();

  const page = useSelector(mainSelectors.page);

  const addButtonClickHandler = () => {
    setBookmarks([...bookmarks, page]);
  };

  const deleteHandler = (bookmark: number) => {
    const newBookmarks = [...bookmarks];

    const index = newBookmarks.indexOf(bookmark);

    newBookmarks.splice(index, 1);

    setBookmarks(newBookmarks);
  };

  return (
    <Overflow id="bookmarks" isOpen={isOpen} onClose={close}>
      <MenuHeader label="Закладки" />

      <div className={styles.ItemsWrapper}>
        {bookmarks.map((itemCur, index) => {
          return (
            <Item key={index} pageNumber={itemCur} onDelete={deleteHandler} />
          );
        })}
      </div>

      <div className={styles.Footer}>
        <button className={buttonAddClassNames} onClick={addButtonClickHandler}>
          Добавить
        </button>

        <button className={styles.Button} onClick={close}>
          Закрыть
        </button>
      </div>
    </Overflow>
  );
};
