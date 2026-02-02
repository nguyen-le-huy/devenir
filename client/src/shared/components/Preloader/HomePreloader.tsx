import { useLocation } from 'react-router-dom';
import Preloader from './Preloader';

/**
 * Component render Preloader chỉ khi ở trang chủ
 */
const HomePreloader = () => {
    const location = useLocation();

    // Chỉ hiển thị Preloader trên trang chủ
    if (location.pathname !== '/') {
        return null;
    }

    return <Preloader />;
};

export default HomePreloader;
