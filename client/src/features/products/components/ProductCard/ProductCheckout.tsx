import styles from "./ProductCheckout.module.css";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';

interface ProductCheckoutProps {
    item: any;
    onRemove?: (id: string) => void;
    onUpdateQuantity?: (id: string, quantity: number) => void;
    onEdit?: (item: any) => void;
}

const ProductCheckout = ({ item, onRemove, onEdit }: ProductCheckoutProps) => {
    const navigate = useNavigate();
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

    const handleEdit = () => {
        if (onEdit) {
            onEdit(item);
        }
    };

    const handleProductClick = () => {
        if (variant?._id) {
            navigate(`/product-detail?variant=${variant._id}`);
        }
    };

    return (
        <div className={styles.productCheckout}>
            <div className={styles.topSection}>
                <div className={styles.productImage}>
                    <img
                        src={getOptimizedImageUrl(image)}
                        alt={productName}
                        onClick={handleProductClick}
                        style={{ cursor: 'pointer' }}
                        loading="lazy"
                    />
                </div>
                <div className={styles.productInfo}>
                    <div className={styles.box1}>
                        <h3
                            className={styles.productName}
                            onClick={handleProductClick}
                        >{productName}</h3>
                        <div className={styles.productDetail}>
                            <p>Item: {sku}</p>
                            <p>{color}</p>
                            <div className={styles.sizeQtyEdit}>
                                {size && size !== 'Free Size' && (
                                    <>
                                        <p>Size: {size}</p>
                                        <span>|</span>
                                    </>
                                )}
                                <p>Qty: {quantity}</p>
                                <span>|</span>
                                <p className={styles.editButton} onClick={handleEdit} style={{ cursor: 'pointer' }}>Edit</p>
                            </div>
                        </div>
                    </div>
                    {/* Desktop: box2 in .productInfo */}
                    <div className={`${styles.box2} ${styles.desktopOnly}`}>
                        <p className={styles.deleteButton} onClick={handleDelete} style={{ cursor: 'pointer' }}>Delete</p>
                        <p className={styles.productPrice}>USD {totalPrice.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            {/* Mobile: box2 outside .topSection */}
            <div className={`${styles.box2} ${styles.mobileOnly}`}>
                <p className={styles.deleteButton} onClick={handleDelete} style={{ cursor: 'pointer' }}>Delete</p>
                <p className={styles.productPrice}>USD {totalPrice.toFixed(2)}</p>
            </div>
        </div>
    );
};

export default ProductCheckout;
