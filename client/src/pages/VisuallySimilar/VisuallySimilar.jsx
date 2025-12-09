import styles from './VisuallySimilar.module.css';

const VisuallySimilar = () => {
    return (
        <div className={styles.visuallySimilar}>
            <div className={styles.yourImage}>
                <p className={styles.title}>Your Image:</p>
                <div className={styles.imageContainer}>
                    <img src="/images/sample3.png" alt="your-image" />
                </div>
            </div>
            <div className={styles.similarProducts}>
                <p className={styles.title}>Visually Similar Products:</p>
            </div>
        </div>
    );
};

export default VisuallySimilar;
