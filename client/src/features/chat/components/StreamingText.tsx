/**
 * StreamingText Component
 * Optimized text streaming animation with requestAnimationFrame
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { parseBoldText } from '../utils/chatValidation';
import { STREAMING_SPEED_MS, STREAMING_CHARS_PER_FRAME } from '../utils/chatConstants';
import styles from './StreamingText.module.css';

interface StreamingTextProps {
    text: string;
    onComplete?: () => void;
    speed?: number;
}

/**
 * StreamingText Component
 * Displays text with typewriter animation effect
 * Uses RAF for smooth 60fps animation
 */
const StreamingText = memo<StreamingTextProps>(({
    text,
    onComplete,
    speed = STREAMING_SPEED_MS
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        if (!text) return;

        // Reset for new message
        indexRef.current = 0;
        setDisplayedText('');
        setIsComplete(false);

        const animate = (timestamp: number) => {
            // Throttle updates for performance
            if (timestamp - lastUpdateRef.current < speed) {
                rafRef.current = requestAnimationFrame(animate);
                return;
            }
            lastUpdateRef.current = timestamp;

            // Add characters in chunks for smoother feel
            const nextIndex = Math.min(
                indexRef.current + STREAMING_CHARS_PER_FRAME,
                text.length
            );

            if (indexRef.current < text.length) {
                setDisplayedText(text.slice(0, nextIndex));
                indexRef.current = nextIndex;
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setIsComplete(true);
                onComplete?.();
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [text, speed, onComplete]);

    /**
     * Render text with bold support
     */
    const renderMessage = useCallback((content: string) => {
        if (!content) return null;

        const parts = parseBoldText(content);

        return parts.map((part, index) => {
            if (part.bold) {
                return <strong key={index}>{part.text}</strong>;
            }
            return <span key={index}>{part.text}</span>;
        });
    }, []);

    return (
        <span className={styles.streamingText}>
            {renderMessage(displayedText)}
            {!isComplete && <span className={styles.cursor}>|</span>}
        </span>
    );
});

StreamingText.displayName = 'StreamingText';

export default StreamingText;
