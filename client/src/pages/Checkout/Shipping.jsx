import { useState, useEffect } from "react";
import styles from "./Checkout.module.css";
import { useShippingAddress, useSaveShippingAddress, useUpdateShippingAddress } from "../../hooks/useShipping.js";
import { useCart } from "../../hooks/useCart.js";
import { useNavigate } from "react-router-dom";
import { createPayOSPaymentSession } from "../../features/payos";
import { createNowPaymentsSession } from "../../features/nowpayments";
import PaymentOptions from "./PaymentOptions";
import GiftCodeSection from "./GiftCodeSection";

const Shipping = () => {
    const navigate = useNavigate();

    // Fetch cart data
    const { data: cartData } = useCart();
    const cart = cartData?.data || { items: [], totalItems: 0, totalPrice: 0 };

    // Fetch existing shipping address
    const { data: addressData } = useShippingAddress();
    const saveAddressMutation = useSaveShippingAddress();
    const updateAddressMutation = useUpdateShippingAddress();
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [savedAddress, setSavedAddress] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    // State management
    const [shippingMethod, setShippingMethod] = useState(""); // "home" or "store"
    const [deliveryTime, setDeliveryTime] = useState(""); // "standard", "next", "nominated"
    const [paymentMethod, setPaymentMethod] = useState(""); // "payos" or "nowpayments"

    // Gift code state
    const [giftCode, setGiftCode] = useState("");
    const [giftCodeApplied, setGiftCodeApplied] = useState(false);
    const [giftCodeError, setGiftCodeError] = useState("");
    // Fixed prices when gift code is applied: 5000 VND for PayOS, 0.1 USDT for NowPayments
    const giftCodeFixedPrice = { vnd: 5000, usdt: 0.1 };

    // Form data
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        address: "",
        city: "",
        district: "",
        zipCode: ""
    });

    const cartTotal = Number(cart.totalPrice || 0);
    const shippingCharge = deliveryTime === "next" ? 5 : deliveryTime === "nominated" ? 10 : 0;
    const totalWithShipping = cartTotal + shippingCharge;
    const shippingCostLabel = shippingCharge > 0 ? `USD ${shippingCharge.toFixed(2)}` : "Free";
    const formattedCartTotal = cartTotal.toFixed(2);
    const formattedTotalWithShipping = totalWithShipping.toFixed(2);
    const canProceedToPayment = Boolean(deliveryTime && savedAddress && !showAddressForm);
    const payButtonDisabled = isProcessingPayment || !paymentMethod || !canProceedToPayment;


    // Load existing address if available
    useEffect(() => {
        if (addressData?.data) {
            setSavedAddress({ ...addressData.data });
            setFormData(addressData.data);
        }
    }, [addressData]);

    // Redirect to checkout if cart is empty
    useEffect(() => {
        if (cartData && cart.items.length === 0) {
            navigate('/checkout');
        }
    }, [cart.items.length, cartData, navigate]);

    useEffect(() => {
        setPaymentError("");
    }, [paymentMethod, deliveryTime, shippingMethod, showAddressForm]);


    // Handle shipping method selection
    const handleShippingMethodChange = (method) => {
        setShippingMethod(method);
        setDeliveryTime("");
        setShowAddressForm(false);
    };

    // Handle delivery time selection
    const handleDeliveryTimeChange = (time) => {
        setDeliveryTime(time);
        // Check if address already exists
        if (savedAddress) {
            // If address exists, don't show form (will show checkInfo instead)
            setShowAddressForm(false);
        } else {
            // If no address exists, show form to enter address
            setShowAddressForm(true);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Handle confirm address
    const handleConfirmAddress = async (e) => {
        e.preventDefault();

        // Validate form
        const isValid = Object.values(formData).every(value => value.trim() !== "");
        if (!isValid) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            // Save or update address to database
            if (savedAddress) {
                // Update existing address
                await updateAddressMutation.mutateAsync(formData);
            } else {
                // Save new address
                await saveAddressMutation.mutateAsync(formData);
            }

            setSavedAddress({ ...formData });
            setShowAddressForm(false);
            setPaymentError("");

            console.log("Address saved:", formData);
        } catch (error) {
            console.error("Error saving address:", error);
            alert(error.message || "Failed to save address. Please try again.");
        }
    };

    // Handle edit address
    const handleEditAddress = () => {
        setShowAddressForm(true);
        // Keep savedAddress to populate form with existing data
    };

    // Handle gift code application
    const handleApplyGiftCode = () => {
        setGiftCodeError("");

        if (!giftCode.trim()) {
            setGiftCodeError("Please enter a gift code");
            return;
        }

        if (giftCode.toLowerCase() === "emanhhuy") {
            setGiftCodeApplied(true);
            setGiftCodeError("");
        } else {
            setGiftCodeApplied(false);
            setGiftCodeError("Invalid gift code");
        }
    };

    // Handle remove gift code
    const handleRemoveGiftCode = () => {
        setGiftCode("");
        setGiftCodeApplied(false);
        setGiftCodeError("");
    };

    const handlePayWithPayOS = async () => {
        if (isProcessingPayment) return;
        setPaymentError("");

        if (shippingMethod !== "home") {
            setPaymentError("PayOS is available for home delivery only.");
            return;
        }

        if (!deliveryTime) {
            setPaymentError("Please choose a delivery time before paying.");
            return;
        }

        if (!savedAddress) {
            setShowAddressForm(true);
            setPaymentError("Please confirm your shipping address to continue.");
            return;
        }

        if (paymentMethod !== "payos") {
            setPaymentError("Select PayOS as your payment method to continue.");
            return;
        }

        try {
            setIsProcessingPayment(true);
            const response = await createPayOSPaymentSession({
                shippingMethod,
                deliveryTime,
                address: savedAddress,
                giftCode: giftCodeApplied ? giftCode : null, // Send gift code if applied
            });

            if (response?.success && response?.data?.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
                return;
            }

            throw new Error(response?.message || "Failed to start PayOS payment.");
        } catch (error) {
            console.error("PayOS payment error:", error);
            setPaymentError(error.message || "Failed to start PayOS payment. Please try again.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handlePayWithNowPayments = async () => {
        if (isProcessingPayment) return;
        setPaymentError("");

        if (shippingMethod !== "home") {
            setPaymentError("NowPayments is available for home delivery only.");
            return;
        }

        if (!deliveryTime) {
            setPaymentError("Please choose a delivery time before paying.");
            return;
        }

        if (!savedAddress) {
            setShowAddressForm(true);
            setPaymentError("Please confirm your shipping address to continue.");
            return;
        }

        if (paymentMethod !== "nowpayments") {
            setPaymentError("Select NowPayments as your payment method to continue.");
            return;
        }

        try {
            setIsProcessingPayment(true);
            const response = await createNowPaymentsSession({
                shippingMethod,
                deliveryTime,
                address: savedAddress,
                giftCode: giftCodeApplied ? giftCode : null,
            });

            if (response?.success && response?.data?.invoiceUrl) {
                window.location.href = response.data.invoiceUrl;
                return;
            }

            throw new Error(response?.message || "Failed to start NowPayments payment.");
        } catch (error) {
            console.error("NowPayments payment error:", error);
            setPaymentError(error.message || "Failed to start NowPayments payment. Please try again.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handlePay = () => {
        if (paymentMethod === "payos") {
            handlePayWithPayOS();
        } else if (paymentMethod === "nowpayments") {
            handlePayWithNowPayments();
        }
    };

    const getPayButtonText = () => {
        if (isProcessingPayment) {
            return paymentMethod === "payos" ? "Redirecting to PayOS..." : "Redirecting to NowPayments...";
        }
        if (giftCodeApplied) {
            return paymentMethod === "payos" ? "Pay 5,000 VND" : "Pay 0.1 USDT";
        }
        return paymentMethod === "nowpayments" ? `Pay ${formattedTotalWithShipping} USDT` : `Pay USD ${formattedTotalWithShipping}`;
    };

    return (
        <>
            <div className={styles.shipping}>
                <div className={styles.shippingHeader}>
                    <p className={styles.currentStep}>Shipping</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="19" viewBox="0 0 11 19" fill="none">
                        <path d="M1.04297 17.0417L9.04297 9.04166L1.04297 1.04166" stroke="#0E0E0E" strokeWidth="2.08333" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className={styles.nextSection}>Review & Pay</p>
                </div>
                <div className={styles.body}>
                    <div className={styles.left + " " + styles.leftShipping}>
                        {/* Step 1: Choose shipping method */}
                        <div className={styles.shippingMethod}>
                            <div className={styles.shippingTitleHeader}>
                                <h2>Choose your shipping method</h2>
                                <p>You are currently in Vietnam store. <span>Shipping to a different location?</span></p>
                            </div>
                            <div className={styles.shippingMethodList}>
                                <div
                                    className={styles.shippingMethodItem}
                                    onClick={() => handleShippingMethodChange("home")}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input
                                        type="radio"
                                        name="shippingMethod"
                                        checked={shippingMethod === "home"}
                                        onChange={() => handleShippingMethodChange("home")}
                                    />
                                    <p>Home delivery</p>
                                </div>
                                <div
                                    className={styles.shippingMethodItem}
                                    onClick={() => handleShippingMethodChange("store")}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input
                                        type="radio"
                                        name="shippingMethod"
                                        checked={shippingMethod === "store"}
                                        onChange={() => handleShippingMethodChange("store")}
                                    />
                                    <p>Collect in store</p>
                                </div>
                            </div>

                            {/* Show "Not support yet" for store collection */}
                            {shippingMethod === "store" && (
                                <p style={{ marginTop: "20px", color: "var(--dark-gray)", fontSize: "16px" }}>
                                    Not support yet
                                </p>
                            )}
                        </div>

                        {/* Step 2: Choose delivery time (only for home delivery) */}
                        {shippingMethod === "home" && (
                            <div className={styles.dayShippingMethod}>
                                <div className={styles.shippingTitleHeader}>
                                    <h2>When would you like your items?</h2>
                                    <p>See more detail about our <span>Shipping</span></p>
                                </div>
                                <div className={styles.shippingMethodList}>
                                    <div
                                        className={styles.dayShippingMethodItem}
                                        onClick={() => handleDeliveryTimeChange("standard")}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.title}>
                                            <div className={styles.selection}>
                                                <input
                                                    type="radio"
                                                    name="deliveryTime"
                                                    checked={deliveryTime === "standard"}
                                                    onChange={() => handleDeliveryTimeChange("standard")}
                                                />
                                                <p>Standard delivery</p>
                                            </div>
                                            <p>FREE</p>
                                        </div>
                                        <p>Estimated delivery: December 6, 2026 - December 8, 2026</p>
                                    </div>
                                    <div
                                        className={styles.dayShippingMethodItem}
                                        onClick={() => handleDeliveryTimeChange("next")}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.title}>
                                            <div className={styles.selection}>
                                                <input
                                                    type="radio"
                                                    name="deliveryTime"
                                                    checked={deliveryTime === "next"}
                                                    onChange={() => handleDeliveryTimeChange("next")}
                                                />
                                                <p>Next day delivery</p>
                                            </div>
                                            <p>USD 5</p>
                                        </div>
                                        <p>Estimated delivery: Tomorrow December 8, 2026</p>
                                    </div>
                                    <div
                                        className={styles.dayShippingMethodItem}
                                        onClick={() => handleDeliveryTimeChange("nominated")}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.title}>
                                            <div className={styles.selection}>
                                                <input
                                                    type="radio"
                                                    name="deliveryTime"
                                                    checked={deliveryTime === "nominated"}
                                                    onChange={() => handleDeliveryTimeChange("nominated")}
                                                />
                                                <p>Nominated day delivery</p>
                                            </div>
                                            <p>USD 10</p>
                                        </div>
                                        <p>Choose a day that suits you</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Address form (only when delivery time is selected and no saved address) */}
                        {shippingMethod === "home" && deliveryTime && showAddressForm && (
                            <div className={styles.shippingAddress}>
                                <div className={styles.shippingTitleHeader}>
                                    <h2>Where would you like your parcel to be delivered?</h2>
                                    <p className={styles.requiredField}>*Required field</p>
                                </div>
                                <form onSubmit={handleConfirmAddress}>
                                    <div className={styles.formItem}>
                                        <input
                                            type="text"
                                            id="firstName"
                                            placeholder=" "
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="firstName">First name*</label>
                                    </div>
                                    <div className={styles.formItem}>
                                        <input
                                            type="text"
                                            id="lastName"
                                            placeholder=" "
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="lastName">Last name*</label>
                                    </div>
                                    <div className={styles.formItem}>
                                        <input
                                            type="text"
                                            id="phoneNumber"
                                            placeholder=" "
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="phoneNumber">Phone number*</label>
                                    </div>
                                    <div className={styles.formItem}>
                                        <input
                                            type="text"
                                            id="address"
                                            placeholder=" "
                                            value={formData.address}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="address">Address*</label>
                                    </div>
                                    <div className={styles.formItem}>
                                        <input
                                            type="text"
                                            id="city"
                                            placeholder=" "
                                            value={formData.city}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="city">City*</label>
                                    </div>
                                    <div className={styles.formItem}>
                                        <input
                                            type="text"
                                            id="district"
                                            placeholder=" "
                                            value={formData.district}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="district">District*</label>
                                    </div>
                                    <div className={styles.formItem}>
                                        <input
                                            type="text"
                                            id="zipCode"
                                            placeholder=" "
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="zipCode">Zipcode*</label>
                                    </div>
                                </form>
                                <div className={styles.confirmButton} onClick={handleConfirmAddress}>
                                    <p>Confirm Address</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.right + " " + styles.rightShipping}>
                        <div className={styles.summary}>
                            <div className={styles.summaryItem}>
                                <p className={styles.checkoutLabel}>Checkout ({cart.totalItems} items)</p>
                                <p className={styles.editBag} onClick={() => navigate('/checkout')}>Edit bag</p>
                            </div>
                            <div className={styles.summaryItem}>
                                <p className={styles.subtotalLabel}>Subtotal</p>
                                <p>USD {formattedCartTotal}</p>
                            </div>
                            <div className={styles.summaryItem}>
                                <p>Estimated Shipping</p>
                                <p>{shippingCostLabel}</p>
                            </div>
                            <div className={styles.summaryItem}>
                                <p>Sales Tax</p>
                                <p>Calculated during checkout</p>
                            </div>
                        </div>
                        <div className={styles.total}>
                            <p className={styles.totalLabel}>Total</p>
                            <p className={styles.totalPrice}>USD {formattedTotalWithShipping}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 4: Show confirmed address and gift options - only when delivery time is selected and address exists */}
            {deliveryTime && savedAddress && !showAddressForm && (
                <div className={styles.checkInfo}>
                    <div className={styles.shippingDetails}>
                        <div className={styles.shippingDetailsTitle}>
                            <h3>Shipping Details</h3>
                            <p onClick={handleEditAddress} style={{ cursor: "pointer" }}>Edit</p>
                        </div>
                        <div className={styles.shippingDetailsContent}>
                            <p>{savedAddress.firstName} {savedAddress.lastName}</p>
                            <p>{savedAddress.address}</p>
                            <p>{savedAddress.district}</p>
                            <p>{savedAddress.city}</p>
                            <p>{savedAddress.zipCode}</p>
                            <p>Vietnam</p>
                            <p>{savedAddress.phoneNumber}</p>
                        </div>
                    </div>
                    <div className={styles.gift}>
                        <div className={styles.shippingDetailsTitle}>
                            <h3>Is your delivery a gift?</h3>
                        </div>
                        <div className={styles.giftCheckbox}>
                            <input type="checkbox" />
                            <p>Add complimentary gift packaging</p>
                        </div>
                    </div>
                    <PaymentOptions
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                    />

                    <GiftCodeSection
                        giftCode={giftCode}
                        setGiftCode={setGiftCode}
                        giftCodeApplied={giftCodeApplied}
                        giftCodeError={giftCodeError}
                        setGiftCodeError={setGiftCodeError}
                        onApplyGiftCode={handleApplyGiftCode}
                        onRemoveGiftCode={handleRemoveGiftCode}
                    />

                    <button
                        type="button"
                        className={`${styles.confirmButton} ${styles.continueToPayment}`}
                        onClick={handlePay}
                        disabled={payButtonDisabled}
                    >
                        <p>{getPayButtonText()}</p>
                    </button>
                    {paymentError && (
                        <p className={styles.paymentError} role="alert">
                            {paymentError}
                        </p>
                    )}
                </div>
            )}
        </>
    );
};

export default Shipping;
