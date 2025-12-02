import styles from './TryOn.module.css';
import { useState, useEffect, useRef } from 'react';

const TryOn = () => {
    const [isSticky, setIsSticky] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;

            const container = containerRef.current.closest('[data-tryon-container]');
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const containerBottom = containerRect.bottom;
            const viewportHeight = window.innerHeight;

            // If container bottom is above viewport bottom + offset, make it absolute (stick to container)
            // Otherwise, keep it fixed (stick to viewport)
            if (containerBottom <= viewportHeight - 40) {
                setIsSticky(false);
            } else {
                setIsSticky(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial state

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`${styles.tryOn} ${isSticky ? styles.fixed : styles.absolute}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4.08333 0.75H0.75V4.08333M17.4167 0.75H20.75V4.08333M4.08333 20.75H0.75V17.4167M5.19444 17.4167V16.3056C5.19444 14.8321 5.77976 13.4191 6.82163 12.3772C7.8635 11.3353 9.27657 10.75 10.75 10.75M10.75 10.75C12.2234 10.75 13.6365 11.3353 14.6784 12.3772C15.7202 13.4191 16.3056 14.8321 16.3056 16.3056V17.4167M10.75 10.75C11.6341 10.75 12.4819 10.3988 13.107 9.77369C13.7321 9.14857 14.0833 8.30072 14.0833 7.41667C14.0833 6.53261 13.7321 5.68476 13.107 5.05964C12.4819 4.43452 11.6341 4.08333 10.75 4.08333C9.86594 4.08333 9.0181 4.43452 8.39298 5.05964C7.76786 5.68476 7.41667 6.53261 7.41667 7.41667C7.41667 8.30072 7.76786 9.14857 8.39298 9.77369C9.0181 10.3988 9.86594 10.75 10.75 10.75ZM17.4167 20.75H20.75V17.4167" stroke="#0E0E0E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p className={styles.text}>Try it on</p>
        </div>
    );
};

export default TryOn;