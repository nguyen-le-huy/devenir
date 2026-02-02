
import { forwardRef } from 'react';
import styles from './ChatWindow.module.css';
import {
    TrackOrderIcon, AnalyzeDataIcon, BestSellersIcon,
    ShippingIcon, PaymentIcon, MoreIcon
} from './icons';

interface ChatPromptsProps {
    onPromptClick: (text: string) => void;
}

const ChatPrompts = forwardRef<HTMLDivElement, ChatPromptsProps>(({ onPromptClick }, ref) => {
    return (
        <div className={styles.prompts} ref={ref}>
            <div className={styles.row}>
                <div className={`${styles.prompt} promptItem`} onClick={() => onPromptClick('Track my orders')}>
                    <TrackOrderIcon />
                    <p>Track orders</p>
                </div>
                <div className={`${styles.prompt} promptItem`} onClick={() => onPromptClick('Analyze my shopping data')}>
                    <AnalyzeDataIcon />
                    <p>Analyze data</p>
                </div>
                <div className={`${styles.prompt} promptItem`} onClick={() => onPromptClick('Show me best sellers')}>
                    <BestSellersIcon />
                    <p>Best sellers</p>
                </div>
            </div>
            <div className={styles.row}>
                <div className={`${styles.prompt} promptItem`} onClick={() => onPromptClick("What's your shipping policy?")}>
                    <ShippingIcon />
                    <p>Shipping info</p>
                </div>
                <div className={`${styles.prompt} promptItem`} onClick={() => onPromptClick('What payment methods do you accept?')}>
                    <PaymentIcon />
                    <p>Payment options</p>
                </div>
                <div className={`${styles.prompt} promptItem`} onClick={() => onPromptClick('Tell me more')}>
                    <MoreIcon />
                    <p>More</p>
                </div>
            </div>
        </div>
    );
});

ChatPrompts.displayName = 'ChatPrompts';

export default ChatPrompts;
