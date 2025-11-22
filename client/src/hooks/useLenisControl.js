import { useEffect } from 'react';
import { lenisInstance } from '../App'; // Đảm bảo đường dẫn import đúng tới App.jsx

/**
 * Custom hook để dừng Lenis scroll khi component mount hoặc khi điều kiện active là true,
 * và khởi động lại khi unmount hoặc active là false.
 * 
 * @param {boolean} active - Trạng thái kích hoạt (mặc định là true). Nếu true, sẽ stop lenis.
 */
export const useLenisControl = (active = true) => {
    useEffect(() => {
        if (active) {
            // Dừng Lenis khi active
            if (lenisInstance) {
                lenisInstance.stop();
            }
        } else {
            // Khởi động lại nếu active chuyển sang false (tuỳ chọn, thường cleanup sẽ lo việc này)
            if (lenisInstance) {
                lenisInstance.start();
            }
        }

        // Cleanup function: chạy khi component unmount hoặc active thay đổi
        return () => {
            if (active && lenisInstance) {
                lenisInstance.start();
            }
        };
    }, [active]);
};