import styles from "./Header.module.css";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import UserMenu from "../../UserMenu/UserMenu";
import Search from "../../Search/Search";
import Bag from "../../Bag/Bag";

const Header = () => {
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isBagOpen, setIsBagOpen] = useState(false);
    const bagTimeoutRef = useRef(null);
    const [bagCount, setBagCount] = useState(2);

    const handleBagMouseEnter = () => {
        if (bagTimeoutRef.current) {
            clearTimeout(bagTimeoutRef.current);
        }
        setIsBagOpen(true);
    }

    const handleBagMouseLeave = () => {
        bagTimeoutRef.current = setTimeout(() => {
            setIsBagOpen(false);
        }, 200);
    }

    const handleOpenMenu = () => {
        setIsMenuOpen(true);
    }

    const handleCloseMenu = () => {
        setIsMenuOpen(false);
    }

    const handleOpenAuth = () => {
        navigate('/auth');
    }

    const handleLogoClick = () => {
        navigate('/');
    }

    const handleLogout = async () => {
        await logout();
        setIsMenuOpen(false);
        navigate('/');
    }

    const toggleSearch = () => {
        setIsSearchOpen((prev) => !prev);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
    };

    return (
        <>
            <div className={`${styles.topBar} container`}>
                <div className={styles.left}></div>
                <div className={styles.center}>Fast, Free Delivery With Prime | <span className={styles.campaignLink}>
                    <span>Explore The Campaign</span>
                    <svg className={styles.linkGraphicSlide} width="300%" height="100%" viewBox="0 0 1200 60" preserveAspectRatio="none">
                        <path d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"></path>
                    </svg>
                </span>
                </div>
                <div className={styles.right}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3.6 9H20.4M3.6 15H20.4M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 9.61305 20.0518 7.32387 18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M11.4999 3C9.81525 5.69961 8.92212 8.81787 8.92212 12C8.92212 15.1821 9.81525 18.3004 11.4999 21M12.4999 3C14.1846 5.69961 15.0777 8.81787 15.0777 12C15.0777 15.1821 14.1846 18.3004 12.4999 21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span>US English</span>
                </div>
            </div>
            <div className={`${styles.header} container`}>
                <div className={styles.menu}>
                    <svg viewBox="0 0 170 29" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logo}
                        onClick={handleLogoClick}
                        style={{ cursor: 'pointer' }}
                    >
                        <path d="M19.1599 2.12001C20.7866 3.26667 22.0532 4.84 22.9599 6.84C23.8666 8.84 24.3199 11.1067 24.3199 13.64C24.3199 16.1733 23.8666 18.48 22.9599 20.56C22.0532 22.64 20.7866 24.2667 19.1599 25.44C18.1199 26.1867 16.9199 26.7333 15.5599 27.08C14.2266 27.4267 12.5866 27.6 10.6399 27.6H-9.7543e-05V27.28L3.2799 26.96V0.640005L-9.7543e-05 0.320004V3.8147e-06H10.6399C14.2666 3.8147e-06 17.1066 0.706671 19.1599 2.12001ZM17.7199 24.76C18.5732 23.6667 19.2399 22.12 19.7199 20.12C20.2266 18.0933 20.4799 15.8667 20.4799 13.44C20.4799 11.0667 20.2399 8.97334 19.7599 7.16C19.3066 5.34667 18.6266 3.90667 17.7199 2.84001C16.9732 1.96001 16.0532 1.34667 14.9599 1.00001C13.8666 0.653338 12.3066 0.480005 10.2799 0.480005H6.3599V27.12H10.2799C12.4132 27.12 14.0132 26.9467 15.0799 26.6C16.1466 26.2533 17.0266 25.64 17.7199 24.76ZM48.4905 19.2L47.4905 27.6H27.8905V27.28L31.1705 26.96V0.640005L27.8905 0.320004V3.8147e-06H47.5305L48.0905 7.52L47.6905 7.56L45.4505 1.96C45.2105 1.34667 44.9439 0.946672 44.6505 0.760006C44.3839 0.573339 43.9305 0.480005 43.2905 0.480005H34.2505V12.76H40.1705C40.8105 12.76 41.2639 12.6533 41.5305 12.44C41.7972 12.2267 41.9839 11.8133 42.0905 11.2L42.7705 7.96001H43.2505V18.2H42.7705L42.0905 14.96C41.9839 14.3467 41.7972 13.9333 41.5305 13.72C41.2639 13.5067 40.8105 13.4 40.1705 13.4H34.2505V27.12H43.2105C43.8505 27.12 44.3172 27.0267 44.6105 26.84C44.9039 26.6267 45.1705 26.2267 45.4105 25.64L48.0505 19.16L48.4905 19.2ZM73.2255 0.760006C73.0389 0.626671 72.7322 0.546671 72.3055 0.520004L69.8655 0.320004V3.8147e-06H78.3855V0.320004L76.1455 0.520004C75.4789 0.573339 74.9989 0.706672 74.7055 0.920004C74.4389 1.10667 74.1989 1.50667 73.9855 2.12001L64.1855 28.24H63.4655L53.3455 0.640005L50.0655 0.320004V3.8147e-06H60.0655V0.320004L56.5855 0.640005L65.0655 23.8H65.2255L73.3455 2.12001C73.4522 1.85334 73.5055 1.60001 73.5055 1.36001C73.5055 1.09334 73.4122 0.893339 73.2255 0.760006ZM99.1937 19.2L98.1937 27.6H78.5937V27.28L81.8737 26.96V0.640005L78.5937 0.320004V3.8147e-06H98.2337L98.7937 7.52L98.3937 7.56L96.1537 1.96C95.9137 1.34667 95.647 0.946672 95.3537 0.760006C95.087 0.573339 94.6337 0.480005 93.9937 0.480005H84.9537V12.76H90.8737C91.5137 12.76 91.967 12.6533 92.2337 12.44C92.5003 12.2267 92.687 11.8133 92.7937 11.2L93.4737 7.96001H93.9537V18.2H93.4737L92.7937 14.96C92.687 14.3467 92.5003 13.9333 92.2337 13.72C91.967 13.5067 91.5137 13.4 90.8737 13.4H84.9537V27.12H93.9137C94.5537 27.12 95.0203 27.0267 95.3137 26.84C95.607 26.6267 95.8737 26.2267 96.1137 25.64L98.7537 19.16L99.1937 19.2ZM130.284 3.8147e-06V0.320004L127.404 0.640005C126.764 0.720006 126.337 0.880005 126.124 1.12C125.911 1.36 125.804 1.8 125.804 2.44001V28.24H125.404L107.444 2.76H107.284V25.16C107.284 25.8 107.364 26.2533 107.524 26.52C107.684 26.76 108.004 26.9067 108.484 26.96L111.324 27.28V27.6H102.564V27.28L105.444 26.96C105.924 26.9067 106.244 26.76 106.404 26.52C106.564 26.2533 106.644 25.8 106.644 25.16V1.88001L106.484 1.64C106.111 1.10667 105.751 0.760005 105.404 0.600006C105.084 0.413338 104.604 0.320004 103.964 0.320004H103.284V3.8147e-06H109.244L125.004 22.08H125.164V2.44001C125.164 1.8 125.084 1.34667 124.924 1.08C124.764 0.813338 124.444 0.666671 123.964 0.640005L120.724 0.320004V3.8147e-06H130.284ZM132.539 3.8147e-06H142.179V0.320004L138.899 0.640005V26.96L142.179 27.28V27.6H132.539V27.28L135.819 26.96V0.640005L132.539 0.320004V3.8147e-06ZM169.671 27.28V27.6H165.551C164.911 27.6 164.431 27.5067 164.111 27.32C163.791 27.1333 163.457 26.7733 163.111 26.24L156.991 16.36C156.617 15.7467 156.297 15.3733 156.031 15.24C155.791 15.08 155.351 15 154.711 15H151.751V26.96L155.231 27.28V27.6H145.391V27.28L148.671 26.96V0.640005L145.391 0.320004V3.8147e-06H155.511C158.657 3.8147e-06 161.057 0.640004 162.711 1.92001C164.364 3.17334 165.191 5.00001 165.191 7.40001C165.191 9.26667 164.684 10.8 163.671 12C162.657 13.2 161.191 14.0267 159.271 14.48H159.311L166.631 25.92C166.977 26.4533 167.311 26.8133 167.631 27C167.977 27.1867 168.471 27.28 169.111 27.28H169.671ZM151.751 0.480005V14.4H155.391C157.524 14.4 159.097 13.84 160.111 12.72C161.151 11.5733 161.671 9.82667 161.671 7.48001C161.671 5.10667 161.151 3.34667 160.111 2.2C159.071 1.05334 157.497 0.480005 155.391 0.480005H151.751Z" fill="#0E0E0E" />
                    </svg>
                    <ul className={styles.links}>
                        <li className={styles.link}>Jackets</li>
                        <li className={styles.link}>Pants</li>
                        <li className={styles.link}>Sweaters</li>
                        <li className={styles.link}>Shirts</li>
                        <li className={styles.link}><a href="/scarves">Scarves</a></li>
                        <li className={styles.link}>Gallery</li>
                        <li className={styles.link}>Contact</li>
                    </ul>
                </div>
                <div className={styles.actions}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 30 30"
                        fill="none"
                        className={styles.searchIcon}
                        onClick={toggleSearch}
                        style={{ cursor: 'pointer' }}
                    >
                        <path d="M19.4412 19.4412C20.2607 18.6217 20.9108 17.6488 21.3543 16.578C21.7979 15.5073 22.0262 14.3596 22.0262 13.2006C22.0262 12.0416 21.7979 10.894 21.3543 9.82322C20.9108 8.75245 20.2607 7.77953 19.4412 6.96C18.6217 6.14047 17.6487 5.49038 16.578 5.04685C15.5072 4.60333 14.3596 4.37505 13.2006 4.37505C12.0416 4.37505 10.8939 4.60333 9.82317 5.04685C8.75241 5.49038 7.77948 6.14047 6.95995 6.96C5.30483 8.61511 4.375 10.8599 4.375 13.2006C4.375 15.5413 5.30483 17.7861 6.95995 19.4412C8.61507 21.0964 10.8599 22.0262 13.2006 22.0262C15.5413 22.0262 17.7861 21.0964 19.4412 19.4412ZM19.4412 19.4412L25 25" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>

                    {/* User Icon or Menu based on auth state */}
                    {isAuthenticated ? (
                        <div className={styles.userMenuWrapper}>
                            <UserMenu />
                        </div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none" className={styles.userIcon} onClick={handleOpenAuth} style={{ cursor: 'pointer' }}>
                            <path d="M6.25 25V23.75C6.25 21.4294 7.17187 19.2038 8.81282 17.5628C10.4538 15.9219 12.6794 15 15 15M15 15C17.3206 15 19.5462 15.9219 21.1872 17.5628C22.8281 19.2038 23.75 21.4294 23.75 23.75V25M15 15C16.3261 15 17.5979 14.4732 18.5355 13.5355C19.4732 12.5979 20 11.3261 20 10C20 8.67392 19.4732 7.40215 18.5355 6.46447C17.5979 5.52678 16.3261 5 15 5C13.6739 5 12.4021 5.52678 11.4645 6.46447C10.5268 7.40215 10 8.67392 10 10C10 11.3261 10.5268 12.5979 11.4645 13.5355C12.4021 14.4732 13.6739 15 15 15Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    )}
                    <div className={styles.bagWrapper} onMouseEnter={handleBagMouseEnter} onMouseLeave={handleBagMouseLeave}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none" className={styles.bagIcon}>
                            <path d="M10 15V10C10 8.67392 10.5268 7.40215 11.4645 6.46447C12.4021 5.52678 13.6739 5 15 5C16.3261 5 17.5979 5.52678 18.5355 6.46447C19.4732 7.40215 20 8.67392 20 10V15" stroke="black" stroke-linecap="round" stroke-width="1.5" />
                            <path d="M4.61752 15.835C4.79877 13.6588 4.89002 12.5712 5.60752 11.91C6.32502 11.2487 7.41752 11.25 9.60127 11.25H20.4C22.5825 11.25 23.675 11.25 24.3925 11.91C25.11 12.57 25.2013 13.6588 25.3825 15.835L26.025 23.5425C26.13 24.8087 26.1825 25.4425 25.8125 25.8463C25.44 26.25 24.805 26.25 23.5325 26.25H6.46752C5.19627 26.25 4.56002 26.25 4.18877 25.8463C3.81752 25.4425 3.87002 24.8087 3.97627 23.5425L4.61752 15.835Z" stroke="black" stroke-width="1.5" />
                        </svg>
                        {bagCount > 0 && <span>{bagCount}</span>}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none" className={styles.menuIcon} onClick={handleOpenMenu}>
                        <path d="M6.66663 10.8333H23.3333M6.66663 15H23.3333M6.66663 19.1667H23.3333" stroke="black" stroke-width="1.38889" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
                <div className={`${styles.overlayMenu} ${isMenuOpen ? styles.show : ''} container`}>
                    <div className={styles.overlayTop}>
                        <div className={styles.overlayTopHeader}>
                            <a href="/">Home</a>
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" className={styles.closeIcon} onClick={handleCloseMenu}>
                                <path d="M7.99999 22.885L7.11499 22L14.115 15L7.11499 7.99999L7.99999 7.11499L15 14.115L22 7.11499L22.885 7.99999L15.885 15L22.885 22L22 22.885L15 15.885L7.99999 22.885Z" fill="#0E0E0E" />
                            </svg>
                        </div>
                        <ul className={styles.overlayTopLinks}>
                            <li className={styles.overlayTopLink}>Jackets</li>
                            <li className={styles.overlayTopLink}>Pants</li>
                            <li className={styles.overlayTopLink}>Sweaters</li>
                            <li className={styles.overlayTopLink}>Shirts</li>
                            <li className={styles.overlayTopLink}><a href="/scarves">Scarves</a></li>
                            <li className={styles.overlayTopLink}>Gallery</li>
                            <li className={styles.overlayTopLink}>Contact</li>
                        </ul>
                    </div>
                    <div className={styles.overlayBottom}>
                        {isAuthenticated ? (
                            <>
                                <a href="/profile" onClick={handleCloseMenu}>Profile</a>
                                <button className={styles.signOutButton} onClick={handleLogout}>Sign Out</button>
                                <a href="/">Devenir Services</a>
                                <a href="/">Customer Support</a>
                            </>
                        ) : (
                            <>
                                <a href="/auth" onClick={handleCloseMenu}>Login / Register</a>
                                <a href="/">Devenir Services</a>
                                <a href="/">Customer Support</a>
                            </>
                        )}
                    </div>
                </div>
                {isBagOpen && (
                    <Bag
                        onMouseEnter={handleBagMouseEnter}
                        onMouseLeave={handleBagMouseLeave}
                        bagCount={bagCount}
                    />
                )}
            </div >
            {isSearchOpen && <Search onClose={closeSearch} />}
        </>
    );
};

export default Header;