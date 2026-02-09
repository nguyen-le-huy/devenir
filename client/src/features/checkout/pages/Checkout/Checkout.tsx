import { useState, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";
import { toast } from 'sonner';
import ProductCheckout from '@/features/products/components/ProductCard/ProductCheckout';
import ProductCarousel from '@/features/products/components/ProductCarousel/ProductCarousel';
import PageWrapper from '@/shared/components/PageWrapper/PageWrapper';
import { useCart, useRemoveFromCart } from '@/features/cart/hooks/useCart';
import { useRecommendedProducts } from '@/features/checkout/hooks/useRecommendedProducts';
import EditItem from '@/features/cart/components/EditItem/EditItem';
import { ICartItem } from '@/features/cart/types';
import { useImagePreloader } from '@/shared/hooks/useImagePreloader';
import { CoinbaseIcon } from '@/shared/components/icons/CoinbaseIcon';

const Checkout = memo(() => {
    const navigate = useNavigate();

    // State for EditItem modal
    const [showEditItem, setShowEditItem] = useState(false);
    const [editingItem, setEditingItem] = useState<ICartItem | null>(null);

    // Fetch real cart data
    const { data: cartData, isLoading: isCartLoading } = useCart();
    const cart = cartData || { items: [], totalItems: 0, totalPrice: 0 };

    // Remove from cart mutation
    const removeFromCartMutation = useRemoveFromCart();

    // Fetch recommended products
    const { recommendedProducts, isLoading: isRecLoading } = useRecommendedProducts(8);

    // IMAGE PRELOADING (Visual-First Strategy)
    const criticalImages = useMemo(() => {
        const images: string[] = [
            // Static Trust Assets
            '/images/instruction1.webp',
            '/images/instruction2.webp',
            '/images/applepay.png',
            '/images/visa.png',
            '/images/paypal.png',
            '/images/mc.png',
            '/images/klarna.png',
            '/images/jcb.png'
        ];

        // Preload first few product images from cart
        if (cart.items.length > 0) {
            cart.items.slice(0, 4).forEach((item: ICartItem) => {
                if (item.productVariant?.mainImage) {
                    images.push(item.productVariant.mainImage);
                } else if (item.productVariant?.images?.length > 0) {
                    images.push(item.productVariant.images[0]);
                }
            });
        }

        return images;
    }, [cart.items]);

    const areImagesLoaded = useImagePreloader(criticalImages, !isCartLoading && criticalImages.length > 0);

    const handleRemoveItem = (variantId: string) => {
        removeFromCartMutation.mutate(variantId, {
            onSuccess: () => {
                // Item removed successfully
            },
            onError: (error: Error) => {
                toast.error(error.message || 'Failed to remove item');
            }
        });
    };

    const handleEditItem = (item: ICartItem) => {
        setEditingItem(item);
        setShowEditItem(true);
    };

    const handleCloseEditItem = () => {
        setShowEditItem(false);
        setEditingItem(null);
    };

    const handleCheckout = () => {
        // Check if cart is not empty
        if (cart.items.length === 0) {
            toast.error('Your bag is empty. Please add items to checkout.');
            return;
        }

        // Navigate to shipping page
        navigate('/shipping');
    };

    // Combined Loading State
    const isPageLoading = isCartLoading || isRecLoading || !areImagesLoaded;

    return (
        <PageWrapper isLoading={isPageLoading}>
            <div className={styles.checkout}>
                <div className={styles.header}>
                    <h3>Your Bag Total Is USD {cart.totalPrice.toFixed(2)}</h3>
                    <p>Free delivery & returns on your order</p>
                </div>
                <div className={styles.body}>
                    <div className={styles.left}>
                        {cart.items.length > 0 ? (
                            cart.items.map((item: ICartItem, index: number) => (
                                <ProductCheckout
                                    key={item.productVariant?._id || index}
                                    item={item}
                                    onRemove={handleRemoveItem}
                                    onEdit={handleEditItem}
                                />
                            ))
                        ) : (
                            <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Your bag is empty</p>
                        )}
                    </div>
                    <div className={styles.right}>
                        <h2>Your Order Summary</h2>
                        <div className={styles.summary}>
                            <div className={styles.summaryItem}>
                                <p className={styles.subtotalLabel}>Subtotal</p>
                                <p>USD {cart.totalPrice.toFixed(2)}</p>
                            </div>
                            <div className={styles.summaryItem}>
                                <p>Estimated Shipping</p>
                                <p>Free</p>
                            </div>
                            <div className={styles.summaryItem}>
                                <p>Sales Tax</p>
                                <p>Calculated during checkout</p>
                            </div>
                        </div>
                        <div className={styles.total}>
                            <p className={styles.totalLabel}>Total</p>
                            <p className={styles.totalPrice}>USD {cart.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className={styles.checkoutButtonList}>
                            <button className={styles.checkoutButton} onClick={handleCheckout}>
                                Checkout ({cart.totalItems})
                            </button>
                            <div className={styles.coinbaseButton}>
                                <CoinbaseIcon />
                            </div>
                        </div>
                        <div className={styles.instructions}>
                            <div className={styles.instructionsItem}>
                                <img src="/images/instruction1.webp" alt="instruction" />
                                <div className={styles.content}>
                                    <h3>Expert Aftercare</h3>
                                    <p>We offer a selection of services to help ensure your Burberry pieces are enjoyed for years to come.</p>
                                </div>
                            </div>
                            <div className={styles.instructionsItem}>
                                <img src="/images/instruction2.webp" alt="instruction" />
                                <div className={styles.content}>
                                    <h3>Is this a gift?</h3>
                                    <p>Select our complimentary, recyclable and reusable gift packaging at checkout.</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.benefits}>
                            <p>Free delivery & returns</p>
                            <p>Shop with confidence with free returns.</p>
                        </div>
                        <div className={styles.accepts}>
                            <p>Devenir Accepts</p>
                            <div className={styles.paymentMethods}>
                                <img src="/images/applepay.png" alt="payment" />
                                <img src="/images/visa.png" alt="payment" />
                                <img src="/images/paypal.png" alt="payment" />
                                <img src="/images/mc.png" alt="payment" />
                                <img src="/images/klarna.png" alt="payment" />
                                <img src="/images/jcb.png" alt="payment" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ProductCarousel
                title="You May Also Like"
                viewAllLink="#"
                products={recommendedProducts}
                showViewAll={false}
            />
            {showEditItem && editingItem && (
                <EditItem item={editingItem} onClose={handleCloseEditItem} />
            )}
        </PageWrapper>
    );
});

Checkout.displayName = 'Checkout';

export default Checkout;
