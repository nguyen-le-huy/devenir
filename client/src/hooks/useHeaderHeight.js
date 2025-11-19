import { useState, useEffect } from 'react';

export const useHeaderHeight = () => {
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        const updateHeaderHeight = () => {
            const header = document.querySelector('[class*="header"]');
            if (header) {
                const rect = header.getBoundingClientRect();
                setHeaderHeight(rect.bottom);
            }
        };

        updateHeaderHeight();

        window.addEventListener('scroll', updateHeaderHeight);
        window.addEventListener('resize', updateHeaderHeight);

        return () => {
            window.removeEventListener('scroll', updateHeaderHeight);
            window.removeEventListener('resize', updateHeaderHeight);
        };
    }, []);

    return headerHeight;
};