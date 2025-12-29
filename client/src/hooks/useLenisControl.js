import { useEffect } from 'react';
import { lenisInstance } from '../lib/lenis';

// Reference counter để track số lượng components đang yêu cầu stop scroll
let scrollStopCount = 0;
let preventScrollHandler = null;

// Prevent wheel scroll function - được tạo 1 lần và reuse
const preventScroll = (e) => {
    // Cho phép scroll trong element có data-lenis-prevent và có overflow
    const target = e.target;
    const scrollableParent = target.closest('[data-lenis-prevent]');
    
    if (scrollableParent) {
        const { scrollHeight, clientHeight } = scrollableParent;
        // Chỉ cho phép scroll nếu element thực sự có nội dung overflow
        if (scrollHeight > clientHeight) {
            return; // Cho phép scroll trong container này
        }
    }
    
    e.preventDefault();
};

/**
 * Custom hook để dừng Lenis scroll khi component mount,
 * và khởi động lại khi unmount.
 * Sử dụng reference counting để handle nhiều components cùng lúc.
 * 
 * @param {boolean} active - Trạng thái kích hoạt (mặc định là true). Nếu true, sẽ stop lenis.
 */
export const useLenisControl = (active = true) => {
    useEffect(() => {
        // Chỉ stop khi active = true
        if (!active) return;

        // Tăng counter
        scrollStopCount++;

        // Chỉ stop nếu đây là component đầu tiên yêu cầu stop
        if (scrollStopCount === 1) {
            if (lenisInstance) {
                lenisInstance.stop();
            }
            // Chặn wheel event ở document level
            document.addEventListener('wheel', preventScroll, { passive: false });
            document.addEventListener('touchmove', preventScroll, { passive: false });
        }

        // Cleanup function: chạy khi component unmount
        return () => {
            // Giảm counter
            scrollStopCount--;

            // Chỉ start lại nếu không còn component nào yêu cầu stop
            if (scrollStopCount === 0) {
                if (lenisInstance) {
                    lenisInstance.start();
                }
                document.removeEventListener('wheel', preventScroll);
                document.removeEventListener('touchmove', preventScroll);
            }
        };
    }, [active]);
};