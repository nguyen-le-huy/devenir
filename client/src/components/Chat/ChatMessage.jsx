import styles from './ChatMessage.module.css';

const ChatMessage = ({ message }) => {
    const isUser = message.sender === 'user';

    return (
        <div className={isUser ? styles.userMessage : styles.botMessage}>
            <div className={styles.messageBubble}>
                <p>{message.text}</p>
            </div>
        </div>
    );
};

export default ChatMessage;
