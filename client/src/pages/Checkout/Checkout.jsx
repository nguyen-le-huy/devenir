import styles from "./Checkout.module.css";
import ProductCheckout from "../../components/ProductCard/ProductCheckout";
import ProductCarousel from "../../components/ProductCarousel/ProductCarousel";
import { useCart, useRemoveFromCart } from "../../hooks/useCart.js";
import { useLatestVariants } from "../../hooks/useProducts.js";
import { useMemo, useState } from "react";
import EditItem from "../../components/EditItem/EditItem";

const Checkout = () => {
    // State for EditItem modal
    const [showEditItem, setShowEditItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Fetch real cart data
    const { data: cartData, isLoading } = useCart();
    const cart = cartData?.data || { items: [], totalItems: 0, totalPrice: 0 };

    // Remove from cart mutation
    const removeFromCartMutation = useRemoveFromCart();

    // Fetch latest variants for "You May Also Like" carousel
    const { data: variantsData } = useLatestVariants(20);

    // Transform and shuffle variants to get 8 random products
    const recommendedProducts = useMemo(() => {
        if (!variantsData || variantsData.length === 0) return [];

        // Shuffle array randomly
        const shuffled = [...variantsData].sort(() => Math.random() - 0.5);

        // Take first 8 and transform to product format
        return shuffled.slice(0, 8).map(variant => ({
            id: variant._id,
            name: variant.productInfo?.name || 'Product',
            price: variant.price,
            image: variant.mainImage || '/images/placeholder.png',
            imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
        }));
    }, [variantsData]);

    const handleRemoveItem = (variantId) => {
        removeFromCartMutation.mutate(variantId, {
            onSuccess: () => {
                // Item removed successfully
            },
            onError: (error) => {
                alert(error.message || 'Failed to remove item');
            }
        });
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setShowEditItem(true);
    };

    const handleCloseEditItem = () => {
        setShowEditItem(false);
        setEditingItem(null);
    };

    return (
        <>
            <div className={styles.checkout}>
                <div className={styles.header}>
                    <h3>Your Bag Total Is USD {cart.totalPrice.toFixed(2)}</h3>
                    <p>Free delivery & returns on your order</p>
                </div>
                <div className={styles.body}>
                    <div className={styles.left}>
                        {cart.items.length > 0 ? (
                            cart.items.map((item, index) => (
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
                            <button className={styles.checkoutButton}>Checkout ({cart.totalItems})</button>
                            <div className={styles.coinbaseButton}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101 18" fill="none">
                                    <g clip-path="url(#clip0_334_284)">
                                        <path d="M20.3845 5.02526C16.7154 5.02526 13.8485 7.80406 13.8485 11.5241C13.8485 15.2441 16.6429 17.9991 20.3845 17.9991C24.126 17.9991 26.969 15.1965 26.969 11.5003C26.969 7.82784 24.1746 5.02526 20.3845 5.02526ZM20.4092 15.3182C18.3198 15.3182 16.7887 13.6992 16.7887 11.525C16.7887 9.32608 18.295 7.70801 20.3845 7.70801C22.4986 7.70801 24.0288 9.35078 24.0288 11.525C24.0288 13.6992 22.4986 15.3182 20.4092 15.3182ZM27.7703 7.85253H29.593V17.7585H32.5084V5.26673H27.7703V7.85253ZM6.51122 7.7071C8.0423 7.7071 9.25708 8.64922 9.71824 10.0505H12.8042C12.245 7.05493 9.76683 5.02526 6.53597 5.02526C2.86688 5.02526 0 7.80406 0 11.525C0 15.2459 2.79445 18 6.53597 18C9.6944 18 12.2211 15.9703 12.7804 12.95H9.71824C9.28092 14.3513 8.06614 15.3182 6.53506 15.3182C4.42088 15.3182 2.93931 13.6992 2.93931 11.525C2.94023 9.32608 4.39796 7.7071 6.51122 7.7071ZM83.1661 10.3167L81.0281 10.0029C80.0077 9.85843 79.2788 9.52 79.2788 8.72239C79.2788 7.85253 80.2268 7.41806 81.514 7.41806C82.9232 7.41806 83.8226 8.02175 84.0169 9.01235H86.8352C86.5189 6.49972 84.5753 5.02617 81.5874 5.02617C78.5014 5.02617 76.4605 6.59668 76.4605 8.81935C76.4605 10.9451 77.7972 12.1781 80.4936 12.5641L82.6316 12.8778C83.6768 13.0223 84.2599 13.4339 84.2599 14.2068C84.2599 15.1974 83.2395 15.6081 81.8303 15.6081C80.1049 15.6081 79.133 14.9075 78.9873 13.8446H76.1204C76.3881 16.285 78.307 18 81.8056 18C84.9887 18 87.102 16.5502 87.102 14.0614C87.102 11.8387 85.5718 10.6789 83.1661 10.3167ZM31.0507 0.120738C29.9817 0.120738 29.1795 0.893643 29.1795 1.9565C29.1795 3.01936 29.9808 3.79227 31.0507 3.79227C32.1197 3.79227 32.9219 3.01936 32.9219 1.9565C32.9219 0.893643 32.1197 0.120738 31.0507 0.120738ZM73.8366 9.54378C73.8366 6.83815 72.1845 5.02617 68.6859 5.02617C65.3817 5.02617 63.5353 6.69363 63.1704 9.25474H66.062C66.2078 8.26414 66.9853 7.44276 68.6374 7.44276C70.1198 7.44276 70.8487 8.09492 70.8487 8.89253C70.8487 9.9316 69.512 10.1969 67.8599 10.3661C65.6247 10.6076 62.855 11.3805 62.855 14.28C62.855 16.5274 64.5319 17.9762 67.2044 17.9762C69.2938 17.9762 70.6058 17.1064 71.2622 15.7288C71.3594 16.9609 72.2826 17.7585 73.5707 17.7585H75.2714V15.1736H73.8375V9.54378H73.8366ZM70.9697 12.6848C70.9697 14.3523 69.512 15.5843 67.738 15.5843C66.6442 15.5843 65.721 15.1252 65.721 14.1593C65.721 12.9272 67.2035 12.5887 68.564 12.4442C69.876 12.3235 70.6048 12.0335 70.9697 11.4774V12.6848ZM55.493 5.02526C53.8647 5.02526 52.5042 5.70212 51.5323 6.83724V0H48.6169V17.7585H51.4837V16.1158C52.4556 17.2994 53.8409 18 55.493 18C58.9915 18 61.6402 15.2459 61.6402 11.525C61.6402 7.80406 58.943 5.02526 55.493 5.02526ZM55.0557 15.3182C52.9662 15.3182 51.4352 13.6992 51.4352 11.525C51.4352 9.35078 52.9901 7.70801 55.0795 7.70801C57.1937 7.70801 58.6752 9.327 58.6752 11.525C58.6752 13.6992 57.1451 15.3182 55.0557 15.3182ZM41.6436 5.02526C39.7485 5.02526 38.509 5.79816 37.7801 6.88572V5.26673H34.8885V17.7576H37.8039V10.9689C37.8039 9.05991 39.0187 7.7071 40.8166 7.7071C42.4935 7.7071 43.5377 8.8907 43.5377 10.6066V17.7585H46.4532V10.3899C46.4541 7.24793 44.8268 5.02526 41.6436 5.02526ZM101 11.1143C101 7.5388 98.3761 5.02617 94.8528 5.02617C91.1112 5.02617 88.3654 7.82875 88.3654 11.525C88.3654 15.4151 91.3056 18 94.9014 18C97.9388 18 100.32 16.2118 100.927 13.6754H97.8892C97.4519 14.7867 96.3829 15.4151 94.949 15.4151C93.0778 15.4151 91.6687 14.2553 91.3533 12.2256H100.999V11.1143H101ZM91.5238 10.1475C91.9859 8.40774 93.2978 7.56258 94.8042 7.56258C96.4563 7.56258 97.7196 8.5047 98.0112 10.1475H91.5238Z" fill="#0052FF" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_334_284">
                                            <rect width="101" height="18" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                        <div className={styles.instructions}>
                            <div className={styles.instructionsItem}>
                                <img src="/images/instruction1.png" alt="instruction" />
                                <div className={styles.content}>
                                    <h3>Expert Aftercare</h3>
                                    <p>We offer a selection of services to help ensure your Burberry pieces are enjoyed for years to come.</p>
                                </div>
                            </div>
                            <div className={styles.instructionsItem}>
                                <img src="/images/instruction2.png" alt="instruction" />
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
        </>
    );
};

export default Checkout;