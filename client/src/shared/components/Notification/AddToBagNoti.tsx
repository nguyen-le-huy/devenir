import styles from "./AddToBagNoti.module.css";
import { useLenisControl } from '@/shared/hooks/useLenisControl';
import { useNavigate } from "react-router-dom";
import { useRandomVariants } from '@/features/products/hooks/useProducts';
import Loading from "@/shared/components/Loading/Loading";
import Backdrop from '@/shared/components/Backdrop/Backdrop';
import { getOptimizedImageUrl } from '@/shared/utils/imageOptimization';

interface AddToBagNotiProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddToBagNoti = ({ isOpen, onClose }: AddToBagNotiProps) => {
    const navigate = useNavigate();

    // Lock scroll when modal is open using useLenisControl
    useLenisControl(isOpen);

    // Fetch 8 random products
    const { data: randomVariants, isLoading } = useRandomVariants(8);

    const handleContinueShopping = () => {
        if (onClose) onClose();
    };

    const handleCheckout = () => {
        if (onClose) onClose();
        navigate("/checkout");
    };

    const handleProductClick = (variantId: string) => {
        if (onClose) onClose();
        navigate(`/product-detail?variant=${variantId}`);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Dark Overlay */}
            <Backdrop isOpen={isOpen} onClick={onClose} />
            {/* Notification */}
            <div className={styles.notification} data-lenis-prevent>
                <div className={styles.header}>
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="11" viewBox="0 0 15 11" fill="none">
                            <path d="M15 1.1566L4.71429 11L0 6.48844L1.20857 5.33184L4.71429 8.6786L13.7914 0L15 1.1566Z" fill="#0E0E0E" />
                        </svg>
                        Added to bag
                    </span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        onClick={onClose}
                        style={{ cursor: 'pointer' }}
                    >
                        <path d="M6.36875 7.10625L0.904167 12.5708C0.806944 12.6681 0.6875 12.7201 0.545833 12.7271C0.404166 12.734 0.277778 12.6819 0.166667 12.5708C0.0555554 12.4597 0 12.3368 0 12.2021C0 12.0674 0.0555554 11.9444 0.166667 11.8333L5.63125 6.36875L0.166667 0.904167C0.0694443 0.806944 0.0173609 0.6875 0.0104164 0.545833C0.00347196 0.404166 0.0555554 0.277778 0.166667 0.166667C0.277778 0.0555554 0.400694 0 0.535417 0C0.670139 0 0.793056 0.0555554 0.904167 0.166667L6.36875 5.63125L11.8333 0.166667C11.9306 0.0694443 12.0503 0.0173609 12.1927 0.0104164C12.3337 0.00347196 12.4597 0.0555554 12.5708 0.166667C12.6819 0.277778 12.7375 0.400694 12.7375 0.535417C12.7375 0.670139 12.6819 0.793056 12.5708 0.904167L7.10625 6.36875L12.5708 11.8333C12.6681 11.9306 12.7201 12.0503 12.7271 12.1927C12.734 12.3337 12.6819 12.4597 12.5708 12.5708C12.4597 12.6819 12.3368 12.7375 12.2021 12.7375C12.0674 12.7375 11.9444 12.6819 11.8333 12.5708L6.36875 7.10625Z" fill="#0E0E0E" />
                    </svg>
                </div>
                <div className={styles.buttonList}>
                    <button className={styles.continueShopping} onClick={handleContinueShopping}>Continue Shopping</button>
                    <button className={styles.checkout} onClick={handleCheckout}>Checkout</button>
                </div>
                <p className={styles.moreToDiscover}>More to discover</p>
                <div className={styles.productSuggestion} data-lenis-prevent>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', width: '100%' }}>
                            <Loading inline size="md" />
                        </div>
                    ) : (
                        randomVariants?.map((variant: any) => (
                            <div
                                key={variant._id}
                                className={styles.productCard}
                                onClick={() => handleProductClick(variant._id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <img
                                    src={getOptimizedImageUrl(variant.mainImage || '/images/placeholder.png')}
                                    alt={variant.productInfo?.name || 'Product'}
                                    loading="lazy"
                                />
                                <div className={styles.productInfo}>
                                    <p>{variant.productInfo?.name || 'Product'}</p>
                                    <p>${variant.price?.toFixed(2) || '0.00'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default AddToBagNoti;
