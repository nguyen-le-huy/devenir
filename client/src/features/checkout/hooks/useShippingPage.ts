import { useState, useEffect, useCallback } from "react";
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom";
import { useShippingAddress } from '@/features/checkout/hooks/useShipping';
import { useCart } from '@/features/cart/hooks/useCart';
import { validateGiftCode } from '@/features/checkout/api/giftCodeService';
import { ShippingMethod, DeliveryTime, PaymentMethodType } from '@/features/checkout/types';
import { PAYMENT_METHODS, GIFT_CODE_PRICES } from '@/features/checkout/constants';

import { useCheckoutCalculations } from './useCheckoutCalculations';
import { useCheckoutForm } from './useCheckoutForm';
import { usePaymentFlow } from './usePaymentFlow';

export const useShippingPage = () => {
    const navigate = useNavigate();

    // 1. Data Fetching (Server State)
    const { data: cartData } = useCart();
    const cart = cartData || { items: [], totalItems: 0, totalPrice: 0 };
    const { data: savedAddress } = useShippingAddress();

    // 2. Local State (Selection)
    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("");
    const [deliveryTime, setDeliveryTime] = useState<DeliveryTime>("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("");

    // Gift Code State
    const [giftCode, setGiftCode] = useState("");
    const [giftCodeApplied, setGiftCodeApplied] = useState(false);
    const [giftCodeError, setGiftCodeError] = useState("");

    // 3. Composed Hooks
    const {
        formData,
        showAddressForm,
        setShowAddressForm,
        handleInputChange,
        handleConfirmAddress
    } = useCheckoutForm({ savedAddress: savedAddress || null });

    const {
        cartTotal,
        shippingCharge,
        totalWithShipping,
        formattedCartTotal,
        formattedTotalWithShipping
    } = useCheckoutCalculations({ cart, deliveryTime });

    const {
        isProcessingPayment,
        paymentError,
        setPaymentError, // Exposed for external clearing if needed
        handlePay
    } = usePaymentFlow({
        shippingMethod,
        deliveryTime,
        savedAddress: savedAddress || null,
        showAddressForm,
        paymentMethod,
        giftCode,
        giftCodeApplied
    });

    // 4. Effects
    useEffect(() => {
        if (cartData && cart.items.length === 0) {
            navigate('/checkout');
        }
    }, [cart.items.length, cartData, navigate]);

    useEffect(() => {
        setPaymentError("");
    }, [paymentMethod, deliveryTime, shippingMethod, showAddressForm, setPaymentError]);

    // 5. Handlers
    const handleShippingMethodChange = useCallback((method: ShippingMethod) => {
        setShippingMethod(method);
        setDeliveryTime("");
        setShowAddressForm(false);
    }, [setShowAddressForm]);

    const handleDeliveryTimeChange = useCallback((time: DeliveryTime) => {
        setDeliveryTime(time);
        if (savedAddress) {
            setShowAddressForm(false);
        } else {
            setShowAddressForm(true);
        }
    }, [savedAddress, setShowAddressForm]);

    const handleEditAddress = () => setShowAddressForm(true);

    const handleApplyGiftCode = async () => {
        setGiftCodeError("");
        if (!giftCode.trim()) {
            setGiftCodeError("Please enter a gift code");
            return;
        }

        try {
            const result = await validateGiftCode(giftCode);
            if (result.valid) {
                setGiftCodeApplied(true);
                toast.success("Gift code applied!");
            } else {
                setGiftCodeApplied(false);
                setGiftCodeError("Invalid gift code");
            }
        } catch {
            setGiftCodeError("Error checking gift code");
        }
    };

    const handleRemoveGiftCode = () => {
        setGiftCode("");
        setGiftCodeApplied(false);
        setGiftCodeError("");
    };

    const getPayButtonText = () => {
        const platformName = paymentMethod === PAYMENT_METHODS.PAYOS ? "PayOS" : "NowPayments";
        if (isProcessingPayment) return `Redirecting to ${platformName}...`;

        if (giftCodeApplied) {
            return paymentMethod === PAYMENT_METHODS.PAYOS
                ? `Pay ${GIFT_CODE_PRICES.payos.formatted}`
                : `Pay ${GIFT_CODE_PRICES.nowpayments.formatted}`;
        }
        return paymentMethod === PAYMENT_METHODS.NOWPAYMENTS
            ? `Pay ${formattedTotalWithShipping} USDT`
            : `Pay USD ${formattedTotalWithShipping}`;
    };

    return {
        // Data
        cart,
        savedAddress: savedAddress || null,
        formData,

        // UI State
        showAddressForm,
        isProcessingPayment,
        paymentError,
        giftCodeError,

        // Selection
        shippingMethod,
        deliveryTime,
        paymentMethod,
        setPaymentMethod,
        giftCode,
        setGiftCode,
        giftCodeApplied,
        setGiftCodeError,

        // Calculations
        cartTotal,
        shippingCharge,
        totalWithShipping,
        formattedCartTotal,
        formattedTotalWithShipping,

        // Handlers
        handleShippingMethodChange,
        handleDeliveryTimeChange,
        handleInputChange,
        handleConfirmAddress,
        handleEditAddress,
        handleApplyGiftCode,
        handleRemoveGiftCode,
        handlePay,
        getPayButtonText
    };
};
