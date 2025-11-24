import styles from "./ProductCheckout.module.css";

const ProductCheckout = () => {
    return (
        <div className={styles.productCheckout}>
            <div className={styles.productImage}>
                <img src="/images/newArr1.png" alt="product" />
            </div>
            <div className={styles.productInfo}>
                <div className={styles.box1}>
                    <h3 className={styles.productName}>Check Cashmere Product</h3>
                    <div className={styles.productDetail}>
                        <p>Item: 212895</p>
                        <p>Black</p>
                        <div className={styles.sizeQtyEdit}>
                            <p>Size: 40</p>
                            <span>|</span>
                            <p>Qty: 2</p>
                            <span>|</span>
                            <p className={styles.editButton}>Edit</p>
                        </div>
                    </div>
                </div>
                <div className={styles.box2}>
                    <p className={styles.deleteButton}>Delete</p>
                    <p className={styles.productPrice}>USD 2000.00</p>
                </div>
            </div>
        </div>
    );
};

export default ProductCheckout;
