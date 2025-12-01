import styles from "./ProductCheckout.module.css";

const ProductCheckout = ({ item, onRemove, onUpdateQuantity }) => {
    const variant = item?.productVariant;
    const productName = variant?.product_id?.name || 'Product';
    const image = variant?.mainImage || '/images/placeholder.png';
    const price = variant?.price || 0;
    const size = variant?.size || '';
    const color = variant?.color || '';
    const sku = variant?.sku || '';
    const quantity = item?.quantity || 1;
    const totalPrice = price * quantity;

    const handleDelete = () => {
        if (onRemove && variant?._id) {
            onRemove(variant._id);
        }
    };

    return (
        <div className={styles.productCheckout}>
            <div className={styles.productImage}>
                <img src={image} alt={productName} />
            </div>
            <div className={styles.productInfo}>
                <div className={styles.box1}>
                    <h3 className={styles.productName}>{productName}</h3>
                    <div className={styles.productDetail}>
                        <p>Item: {sku}</p>
                        <p>{color}</p>
                        <div className={styles.sizeQtyEdit}>
                            <p>Size: {size}</p>
                            <span>|</span>
                            <p>Qty: {quantity}</p>
                            <span>|</span>
                            <p className={styles.editButton}>Edit</p>
                        </div>
                    </div>
                </div>
                <div className={styles.box2}>
                    <p className={styles.deleteButton} onClick={handleDelete} style={{ cursor: 'pointer' }}>Delete</p>
                    <p className={styles.productPrice}>USD {totalPrice.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};

export default ProductCheckout;
