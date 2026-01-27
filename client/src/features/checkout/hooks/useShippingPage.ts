import { useState, useEffect, useCallback } from "react";
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom";
import { useShippingAddress, useSaveShippingAddress, useUpdateShippingAddress } from '@/features/checkout/hooks/useShipping';
import { useCart } from '@/features/cart/hooks/useCart';
import { checkGiftCode } from '@/features/checkout/api/shippingService';
import { createPayOSPaymentSession } from "@/features/payos";
import { createNowPaymentsSession } from "@/features/nowpayments";
import { ShippingAddress, ShippingMethod, DeliveryTime, PaymentMethodType } from '@/features/checkout/types';

export const useShippingPage = () => {
    const navigate = useNavigate();

    // Data Fetching
    const { data: cartData } = useCart();
    const cart = cartData || { items: [], totalItems: 0, totalPrice: 0 };
    const { data: addressResponse } = useShippingAddress();
    const saveAddressMutation = useSaveShippingAddress();
    const updateAddressMutation = useUpdateShippingAddress();

    // UI State
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    // Selection State
    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("");
    const [deliveryTime, setDeliveryTime] = useState<DeliveryTime>("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("");

    // Gift Code State
    const [giftCode, setGiftCode] = useState("");
    const [giftCodeApplied, setGiftCodeApplied] = useState(false);
    const [giftCodeError, setGiftCodeError] = useState("");

    // Form Data
    const [formData, setFormData] = useState<ShippingAddress>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        address: "",
        city: "",
        district: "",
        zipCode: ""
    });

    // Calculated Values
    const cartTotal = Number(cart.totalPrice || 0);
    const shippingCharge = deliveryTime === "next" ? 5 : deliveryTime === "nominated" ? 10 : 0;
    const totalWithShipping = cartTotal + shippingCharge;
    const formattedCartTotal = cartTotal.toFixed(2);
    const formattedTotalWithShipping = totalWithShipping.toFixed(2);

    // Effects
    useEffect(() => {
        if ((addressResponse as any)?.data) {
            const address = (addressResponse as any).data;
            setSavedAddress(address);
            setFormData(address);
        }
    }, [addressResponse]);

    useEffect(() => {
        if (cartData && cart.items.length === 0) {
            navigate('/checkout');
        }
    }, [cart.items.length, cartData, navigate]);

    useEffect(() => {
        setPaymentError("");
    }, [paymentMethod, deliveryTime, shippingMethod, showAddressForm]);


    // Handlers
    const handleShippingMethodChange = useCallback((method: ShippingMethod) => {
        setShippingMethod(method);
        setDeliveryTime("");
        setShowAddressForm(false);
    }, []);

    const handleDeliveryTimeChange = useCallback((time: DeliveryTime) => {
        setDeliveryTime(time);
        if (savedAddress) {
            setShowAddressForm(false);
        } else {
            setShowAddressForm(true);
        }
    }, [savedAddress]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    }, []);

    const handleConfirmAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        const isValid = Object.values(formData).every(value => value.trim() !== "");
        if (!isValid) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            if (savedAddress) {
                await updateAddressMutation.mutateAsync(formData);
            } else {
                await saveAddressMutation.mutateAsync(formData);
            }
            setSavedAddress({ ...formData });
            setShowAddressForm(false);
            setPaymentError("");
        } catch (error: any) {
            console.error("Error saving address:", error);
            toast.error(error.message || "Failed to save address.");
        }
    };

    const handleEditAddress = () => setShowAddressForm(true);

    const handleApplyGiftCode = async () => {
        setGiftCodeError("");
        if (!giftCode.trim()) {
            setGiftCodeError("Please enter a gift code");
            return;
        }

        try {
            const { valid } = await checkGiftCode(giftCode);
            if (valid) {
                setGiftCodeApplied(true);
                toast.success("Gift code applied!");
            } else {
                setGiftCodeApplied(false);
                setGiftCodeError("Invalid gift code");
            }
        } catch (error) {
            setGiftCodeError("Error checking gift code");
        }
    };

    const handleRemoveGiftCode = () => {
        setGiftCode("");
        setGiftCodeApplied(false);
        setGiftCodeError("");
    };

    const handlePay = async () => {
        if (isProcessingPayment) return;
        setPaymentError("");

        // Validations
        if (shippingMethod !== "home") return setPaymentError(`${paymentMethod === 'payos' ? 'PayOS' : 'NowPayments'} is available for home delivery only.`);
        if (!deliveryTime) return setPaymentError("Please choose a delivery time before paying.");
        if (!savedAddress) {
            setShowAddressForm(true);
            return setPaymentError("Please confirm your shipping address to continue.");
        }

        const platformName = paymentMethod === 'payos' ? 'PayOS' : 'NowPayments';
        if (paymentMethod !== "payos" && paymentMethod !== "nowpayments") {
            return setPaymentError("Please select a valid payment method.");
        }

        try {
            setIsProcessingPayment(true);
            const commonPayload = {
                shippingMethod,
                deliveryTime,
                address: savedAddress,
                giftCode: giftCodeApplied ? giftCode : undefined,
            };

            let response;
            if (paymentMethod === 'payos') {
                response = await createPayOSPaymentSession(commonPayload);
            } else {
                response = await createNowPaymentsSession(commonPayload);
            }

            // Handle Response
            // Normalize response check since different gateways might return different structures, 
            // but here we align with the logic from original component.
            const url = response?.data?.checkoutUrl || response?.checkoutUrl || response?.data?.invoiceUrl;

            if ((response?.success || response?.checkoutUrl || response?.data?.invoiceUrl) && url) {
                window.location.href = url;
                return;
            }

            throw new Error(response?.message || `Failed to start ${platformName} payment.`);

        } catch (error: any) {
            console.error(`${platformName} payment error:`, error);
            setPaymentError(error.message || `Failed to start payment.`);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const getPayButtonText = () => {
        const platformName = paymentMethod === "payos" ? "PayOS" : "NowPayments";
        if (isProcessingPayment) return `Redirecting to ${platformName}...`;

        if (giftCodeApplied) {
            return paymentMethod === "payos" ? "Pay 5,000 VND" : "Pay 0.1 USDT";
        }
        return paymentMethod === "nowpayments"
            ? `Pay ${formattedTotalWithShipping} USDT`
            : `Pay USD ${formattedTotalWithShipping}`;
    };

    return {
        cart,
        savedAddress,
        showAddressForm,
        isProcessingPayment,
        paymentError,
        shippingMethod,
        deliveryTime,
        paymentMethod,
        setPaymentMethod,
        giftCode,
        setGiftCode,
        giftCodeApplied,
        giftCodeError,
        setGiftCodeError, // exported if needed by subcomponents
        formData,
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
