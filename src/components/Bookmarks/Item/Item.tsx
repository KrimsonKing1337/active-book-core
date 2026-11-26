import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

import { useReaderNavigation } from '@hooks/control/useReaderNavigation';

import * as styles from './Item.module.scss';

export type ItemProps = {
  pageNumber: number;
  onDelete: (bookmark: number) => void;
};

export const Item = ({ pageNumber, onDelete }: ItemProps) => {
  const { goToPage } = useReaderNavigation();

  const clickHandler = () => {
    goToPage(pageNumber);
  };

  const deleteIconClickHandler = (e: React.MouseEvent) => {
    e.stopPropagation();

    onDelete(pageNumber);
  };

  return (
    <div className={styles.Item} onClick={clickHandler}>
      <div className={styles.PageNumber}>
        Страница {pageNumber}
      </div>

      <div className={styles.DeleteIcon} onClick={deleteIconClickHandler}>
        <FontAwesomeIcon icon={faTimes} />
      </div>
    </div>
  );
};
