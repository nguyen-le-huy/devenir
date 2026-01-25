import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/useAuthStore';
import styles from './UserMenu.module.css';

/**
 * UserMenu - Dropdown menu khi user đã login
 * Hiển thị thông tin user và logout button
 */
export default function UserMenu() {
    const navigate = useNavigate();
    // Atomic selectors
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated || !user) return null;

    return (
        <div className={styles.userMenu}>
            <button
                className={styles.userButton}
                onClick={() => navigate('/profile')}
                title={`${user.username}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none">
                    <path d="M6.25 25V23.75C6.25 21.4294 7.17187 19.2038 8.81282 17.5628C10.4538 15.9219 12.6794 15 15 15M15 15C17.3206 15 19.5462 15.9219 21.1872 17.5628C22.8281 19.2038 23.75 21.4294 23.75 23.75V25M15 15C16.3261 15 17.5979 14.4732 18.5355 13.5355C19.4732 12.5979 20 11.3261 20 10C20 8.67392 19.4732 7.40215 18.5355 6.46447C17.5979 5.52678 16.3261 5 15 5C13.6739 5 12.4021 5.52678 11.4645 6.46447C10.5268 7.40215 10 8.67392 10 10C10 11.3261 10.5268 12.5979 11.4645 13.5355C12.4021 14.4732 13.6739 15 15 15Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

        </div>
    );
}
