import styles from './ProfileOverview.module.css';

interface ProfileOverviewProps {
    user: any;
    onEditProfile: () => void;
}

/**
 * Profile Overview Component
 * Displays user profile summary and welcome message
 */
export default function ProfileOverview({ user, onEditProfile }: ProfileOverviewProps) {
    return (
        <div className={styles.overview}>
            {/* Welcome Banner */}
            <div className={styles.welcomeBanner}>
                <div className={styles.bannerIcon}>
                    <svg width="250" height="250" viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="250" height="250" fill="#5C4439" />
                        <path d="M132.432 54.464C137.637 58.1333 141.691 63.168 144.592 69.568C147.493 75.968 148.944 83.2213 148.944 91.328C148.944 99.4347 147.493 106.816 144.592 113.472C141.691 120.128 137.637 125.333 132.432 129.088C129.104 131.477 125.264 133.227 120.912 134.336C116.645 135.445 111.397 136 105.168 136H71.12V134.976L81.616 133.952V49.728L71.12 48.704V47.68H105.168C116.773 47.68 125.861 49.9413 132.432 54.464ZM127.824 126.912C130.555 123.413 132.688 118.464 134.224 112.064C135.845 105.579 136.656 98.4533 136.656 90.688C136.656 83.0933 135.888 76.3947 134.352 70.592C132.901 64.7893 130.725 60.1813 127.824 56.768C125.435 53.952 122.491 51.9893 118.992 50.88C115.493 49.7707 110.501 49.216 104.016 49.216H91.472V134.464H104.016C110.843 134.464 115.963 133.909 119.376 132.8C122.789 131.691 125.605 129.728 127.824 126.912Z" fill="white" />
                        <path d="M171.192 119.112C170.595 118.685 169.613 118.429 168.248 118.344L160.44 117.704V116.68H187.704V117.704L180.536 118.344C178.403 118.515 176.867 118.941 175.928 119.624C175.075 120.221 174.307 121.501 173.624 123.464L142.264 207.048H139.96L107.576 118.728L97.08 117.704V116.68H129.08V117.704L117.944 118.728L145.08 192.84H145.592L171.576 123.464C171.917 122.611 172.088 121.8 172.088 121.032C172.088 120.179 171.789 119.539 171.192 119.112Z" fill="white" />
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
                    <button className={styles.editBtn} onClick={() => { }}>
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
