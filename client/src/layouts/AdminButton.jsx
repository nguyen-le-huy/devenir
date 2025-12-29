import { useAuthStore } from '../stores/useAuthStore';
import styles from './AdminButton.module.css';

export default function AdminButton() {
  // Atomic selectors
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  if (!isAdmin()) return null;

  const handleGoToAdmin = () => {
    // Open admin panel - user must login again for security
    window.open('http://localhost:5173', '_blank');
  };

  return (
    <button className={styles.adminButton} onClick={handleGoToAdmin} title="Switch to Admin Dashboard">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
      </svg>
      Go to Admin
    </button>
  );
}
