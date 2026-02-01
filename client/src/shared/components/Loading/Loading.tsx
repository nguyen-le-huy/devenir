import { memo } from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
    inline?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Loading Spinner Component
 */
const Loading = memo(({ inline = false, size = 'lg' }: LoadingProps) => {
    if (inline) {
        return (
            <div
                className={`${styles.loaderCircle} ${styles[size]}`}
            />
        );
    }

    return (
        <div className={styles.loadingContainer}>
            <div className={`${styles.loaderCircle} ${styles[size]}`}></div>
        </div>
    );
});

Loading.displayName = 'Loading';

export default Loading;
