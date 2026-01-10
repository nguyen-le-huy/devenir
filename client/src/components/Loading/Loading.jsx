import { memo } from 'react';
import styles from './Loading.module.css';
import PropTypes from 'prop-types';

/**
 * Loading Spinner Component
 * @param {Object} props
 * @param {boolean} props.inline - If true, renders a small inline spinner (no container)
 * @param {string} props.size - Size: 'sm' (20px), 'md' (40px), 'lg' (60px). Default: 'lg'
 */
const Loading = memo(({ inline = false, size = 'lg' }) => {
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

Loading.propTypes = {
    inline: PropTypes.bool,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

Loading.displayName = 'Loading';

export default Loading;
