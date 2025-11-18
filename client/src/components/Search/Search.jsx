import styles from './Search.module.css';
import { useEffect, useRef, useState } from 'react';
import { lenisInstance } from '../../App'; // Import Lenis

const Search = ({ onClose }) => {
    const inputRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        // Tính toán chiều cao thực tế của header
        const header = document.querySelector('[class*="header"]');
        if (header) {
            const rect = header.getBoundingClientRect();
            setHeaderHeight(rect.bottom);
        }

        // ✅ Dừng Lenis - Không ảnh hưởng gì đến DOM/CSS
        if (lenisInstance) {
            lenisInstance.stop();
        }

        // Focus vào input
        inputRef.current?.focus();

        // Cleanup
        return () => {
            if (lenisInstance) {
                lenisInstance.start();
            }
        };
    }, []);

    return (
        <>
            <div className={styles.backdrop} onClick={onClose}></div>
            
            <div 
                className={styles.searchContainer}
                style={{ top: `${headerHeight}px` }}
            >
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