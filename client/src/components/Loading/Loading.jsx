import styles from './Loading.module.css';

/**
 * Loading Spinner Component
 * @param {Object} props
 * @param {boolean} props.inline - If true, renders a small inline spinner (no container)
 * @param {string} props.size - Size: 'sm' (20px), 'md' (40px), 'lg' (60px). Default: 'lg'
 */
const Loading = ({ inline = false, size = 'lg' }) => {
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
};

export default Loading;
