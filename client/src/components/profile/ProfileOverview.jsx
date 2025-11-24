import styles from './ProfileOverview.module.css';

/**
 * Profile Overview Component
 * Displays user profile summary and welcome message
 */
export default function ProfileOverview({ user, onEditProfile }) {
  return (
    <div className={styles.overview}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.bannerIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className={styles.bannerContent}>
          <h2 className={styles.bannerTitle}>Welcome to your Devenir account</h2>
          <p className={styles.bannerSubtitle}>Complete your profile so we can get to know you better</p>
        </div>
      </div>

      {/* Profile Details Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Profile Details</h3>
          <button className={styles.editBtn} onClick={onEditProfile}>
            Edit profile
          </button>
        </div>

        <div className={styles.profileDetails}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Name</span>
            <span className={styles.value}>{user?.username || 'Not set'}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{user?.email || 'Not set'}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.label}>Phone</span>
            <span className={styles.value}>{user?.phone || 'Not set'}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.label}>Birthday</span>
            <span className={styles.value}>{user?.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* Communication Preferences Summary */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Communication Preferences</h3>
          <button className={styles.editBtn} onClick={() => {}}>
            Edit
          </button>
        </div>

        <div className={styles.preferences}>
          <p className={styles.prefItem}>
            <strong>Channel:</strong> {user?.preferences?.channel || 'Email'}
          </p>
          <p className={styles.prefItem}>
            <strong>Interests:</strong> {user?.preferences?.interests || 'Menswear'}
          </p>
        </div>
      </div>

      {/* Recommended Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recommended For You</h3>
        <p className={styles.placeholderText}>Your personalized recommendations will appear here based on your preferences</p>
      </div>
    </div>
  );
}
