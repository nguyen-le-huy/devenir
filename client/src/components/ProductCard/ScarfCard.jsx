import styles from './ScarfCard.module.css';

const ScarfCard = ({ scarf }) => {
    return (
        <div className={styles.scarfCard}>
            <div className={styles.imageWrapper}>
                <img
                    src={scarf.image}
                    alt={scarf.name}
                    className={styles.imageDefault}
                />
                <img
                    src={scarf.imageHover}
                    alt={`${scarf.name} hover`}
                    className={styles.imageHover}
                />
            </div>
            <div className={styles.scarfInfo}>
                <h4 className={styles.scarfName}>{scarf.name}</h4>
                <p className={styles.scarfPrice}>${scarf.price}</p>
            </div>
        </div>
    );
};

export default ScarfCard;