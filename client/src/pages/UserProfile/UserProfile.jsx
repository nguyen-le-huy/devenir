import { useState, useEffect, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import ProfileOverview from '../../components/profile/ProfileOverview';
import PersonalDetails from '../../components/profile/PersonalDetails';
import MarketingPreferences from '../../components/profile/MarketingPreferences';
import ProfileOrders from '../../components/profile/ProfileOrders';
import PageWrapper from '../../components/PageWrapper/PageWrapper';
import styles from './UserProfile.module.css';

/**
 * User Profile Page
 * Desktop: Sidebar navigation left + Content right
 * Mobile: Horizontal tabs navigation + Content
 */
const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'personal', label: 'Personal Details' },
  { id: 'orders', label: 'Orders' },
  { id: 'preferences', label: 'Marketing Preferences' },
];

const UserProfile = memo(() => {
  // Atomic selectors
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Handle window resize for responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleGoToAdmin = () => {
    // Open admin panel - user must login again for security
    window.open('http://localhost:5173', '_blank');
  };



  const handleTabChange = (id) => {
    setActiveTab(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', id);
      return next;
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ProfileOverview
            user={user}
            onEditProfile={() => setActiveTab('personal')}
          />
        );
      case 'personal':
        return (
          <PersonalDetails
            user={user}
            loading={loading}
            error={error}
            successMessage={successMessage}
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            setLoading={setLoading}
          />
        );
      case 'orders':
        return <ProfileOrders />;
      case 'preferences':
        return (
          <MarketingPreferences
            user={user}
            loading={loading}
            error={error}
            successMessage={successMessage}
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            setLoading={setLoading}
          />
        );
      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <PageWrapper trackImages={false}>
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

              {user?.role === 'admin' && (
                <button
                  className={styles.adminBtn}
                  onClick={handleGoToAdmin}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 21H3V8H1V3H5V1H8V3H16V1H19V3H23V8H21V21H11V23H13V21ZM19 5H5V7H19V5ZM3 9H21V21H3V9Z" fill="currentColor" />
                  </svg>
                  Admin Dashboard
                </button>
              )}

              <button
                className={styles.logoutBtn}
                onClick={handleLogout}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sign out
              </button>
            </div>
          </aside>
        )}

        {/* MAIN CONTENT AREA */}
        <main className={styles.mainContent}>
          {/* Greeting */}
          <div className={styles.greeting}>
            <h1>Hi, {user?.username || user?.email?.split('@')[0]}</h1>
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
}
);

UserProfile.displayName = 'UserProfile';

export default UserProfile;
