
import { forwardRef, KeyboardEvent, useImperativeHandle, useRef } from 'react';
import styles from './ChatWindow.module.css';
import { SendIcon, VoiceIcon, ShortcutsIcon, AttachIcon } from './icons';

interface ChatInputProps {
    value: string;
    onChange: (val: string) => void;
    onSend: () => void;
}

export interface ChatInputHandle {
    focus: () => void;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({ value, onChange, onSend }, ref) => {
    const inputEntryRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            inputEntryRef.current?.focus();
        }
    }));

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleContainerClick = () => {
        inputEntryRef.current?.focus();
    };

    return (
        <div className={styles.bottom}>
            <div className={styles.input} onClick={handleContainerClick}>
                <input
                    type="text"
                    placeholder="How can I help?"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    ref={inputEntryRef}
                />
                <div
                    onClick={() => {
                        if (value.trim()) onSend();
                    }}
                    style={{
                        cursor: value.trim() ? 'pointer' : 'default',
                        opacity: value.trim() ? 1 : 0.5
                    }}
                >
                    <SendIcon />
                </div>
            </div>
            <div className={styles.actions}>
                <div className={styles.action}>
                    <VoiceIcon />
                    <p>Voice mode</p>
                </div>
                <div className={styles.shortcuts}>
                    <div className={styles.action}>
                        <ShortcutsIcon />
                        <p>Shortcuts</p>
                    </div>
                    <div className={styles.action}>
                        <AttachIcon />
                        <p>Attach</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
