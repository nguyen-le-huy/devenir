import { useEffect } from 'react';
import { lenisInstance } from '../App';

// Reference counter để track số lượng components đang yêu cầu stop scroll
let scrollStopCount = 0;

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
            document.body.style.overflow = 'hidden';
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
                document.body.style.overflow = '';
            }
        };
    }, []); // Empty dependency array - chỉ chạy khi mount/unmount
};