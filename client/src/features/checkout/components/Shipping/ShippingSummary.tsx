
import { useNavigate } from 'react-router-dom';
import styles from '@/features/checkout/pages/Checkout/Checkout.module.css';

interface ShippingSummaryProps {
    totalItems: number;
    subtotal: string;
    shippingCostLabel: string;
    total: string;
}

const ShippingSummary = ({ totalItems, subtotal, shippingCostLabel, total }: ShippingSummaryProps) => {
    const navigate = useNavigate();

    return (
        <div className={styles.summary}>
            <div className={styles.summaryItem}>
                <p className={styles.checkoutLabel}>Checkout ({totalItems} items)</p>
                <p className={styles.editBag} onClick={() => navigate('/checkout')}>Edit bag</p>
            </div>
            <div className={styles.summaryItem}>
                <p className={styles.subtotalLabel}>Subtotal</p>
                <p>USD {subtotal}</p>
            </div>
            <div className={styles.summaryItem}>
                <p>Estimated Shipping</p>
                <p>{shippingCostLabel}</p>
            </div>
            <div className={styles.summaryItem}>
                <p>Sales Tax</p>
                <p>Calculated during checkout</p>
            </div>
            <div className={styles.total}>
                <p className={styles.totalLabel}>Total</p>
                <p className={styles.totalPrice}>USD {total}</p>
            </div>
        </div>
    );
};

export default ShippingSummary;
