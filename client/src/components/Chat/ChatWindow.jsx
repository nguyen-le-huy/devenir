import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './ChatWindow.module.css';
import Devi from './Devi';
import ChatMessage from './ChatMessage';
import { useAuth } from '../../contexts/AuthContext';
import { sendChatMessage } from '../../services/chatService';
import { useAddToCart } from '../../hooks/useCart';
import gsap from 'gsap';
import SplitText from 'gsap/src/SplitText';

gsap.registerPlugin(SplitText);

const CHAT_STORAGE_KEY = 'devenir_chat_session';

const ChatWindow = ({ onClose }) => {
    const chatWindowRef = useRef(null);
    const contentRef = useRef(null);
    const promptsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const { user, isAuthenticated } = useAuth();

    // Load messages from sessionStorage on mount
    const [messages, setMessages] = useState(() => {
        try {
            const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    // Show initial view only if no messages
    const [showInitialView, setShowInitialView] = useState(() => {
        try {
            const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
            const msgs = saved ? JSON.parse(saved) : [];
            return msgs.length === 0;
        } catch {
            return true;
        }
    });

    // Save messages to sessionStorage when changed
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    // Auto focus input when chat window opens
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chatWindowRef.current && !chatWindowRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Prevent main page scroll when mouse is over chat window
    useEffect(() => {
        const chatWindow = chatWindowRef.current;
        if (!chatWindow) return;

        const handleWheel = (e) => {
            // Always stop propagation to prevent main page scroll
            e.stopPropagation();

            // Find scrollable areas
            const topArea = chatWindow.querySelector('[data-chat-scroll]');
            const messagesArea = chatWindow.querySelector('[data-scrollable]');

            // Check if scrolling within any scrollable area
            const isInScrollable = (topArea && topArea.contains(e.target)) ||
                (messagesArea && messagesArea.contains(e.target));

            if (isInScrollable) {
                // Let the scroll happen naturally within the chat
                return;
            }

            // If not in scrollable area, prevent scroll
            e.preventDefault();
        };

        chatWindow.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            chatWindow.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Text animation - optimized to prevent flash
    useEffect(() => {
        if (!contentRef.current || !promptsRef.current) return;

        let splits = [];
        let tl = null;

        const contentTexts = contentRef.current.querySelectorAll('.splitChat');
        const promptsItem = promptsRef.current.querySelectorAll('.promptItem');

        // ✅ Immediately hide content to prevent flash (before fonts load)
        gsap.set(contentTexts, { visibility: 'hidden', opacity: 0 });
        gsap.set(promptsItem, { visibility: 'hidden', opacity: 0, y: 20 });

        document.fonts.ready.then(() => {
            // Process SplitText first
            contentTexts.forEach((text) => {
                const split = new SplitText(text, {
                    type: "words,lines",
                    linesClass: "line"
                });

                splits.push(split);

                // Wrap lines for overflow hidden
                split.lines.forEach(line => {
                    const wrapper = document.createElement('div');
                    wrapper.style.overflow = 'hidden';
                    line.parentNode.insertBefore(wrapper, line);
                    wrapper.appendChild(line);
                });

                // Set initial state for lines (hidden below)
                gsap.set(split.lines, { yPercent: 100, opacity: 0 });
            });

            // ✅ Now make containers visible (lines are still hidden)
            gsap.set(contentTexts, { visibility: 'visible', opacity: 1 });
            gsap.set(promptsItem, { visibility: 'visible' });

            // Create animation timeline
            tl = gsap.timeline();

            // Animate content texts
            splits.forEach((split, index) => {
                tl.to(split.lines, {
                    duration: 0.8,
                    yPercent: 0,
                    opacity: 1,
                    stagger: 0.08,
                    ease: "power2.out",
                }, index * 0.15);
            });

            // Animate prompts after text
            promptsItem.forEach((item) => {
                tl.to(item, {
                    duration: 0.6,
                    y: 0,
                    opacity: 1,
                    ease: "power2.out",
                }, "-=0.4");
            });
        });

        // Cleanup
        return () => {
            if (tl) tl.kill();
            splits.forEach(split => {
                try {
                    split.revert();
                } catch (e) {
                    // Ignore revert errors
                }
            });
        };
    }, []);

    // Scroll handling
    useEffect(() => {
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];

        if (lastMessage.sender === 'user') {
            // User message: scroll to bottom
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Bot message: scroll to the message element (start)
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

    // Send message to RAG API
    const handleSendMessage = useCallback(async (directText = null) => {
        const messageText = directText || inputValue;
        if (!messageText.trim()) return;

        // Hide initial view
        setShowInitialView(false);

        // Add user message
        const userMessage = {
            id: Date.now(),
            text: messageText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Show typing indicator
        setIsTyping(true);

        try {
            // Call RAG API - include current user message in history
            const response = await sendChatMessage(
                messageText,
                [...messages, userMessage],
                isAuthenticated
            );

            // Create bot message from response
            const botMessage = {
                id: Date.now() + 1,
                text: response.answer || "Xin lỗi, tôi không thể trả lời lúc này.",
                sender: 'bot',
                timestamp: new Date(),
                suggestedProducts: response.suggested_products || [],
                suggestedAction: response.suggested_action || null
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error('Chat Error:', err);

            // Show error message
            const errorMessage = {
                id: Date.now() + 1,
                text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    }, [inputValue, messages, isAuthenticated]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handlePromptClick = (promptText) => {
        handleSendMessage(promptText);
    };

    // Add to cart hook
    const addToCartMutation = useAddToCart();

    // Handle action button clicks (Yes/No for add to cart)
    const handleActionClick = useCallback((messageId, action, actionData) => {
        if (action === 'yes' && actionData?.variant_id) {
            // Add to cart
            addToCartMutation.mutate(
                { variantId: actionData.variant_id, quantity: 1 },
                {
                    onSuccess: () => {
                        // Mark action as handled and add confirmation message
                        setMessages(prev => prev.map(msg =>
                            msg.id === messageId
                                ? { ...msg, actionHandled: true, actionResult: 'added' }
                                : msg
                        ));
                        // Add confirmation bot message
                        const confirmMsg = {
                            id: Date.now(),
                            text: `Đã thêm **${actionData.product?.name || 'sản phẩm'}** vào giỏ hàng!`,
                            sender: 'bot',
                            timestamp: new Date()
                        };
                        setMessages(prev => [...prev, confirmMsg]);
                    },
                    onError: (error) => {
                        console.error('Add to cart error:', error);
                        setMessages(prev => prev.map(msg =>
                            msg.id === messageId
                                ? { ...msg, actionHandled: true, actionResult: 'error' }
                                : msg
                        ));
                    }
                }
            );
        } else if (action === 'no') {
            // Dismiss action
            setMessages(prev => prev.map(msg =>
                msg.id === messageId
                    ? { ...msg, actionHandled: true, actionResult: 'dismissed' }
                    : msg
            ));
            // Add follow-up message
            const followUpMsg = {
                id: Date.now(),
                text: 'Không sao! Bạn cần tôi hỗ trợ gì thêm không?',
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, followUpMsg]);
        }
    }, [addToCartMutation]);

    const focusInput = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div className={styles.chatWindow} ref={chatWindowRef} data-lenis-prevent>
            <div className={styles.top} data-scrollable data-chat-scroll>
                <div className={styles.header}>
                    <div className={styles.model}>
                        <p>Devi Pro 3.1</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8" fill="none">
                            <path d="M1.04297 1.04175L6.04297 6.04175L11.043 1.04175" stroke="#686868" stroke-width="2.08333" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <div className={styles.button}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                            <path d="M1 1H1.9375V1.9375H1V1ZM8.03125 1H8.96875V1.9375H8.03125V1ZM15.0625 1H16V1.9375H15.0625V1ZM15.0625 8.03125H16V8.96875H15.0625V8.03125ZM15.0625 15.0625H16V16H15.0625V15.0625ZM8.03125 8.03125H8.96875V8.96875H8.03125V8.03125ZM8.03125 15.0625H8.96875V16H8.03125V15.0625ZM1 8.03125H1.9375V8.96875H1V8.03125ZM1 15.0625H1.9375V16H1V15.0625Z" stroke="#686868" stroke-width="2" stroke-linecap="square" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none" onClick={onClose} style={{ cursor: 'pointer' }} className={styles.close}>
                            <path d="M0.841788 15L0 14.1582L6.65821 7.5L0 0.841788L0.841788 0L7.5 6.65821L14.1582 0L15 0.841788L8.34179 7.5L15 14.1582L14.1582 15L7.5 8.34179L0.841788 15Z" fill="#686868" />
                        </svg>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 22" fill="none">
                                        <path d="M3.08333 16.1346H9.30556M3.08333 12.2885H12.4167M3.08333 8.44231H12.4167M3.86111 2.28846H0.75V20.75H14.75V2.28846H11.6389M3.86111 0.75H11.6389L10.6667 3.82692H4.83333L3.86111 0.75Z" stroke="#5B947D" stroke-width="1.5" stroke-linejoin="round" />
                                    </svg>
                                    <p>Track orders</p>
                                </div>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('Analyze my shopping data')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 20 20" fill="none">
                                        <path d="M2.91667 0C2.14312 0 1.40125 0.307291 0.854272 0.854272C0.307291 1.40125 0 2.14312 0 2.91667V17.0833C0 18.6933 1.30667 20 2.91667 20H17.0833C17.8569 20 18.5987 19.6927 19.1457 19.1457C19.6927 18.5987 20 17.8569 20 17.0833V2.91667C20 2.14312 19.6927 1.40125 19.1457 0.854272C18.5987 0.307291 17.8569 0 17.0833 0H2.91667ZM1.66667 2.91667C1.66667 2.58515 1.79836 2.2672 2.03278 2.03278C2.2672 1.79836 2.58515 1.66667 2.91667 1.66667H17.0833C17.4149 1.66667 17.7328 1.79836 17.9672 2.03278C18.2016 2.2672 18.3333 2.58515 18.3333 2.91667V17.0833C18.3333 17.4149 18.2016 17.7328 17.9672 17.9672C17.7328 18.2016 17.4149 18.3333 17.0833 18.3333H2.91667C2.58515 18.3333 2.2672 18.2016 2.03278 17.9672C1.79836 17.7328 1.66667 17.4149 1.66667 17.0833V2.91667ZM6.66667 7.5C6.66667 7.27899 6.57887 7.06703 6.42259 6.91075C6.26631 6.75446 6.05435 6.66667 5.83333 6.66667C5.61232 6.66667 5.40036 6.75446 5.24408 6.91075C5.0878 7.06703 5 7.27899 5 7.5V14.1667C5 14.3877 5.0878 14.5996 5.24408 14.7559C5.40036 14.9122 5.61232 15 5.83333 15C6.05435 15 6.26631 14.9122 6.42259 14.7559C6.57887 14.5996 6.66667 14.3877 6.66667 14.1667V7.5ZM10 10C10.221 10 10.433 10.0878 10.5893 10.2441C10.7455 10.4004 10.8333 10.6123 10.8333 10.8333V14.1667C10.8333 14.3877 10.7455 14.5996 10.5893 14.7559C10.433 14.9122 10.221 15 10 15C9.77899 15 9.56703 14.9122 9.41074 14.7559C9.25446 14.5996 9.16667 14.3877 9.16667 14.1667V10.8333C9.16667 10.6123 9.25446 10.4004 9.41074 10.2441C9.56703 10.0878 9.77899 10 10 10ZM15 5.83333C15 5.61232 14.9122 5.40036 14.7559 5.24408C14.5996 5.0878 14.3877 5 14.1667 5C13.9457 5 13.7337 5.0878 13.5774 5.24408C13.4211 5.40036 13.3333 5.61232 13.3333 5.83333V14.1667C13.3333 14.3877 13.4211 14.5996 13.5774 14.7559C13.7337 14.9122 13.9457 15 14.1667 15C14.3877 15 14.5996 14.9122 14.7559 14.7559C14.9122 14.5996 15 14.3877 15 14.1667V5.83333Z" fill="#3C638C" />
                                    </svg>
                                    <p>Analyze data</p>
                                </div>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('Show me best sellers')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="15" viewBox="0 0 22 22" fill="none">
                                        <path d="M20.9748 9.52589L14.7403 7.2597L12.4741 1.02521C12.3624 0.724298 12.1613 0.464772 11.8978 0.281502C11.6343 0.0982331 11.321 0 11 0C10.679 0 10.3657 0.0982331 10.1022 0.281502C9.8387 0.464772 9.63759 0.724298 9.52589 1.02521L7.2597 7.2597L1.02521 9.52589C0.724298 9.63759 0.464772 9.8387 0.281502 10.1022C0.0982331 10.3657 0 10.679 0 11C0 11.321 0.0982331 11.6343 0.281502 11.8978C0.464772 12.1613 0.724298 12.3624 1.02521 12.4741L7.2597 14.7413L9.52589 20.9748C9.63759 21.2757 9.8387 21.5352 10.1022 21.7185C10.3657 21.9018 10.679 22 11 22C11.321 22 11.6343 21.9018 11.8978 21.7185C12.1613 21.5352 12.3624 21.2757 12.4741 20.9748L14.7413 14.7403L20.9748 12.4741C21.2757 12.3624 21.5352 12.1613 21.7185 11.8978C21.9018 11.6343 22 11.321 22 11C22 10.679 21.9018 10.3657 21.7185 10.1022C21.5352 9.8387 21.2757 9.63759 20.9748 9.52589ZM13.8578 13.3881C13.75 13.4273 13.652 13.4897 13.5709 13.5709C13.4897 13.652 13.4273 13.75 13.3881 13.8578L11 20.4245L8.61195 13.8578C8.57268 13.75 8.51028 13.652 8.42913 13.5709C8.34798 13.4897 8.25004 13.4273 8.1422 13.3881L1.57555 11L8.1422 8.61195C8.25004 8.57268 8.34798 8.51028 8.42913 8.42913C8.51028 8.34798 8.57268 8.25004 8.61195 8.1422L11 1.57555L13.3881 8.1422C13.4273 8.25004 13.4897 8.34798 13.5709 8.42913C13.652 8.51028 13.75 8.57268 13.8578 8.61195L20.4245 11L13.8578 13.3881Z" fill="#FF9900" />
                                    </svg>
                                    <p>Best sellers</p>
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick("What's your shipping policy?")}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="29" height="15" viewBox="0 0 29 20" fill="none">
                                        <path d="M5.62134 20C4.59724 20 3.72927 19.6397 3.01746 18.919C2.30471 18.1983 1.94834 17.3231 1.94834 16.2936H1.13665C0.814973 16.2936 0.545347 16.184 0.327771 15.9649C0.110195 15.7457 0.000937828 15.4737 0 15.1488V2.2896C0 1.63691 0.217107 1.09238 0.651322 0.655993C1.08554 0.219609 1.62619 0.000944555 2.2733 0H18.6126C19.2381 0 19.7732 0.224332 20.2177 0.672995C20.6622 1.12166 20.885 1.66005 20.8859 2.28818V5.12185H22.996C23.3552 5.12185 23.6956 5.20308 24.0173 5.36554C24.3399 5.52801 24.6053 5.75234 24.8135 6.03854L28.7735 11.4083C28.8495 11.5037 28.9062 11.6086 28.9437 11.7229C28.9812 11.8372 29 11.9614 29 12.0955V15.1488C29 15.4737 28.8917 15.7457 28.675 15.9649C28.4584 16.184 28.1883 16.2936 27.8648 16.2936H26.7281C26.7281 17.3231 26.3699 18.1983 25.6534 18.919C24.9369 19.6397 24.067 19.9995 23.0439 19.9986C22.0207 19.9976 21.1523 19.6378 20.4386 18.919C19.7249 18.2002 19.3685 17.325 19.3694 16.2936H9.30842C9.30842 17.3288 8.95017 18.2053 8.23367 18.9232C7.51716 19.6411 6.64545 20 5.62134 20ZM5.62838 18.5832C6.26141 18.5832 6.79832 18.3612 7.2391 17.9173C7.67988 17.4733 7.90027 16.9321 7.90027 16.2936C7.90027 15.6551 7.67988 15.1143 7.2391 14.6713C6.79832 14.2283 6.26141 14.0063 5.62838 14.0054C4.99534 14.0044 4.45844 14.2264 4.01766 14.6713C3.57688 15.1162 3.35649 15.6569 3.35649 16.2936C3.35649 16.9302 3.57688 17.471 4.01766 17.9158C4.45844 18.3607 4.99534 18.5841 5.62838 18.5832ZM1.40815 14.8767H2.31831C2.51807 14.2514 2.92556 13.714 3.54077 13.2644C4.15599 12.8148 4.85186 12.589 5.62838 12.5871C6.36926 12.5871 7.05669 12.8082 7.69066 13.2502C8.3237 13.6913 8.74009 14.2335 8.93985 14.8767H19.4806V2.2896C19.4806 2.03457 19.399 1.82535 19.2358 1.66194C19.0726 1.49854 18.8649 1.41683 18.6126 1.41683H2.2733C2.05666 1.41683 1.85831 1.50751 1.67824 1.68886C1.49724 1.87116 1.40674 2.07141 1.40674 2.2896L1.40815 14.8767ZM23.0509 18.5832C23.6839 18.5832 24.2208 18.3612 24.6616 17.9173C25.1024 17.4724 25.3228 16.9311 25.3228 16.2936C25.3228 15.656 25.1024 15.1152 24.6616 14.6713C24.2208 14.2274 23.6839 14.0054 23.0509 14.0054C22.4179 14.0054 21.8809 14.2274 21.4402 14.6713C20.9994 15.1152 20.779 15.656 20.779 16.2936C20.779 16.9311 20.9994 17.4719 21.4402 17.9158C21.8809 18.3598 22.4179 18.5832 23.0509 18.5832ZM20.8845 12.0431H27.5131L23.6445 6.89431C23.5545 6.78474 23.4509 6.69831 23.3336 6.63502C23.2164 6.57174 23.0856 6.5401 22.9412 6.5401H20.8859L20.8845 12.0431Z" fill="#0E0E0E" />
                                    </svg>
                                    <p>Shipping info</p>
                                </div>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('What payment methods do you accept?')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="15" viewBox="0 0 22 22" fill="none">
                                        <path d="M11 21C16.523 21 21 16.523 21 11C21 5.477 16.523 1 11 1C5.477 1 1 5.477 1 11C1 16.523 5.477 21 11 21Z" stroke="#FB998E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M14 7.5C13.315 6.815 12.109 6.339 11 6.309M11 6.309C9.68 6.273 8.5 6.87 8.5 8.5C8.5 11.5 14 10 14 13C14 14.711 12.536 15.446 11 15.391M11 6.309V4.5M8 14C8.644 14.86 9.843 15.35 11 15.391M11 15.391V17.5" stroke="#FB998E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                    <p>Payment options</p>
                                </div>
                                <div className={`${styles.prompt} promptItem`} onClick={() => handlePromptClick('Tell me more')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 20 20" fill="none">
                                        <path d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2ZM5.5 8.5C5.89782 8.5 6.27936 8.65804 6.56066 8.93934C6.84196 9.22064 7 9.60218 7 10C7 10.3978 6.84196 10.7794 6.56066 11.0607C6.27936 11.342 5.89782 11.5 5.5 11.5C5.10218 11.5 4.72064 11.342 4.43934 11.0607C4.15804 10.7794 4 10.3978 4 10C4 9.60218 4.15804 9.22064 4.43934 8.93934C4.72064 8.65804 5.10218 8.5 5.5 8.5ZM10 8.5C10.3978 8.5 10.7794 8.65804 11.0607 8.93934C11.342 9.22064 11.5 9.60218 11.5 10C11.5 10.3978 11.342 10.7794 11.0607 11.0607C10.7794 11.342 10.3978 11.5 10 11.5C9.60218 11.5 9.22064 11.342 8.93934 11.0607C8.65804 10.7794 8.5 10.3978 8.5 10C8.5 9.60218 8.65804 9.22064 8.93934 8.93934C9.22064 8.65804 9.60218 8.5 10 8.5ZM14.5 8.5C14.8978 8.5 15.2794 8.65804 15.5607 8.93934C15.842 9.22064 16 9.60218 16 10C16 10.3978 15.842 10.7794 15.5607 11.0607C15.2794 11.342 14.8978 11.5 14.5 11.5C14.1022 11.5 13.7206 11.342 13.4393 11.0607C13.158 10.7794 13 10.3978 13 10C13 9.60218 13.158 9.22064 13.4393 8.93934C13.7206 8.65804 14.1022 8.5 14.5 8.5Z" fill="#0E0E0E" />
                                    </svg>
                                    <p>More</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.messagesArea} data-lenis-prevent data-scrollable>
                        {messages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                onActionClick={handleActionClick}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="15" viewBox="0 0 19 20" fill="none" onClick={() => handleSendMessage()} style={{ cursor: inputValue.trim() ? 'pointer' : 'default', opacity: inputValue.trim() ? 1 : 0.5 }}>
                        <path d="M9.5 1.90476C8.72934 1.90476 7.99024 2.20578 7.44529 2.7416C6.90035 3.27742 6.59421 4.00414 6.59421 4.7619V10.4762C6.59421 11.234 6.90035 11.9607 7.44529 12.4965C7.99024 13.0323 8.72934 13.3333 9.5 13.3333C10.2707 13.3333 11.0098 13.0323 11.5547 12.4965C12.0996 11.9607 12.4058 11.234 12.4058 10.4762V4.7619C12.4058 4.00414 12.0996 3.27742 11.5547 2.7416C11.0098 2.20578 10.2707 1.90476 9.5 1.90476ZM9.5 0C10.136 0 10.7658 0.12317 11.3533 0.362478C11.9409 0.601787 12.4748 0.952546 12.9245 1.39473C13.3742 1.83691 13.731 2.36186 13.9743 2.9396C14.2177 3.51734 14.343 4.13656 14.343 4.7619V10.4762C14.343 11.7391 13.8327 12.9503 12.9245 13.8434C12.0163 14.7364 10.7844 15.2381 9.5 15.2381C8.21556 15.2381 6.98373 14.7364 6.07549 13.8434C5.16726 12.9503 4.65701 11.7391 4.65701 10.4762V4.7619C4.65701 3.49897 5.16726 2.28776 6.07549 1.39473C6.98373 0.501699 8.21556 0 9.5 0ZM0 12.3448L1.90039 11.9705C2.25334 13.6966 3.20318 15.2494 4.58854 16.3649C5.97391 17.4805 7.70934 18.0901 9.5 18.0901C11.2907 18.0901 13.0261 17.4805 14.4115 16.3649C15.7968 15.2494 16.7467 13.6966 17.0996 11.9705L19 12.3438C18.1166 16.7095 14.1996 20 9.5 20C4.80037 20 0.88336 16.7105 0 12.3448Z" fill="#686868" />
                    </svg>
                </div>
                <div className={styles.actions}>
                    <div className={styles.action}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="15" viewBox="0 0 22 22" fill="none">
                            <path d="M11 1V21M6 7.25V14.75M21 8.5V13.5M1 8.5V13.5M16 4.75V17.25" stroke="#686868" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <p>Voice mode</p>
                    </div>
                    <div className={styles.shortcuts}>
                        <div className={styles.action}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 20 20" fill="none">
                                <path d="M14.6566 5.2301C14.4483 5.0218 14.1657 4.90479 13.8711 4.90479C13.5765 4.90479 13.2939 5.0218 13.0855 5.2301L5.22998 13.0868C5.12138 13.1886 5.03435 13.3112 4.97406 13.4474C4.91378 13.5835 4.88147 13.7304 4.87905 13.8792C4.87664 14.0281 4.90416 14.1759 4.95999 14.3139C5.01582 14.452 5.09883 14.5774 5.20407 14.6827C5.3093 14.788 5.43464 14.8711 5.57261 14.927C5.71059 14.9829 5.85841 15.0106 6.00727 15.0082C6.15614 15.0059 6.30302 14.9737 6.4392 14.9135C6.57537 14.8534 6.69806 14.7664 6.79998 14.6579L14.6566 6.80233C14.76 6.69913 14.8419 6.57659 14.8978 6.4417C14.9537 6.30682 14.9825 6.16223 14.9825 6.01621C14.9825 5.8702 14.9537 5.72561 14.8978 5.59073C14.8419 5.45584 14.76 5.3333 14.6566 5.2301Z" fill="#686868" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M0 3.33333C0 2.44928 0.35119 1.60143 0.976311 0.976311C1.60143 0.35119 2.44928 0 3.33333 0H16.6667C17.5507 0 18.3986 0.35119 19.0237 0.976311C19.6488 1.60143 20 2.44928 20 3.33333V16.6667C20 17.5507 19.6488 18.3986 19.0237 19.0237C18.3986 19.6488 17.5507 20 16.6667 20H3.33333C2.44928 20 1.60143 19.6488 0.976311 19.0237C0.35119 18.3986 0 17.5507 0 16.6667V3.33333ZM3.33333 2.22222H16.6667C16.9614 2.22222 17.244 2.33929 17.4523 2.54766C17.6607 2.75603 17.7778 3.03865 17.7778 3.33333V16.6667C17.7778 16.9614 17.6607 17.244 17.4523 17.4523C17.244 17.6607 16.9614 17.7778 16.6667 17.7778H3.33333C3.03865 17.7778 2.75603 17.6607 2.54766 17.4523C2.33929 17.244 2.22222 16.9614 2.22222 16.6667V3.33333C2.22222 3.03865 2.33929 2.75603 2.54766 2.54766C2.75603 2.33929 3.03865 2.22222 3.33333 2.22222Z" fill="#686868" />
                            </svg>
                            <p>Shortcuts</p>
                        </div>
                        <div className={styles.action}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 20 20" fill="none">
                                <path d="M9.76986 1.74359C10.8804 0.640374 12.379 0.0146923 13.9454 0.000255465C15.5117 -0.0141813 17.0216 0.583772 18.1524 1.66633C19.2832 2.74889 19.9451 4.23019 19.9967 5.79367C20.0484 7.35715 19.4856 8.87879 18.4288 10.0334L18.2398 10.2301L9.4409 19.0152L9.4049 19.0452C8.71984 19.6612 7.8303 20.0014 6.90849 20C5.98668 19.9986 5.09817 19.6557 4.41498 19.0377C3.73178 18.4197 3.3025 17.5705 3.21025 16.6545C3.11799 15.7386 3.36932 14.821 3.91558 14.0795C3.94049 14.0341 3.96891 13.9907 4.00057 13.9497L4.05456 13.8898L4.14155 13.8019L4.28253 13.6541L4.28553 13.6571L11.7206 6.21403C11.8475 6.08705 12.0157 6.00975 12.1948 5.99619C12.3739 5.98263 12.5519 6.03371 12.6965 6.14014L12.7805 6.21303C12.9076 6.33971 12.985 6.50775 12.9986 6.6866C13.0122 6.86545 12.961 7.04323 12.8545 7.1876L12.7825 7.27148L5.18842 14.8733C4.83695 15.304 4.65938 15.8503 4.69058 16.405C4.72178 16.9597 4.95949 17.4827 5.35705 17.8713C5.7546 18.26 6.28328 18.4862 6.83926 18.5055C7.39525 18.5248 7.93839 18.3359 8.36203 17.9758L17.1939 9.15871C18.0123 8.32746 18.4753 7.21125 18.4853 6.04557C18.4953 4.8799 18.0515 3.75592 17.2476 2.91079C16.4436 2.06566 15.3423 1.56547 14.1761 1.51574C13.0099 1.46602 11.8699 1.87065 10.9967 2.64427L10.8287 2.80404L10.8167 2.81801L1.2809 12.34C1.14709 12.474 0.967449 12.5525 0.778089 12.5596C0.588729 12.5667 0.403693 12.5019 0.260186 12.3784C0.116678 12.2548 0.0253402 12.0815 0.00453542 11.8934C-0.0162693 11.7053 0.0350023 11.5163 0.148041 11.3645L0.221032 11.2806L9.76986 1.74359Z" fill="#686868" />
                            </svg>
                            <p>Attach</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;