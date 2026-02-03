import { useState, useEffect, memo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore, type AuthState } from '@/core/stores/useAuthStore';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import ProfileOverview from '@/features/user/components/profile/ProfileOverview';
import PersonalDetails from '@/features/user/components/profile/PersonalDetails';
import MarketingPreferences from '@/features/user/components/profile/MarketingPreferences';
import ProfileOrders from '@/features/user/components/profile/ProfileOrders';
import PageWrapper from '@/shared/components/PageWrapper/PageWrapper';
import { AdminIcon } from '@/shared/components/icons/AdminIcon';
import { LogoutIcon } from '@/shared/components/icons/LogoutIcon';
import styles from './UserProfile.module.css';

/**
 * User Profile Page
 * 
 * Layout:
 * - Desktop: Sidebar navigation (left) + Content (right)
 * - Mobile: Horizontal tabs navigation + Content
 * 
 * Features:
 * - Tab-based navigation with URL sync
 * - Responsive design (mobile/desktop)
 * - Protected route (redirects to /auth if not logged in)
 * - Role-based admin dashboard access
 */
const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal', label: 'Personal Details' },
    { id: 'orders', label: 'Orders' },
    { id: 'preferences', label: 'Marketing Preferences' },
];

const UserProfile = memo(() => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Atomic selectors - only subscribe to needed state
    const user = useAuthStore((state: AuthState) => state.user);
    const logout = useAuthStore((state: AuthState) => state.logout);

    const initialTab = searchParams.get('tab') || 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Protected route - redirect if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/auth', { replace: true });
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const handleGoToAdmin = () => {
        // Open admin panel - user must login again for security
        // Use environment variable in real app
        window.open('https://admin.devenir.shop/admin', '_blank');
    };

    const handleTabChange = (id: string) => {
        setActiveTab(id);
        setSearchParams({ tab: id });
    };

    const renderContent = () => {
        if (!user) return null;

        switch (activeTab) {
            case 'overview':
                return (
                    <ProfileOverview
                        user={user}
                        onEditProfile={() => handleTabChange('personal')}
                        onEditPreferences={() => handleTabChange('preferences')}
                    />
                );
            case 'personal':
                return <PersonalDetails user={user} />;
            case 'orders':
                return <ProfileOrders />;
            case 'preferences':
                return <MarketingPreferences user={user} />;
            default:
                return null;
        }
    };

    // Early return if not authenticated
    if (!user) {
        return null; // or loading spinner
    }

    return (
        <PageWrapper>
            <div className={styles.profileContainer}>
                <div className={styles.profileContent}>
                    {/* SIDEBAR / MOBILE TABS NAVIGATION */}
                    {isMobile ? (
                        // Mobile: Horizontal Tabs
                        <div className={styles.mobileTabsNav}>
                            <div className={styles.tabsWrapper}>
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        className={`${styles.tab} ${activeTab === item.id ? styles.tabActive : ''}`}
                                        onClick={() => handleTabChange(item.id)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Desktop: Sidebar
                        <aside className={styles.sidebar}>
                            <nav className={styles.sidebarNav}>
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        className={`${styles.navLink} ${activeTab === item.id ? styles.navLinkActive : ''}`}
                                        onClick={() => handleTabChange(item.id)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </nav>

                            {/* Sidebar Footer */}
                            <div className={styles.sidebarFooter}>
                                <div className={styles.helpSection}>
                                    <h3 className={styles.helpTitle}>Can we help?</h3>
                                    <p className={styles.helpText}>
                                        Our Customer Support team is available to assist you.
                                    </p>
                                    <div className={styles.helpLinks}>
                                        <a href="#" className={styles.helpLink}>Call us</a>
                                        <a href="#" className={styles.helpLink}>Email us</a>
                                    </div>
                                </div>

                                {user.role === 'admin' && (
                                    <button
                                        className={styles.adminBtn}
                                        onClick={handleGoToAdmin}
                                    >
                                        <AdminIcon />
                                        Admin Dashboard
                                    </button>
                                )}

                                <button
                                    className={styles.logoutBtn}
                                    onClick={handleLogout}
                                >
                                    <LogoutIcon />
                                    Sign out
                                </button>
                            </div>
                        </aside>
                    )}

                    {/* MAIN CONTENT AREA */}
                    <main className={styles.mainContent}>
                        {/* Greeting */}
                        <div className={styles.greeting}>
                            <h1>Hi, {user.username || user.email?.split('@')[0]}</h1>
                        </div>

                        {/* Content Section */}
                        <div className={styles.contentSection}>
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </PageWrapper>
    );
});

UserProfile.displayName = 'UserProfile';

export default UserProfile;
