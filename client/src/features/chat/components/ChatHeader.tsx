
import { FC } from 'react';
import styles from './ChatWindow.module.css';
import { ModelIcon, ExpandIcon, CloseIcon } from './icons';

interface ChatHeaderProps {
    onClose: () => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({ onClose }) => {
    return (
        <div className={styles.header}>
            <div className={styles.model}>
                <p>Devi Pro 3.1</p>
                <ModelIcon />
            </div>
            <div className={styles.button}>
                <ExpandIcon />
                <CloseIcon onClick={onClose} style={{ cursor: 'pointer' }} className={styles.close} />
            </div>
        </div>
    );
};

export default ChatHeader;
