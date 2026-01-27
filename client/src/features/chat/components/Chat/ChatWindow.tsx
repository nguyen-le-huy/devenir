import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './ChatWindow.module.css';
import Devi from './Devi';
import ChatMessage from './ChatMessage';
import { useChat } from '@/features/chat/hooks/useChat';
import {
    ModelIcon, ExpandIcon, CloseIcon, TrackOrderIcon,
    AnalyzeDataIcon, BestSellersIcon, ShippingIcon,
    PaymentIcon, MoreIcon, SendIcon, VoiceIcon,
    ShortcutsIcon, AttachIcon
} from './ChatIcons';
import gsap from 'gsap';
import SplitText from 'gsap/src/SplitText';

gsap.registerPlugin(SplitText);

interface ChatWindowProps {
    onClose: () => void;
}

const ChatWindow = ({ onClose }: ChatWindowProps) => {
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const promptsRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [inputValue, setInputValue] = useState('');

    // Use Custom Hook for Logic
    const {
        messages,
        isTyping,
        showInitialView,
        isAuthenticated,
        user,
        sendMessage,
        handleAction,
        markMessageAsStreamed
    } = useChat();

    // Auto focus input when chat window opens
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Prevent main page scroll when mouse is over chat window
    useEffect(() => {
        const chatWindow = chatWindowRef.current;
        if (!chatWindow) return;

        const handleWheel = (e: WheelEvent) => {
            e.stopPropagation();
            const topArea = chatWindow.querySelector('[data-chat-scroll]');
            const messagesArea = chatWindow.querySelector('[data-scrollable]');

            const isInScrollable = (topArea && topArea.contains(e.target as Node)) ||
                (messagesArea && messagesArea.contains(e.target as Node));

            if (isInScrollable) return;
            e.preventDefault();
        };

        chatWindow.addEventListener('wheel', handleWheel, { passive: false });
        return () => chatWindow.removeEventListener('wheel', handleWheel);
    }, []);

    // Text animation - optimized to prevent flash
    useEffect(() => {
        if (!contentRef.current || !promptsRef.current) return;

        let splits: any[] = [];
        let tl: gsap.core.Timeline | null = null;

        const contentTexts = contentRef.current.querySelectorAll('.splitChat');
        const promptsItem = promptsRef.current.querySelectorAll('.promptItem');

        gsap.set(contentTexts, { visibility: 'hidden', opacity: 0 });
        gsap.set(promptsItem, { visibility: 'hidden', opacity: 0, y: 20 });

        document.fonts.ready.then(() => {
            contentTexts.forEach((text) => {
                const split = new SplitText(text, { type: "words,lines", linesClass: "line" });
                splits.push(split);
                split.lines.forEach((line: any) => {
                    const wrapper = document.createElement('div');
                    wrapper.style.overflow = 'hidden';
                    line.parentNode.insertBefore(wrapper, line);
                    wrapper.appendChild(line);
                });
                gsap.set(split.lines, { yPercent: 100, opacity: 0 });
            });

            gsap.set(contentTexts, { visibility: 'visible', opacity: 1 });
            gsap.set(promptsItem, { visibility: 'visible' });

            tl = gsap.timeline();
            splits.forEach((split, index) => {
                tl!.to(split.lines, {
                    duration: 0.8,
                    yPercent: 0,
                    opacity: 1,
                    stagger: 0.08,
                    ease: "power2.out",
                }, index * 0.15);
            });

            promptsItem.forEach((item) => {
                tl!.to(item, {
                    duration: 0.6,
                    y: 0,
                    opacity: 1,
                    ease: "power2.out",
                }, "-=0.4");
            });
        });

        return () => {
            if (tl) tl.kill();
            splits.forEach(split => {
                try { split.revert(); } catch (e) { /* Ignore revert errors */ }
            });
        };
    }, []);

    // Scroll handling
    useEffect(() => {
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];

        if (lastMessage.sender === 'user') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            setTimeout(() => {
                const element = document.getElementById(`msg-${lastMessage.id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }, [messages]);

    const handleSend = useCallback(() => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    }, [inputValue, sendMessage]);

    const handlePromptClick = useCallback((promptText: string) => {
        sendMessage(promptText);
    }, [sendMessage]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className={styles.chatWindow} ref={chatWindowRef} data-lenis-prevent>
            <div className={styles.top} data-scrollable data-chat-scroll>
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

                {showInitialView ? (
                    <>
                        <div className={styles.deviIcon}>
                            <Devi width={75} height={75} />
                        </div>
                        <div className={styles.content} ref={contentRef}>
                            <p className={`${styles.contentHi} splitChat`}>
                                Hi {isAuthenticated && user?.username ? user.username : 'there'},
                            </p>
                            <p className={`${styles.contentText} splitChat`}>
                                {isAuthenticated ? 'Welcome back! How can I help?' : 'Welcome! How can I help?'}
                            </p>
                            <p className={`${styles.contentHi} splitChat`}>
                                I'm here to help you tackle your questions.<br />
                                Choose from the prompts below or just tell<br />
                                me what you need
                            </p>
                        </div>
                        <div className={styles.prompts} ref={promptsRef}>
                            <div className={styles.row}>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('Track my orders')}>
                                    <TrackOrderIcon />
                                    <p>Track orders</p>
                                </div>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('Analyze my shopping data')}>
                                    <AnalyzeDataIcon />
                                    <p>Analyze data</p>
                                </div>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('Show me best sellers')}>
                                    <BestSellersIcon />
                                    <p>Best sellers</p>
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick("What's your shipping policy?")}>
                                    <ShippingIcon />
                                    <p>Shipping info</p>
                                </div>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('What payment methods do you accept?')}>
                                    <PaymentIcon />
                                    <p>Payment options</p>
                                </div>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('Tell me more')}>
                                    <MoreIcon />
                                    <p>More</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.messagesArea} data-lenis-prevent data-scrollable>
                        {messages.map((message, index) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                onActionClick={handleAction}
                                isLatest={index === messages.length - 1 && message.sender === 'bot'}
                                onStreamComplete={() => markMessageAsStreamed(message.id)}
                            />
                        ))}
                        {isTyping && (
                            <div className={styles.typingMessage}>
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
            <div className={styles.bottom}>
                <div className={styles.input} onClick={focusInput}>
                    <input
                        type="text"
                        placeholder="How can I help?"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        ref={inputRef}
                    />
                    <div
                        onClick={handleSend}
                        style={{ cursor: inputValue.trim() ? 'pointer' : 'default', opacity: inputValue.trim() ? 1 : 0.5 }}
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
        </div>
    );
};

export default ChatWindow;
