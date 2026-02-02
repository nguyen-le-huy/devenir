
import { FC } from 'react';
import styles from './ChatMessage.module.css';

interface ChatActionButtonsProps {
    prompt: string;
    onYes: () => void;
    onNo: () => void;
}

const ChatActionButtons: FC<ChatActionButtonsProps> = ({ prompt, onYes, onNo }) => {
    return (
        <div className={`${styles.actionButtons} ${styles.fadeIn}`}>
            <p className={styles.actionPrompt}>
                {prompt}
            </p>
            <div className={styles.buttonGroup}>
                <button className={styles.yesButton} onClick={onYes}>
                    Có, thêm vào giỏ
                </button>
                <button className={styles.noButton} onClick={onNo}>
                    Không, cảm ơn
                </button>
            </div>
        </div>
    );
};

export default ChatActionButtons;
