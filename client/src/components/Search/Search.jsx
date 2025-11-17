import styles from './Search.module.css';
import { useEffect, useRef } from 'react';

const Search = ({ onClose }) => {
    const inputRef = useRef(null);


     // ✅ Lock scroll khi Search mở
    useEffect(() => {
        // Lưu vị trí scroll hiện tại
        const scrollY = window.scrollY;
        
        // Lock body scroll
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Focus vào input
        inputRef.current?.focus();

        // Cleanup: Unlock scroll khi component unmount
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            window.scrollTo(0, scrollY);
        };
    }, []);

    // Prevent scroll khi click vào Search container
    const handleSearchContainerClick = (e) => {
        e.stopPropagation();
    };

    return (
        <>
            {/* Backdrop - Click để đóng */}
            <div className={styles.backdrop} onClick={onClose}></div>
            
            {/* Search Container */}
            <div className={styles.searchContainer}>
                <div className={styles.inputWrapper}>
                    <input type="text" placeholder="Search" ref={inputRef} />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 22" fill="none">
                        <path d="M22.619 1.19043L32.1428 10.719L22.619 20.2452M1.19043 10.7214H32.1428" stroke="#0E0E0E" strokeWidth="2.38095" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg> 
                </div>
                <div className={styles.results}>
                    <a className={styles.result} href="#">Wool Scarf</a>
                    <a className={styles.result} href="#">Devenir Scarf</a>
                    <a className={styles.result} href="#">Gucci Scarf</a>
                    <a className={styles.result} href="#">Devenir Scarf</a>
                    <a className={styles.result} href="#">Gucci Scarf</a>
                </div>
            </div>
        </>
    );
}

export default Search;