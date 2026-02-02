import { formatDate } from '@/features/user/utils';
import type { ProfileOverviewProps } from '@/features/user/types';
import { BannerIcon } from '@/shared/components/icons/BannerIcon';
import styles from './ProfileOverview.module.css';

/**
 * Profile Overview Component
 * Displays user profile summary and welcome message
 * 
 * Features:
 * - Welcome banner with logo
 * - Profile details display
 * - Communication preferences summary
 * - Recommendations placeholder
 */
export default function ProfileOverview({ user, onEditProfile, onEditPreferences }: ProfileOverviewProps) {
    return (
        <div className={styles.overview}>
            {/* Welcome Banner */}
            <div className={styles.welcomeBanner}>
                <div className={styles.bannerIcon}>
                    <BannerIcon />
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
                        <span className={styles.value}>{user?.username}</span>
                    </div>

                    <div className={styles.detailRow}>
                        <span className={styles.label}>Email</span>
                        <span className={styles.value}>{user?.email}</span>
                    </div>

                    <div className={styles.detailRow}>
                        <span className={styles.label}>Phone</span>
                        <span className={styles.value}>{user?.phone || 'Not set'}</span>
                    </div>

                    <div className={styles.detailRow}>
                        <span className={styles.label}>Birthday</span>
                        <span className={styles.value}>
                            {user?.birthday ? formatDate(user.birthday) : 'Not set'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Communication Preferences Summary */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Communication Preferences</h3>
                    <button className={styles.editBtn} onClick={onEditPreferences}>
                        Edit
                    </button>
                </div>

                <div className={styles.preferences}>
                    <p className={styles.prefItem}>
                        <strong>Channels: </strong>
                        {user?.preferences?.channels
                            ? Object.entries(user.preferences.channels)
                                .filter(([_, enabled]) => enabled)
                                .map(([channel]) => channel.charAt(0).toUpperCase() + channel.slice(1)) // Capitalize
                                .join(', ')
                            : 'None set'}
                    </p>
                    <p className={styles.prefItem}>
                        <strong>Interests: </strong>
                        {user?.preferences?.interests ? (user.preferences.interests.charAt(0).toUpperCase() + user.preferences.interests.slice(1)) : 'None set'}
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
