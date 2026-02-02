import { useMemo } from 'react';
import { SHIPPING_COSTS, DeliveryTimeValue } from '../constants';


interface UseCheckoutCalculationsProps {
    cart: { totalPrice: number }; // Only need totalPrice
    deliveryTime: DeliveryTimeValue | "";
}

export const useCheckoutCalculations = ({ cart, deliveryTime }: UseCheckoutCalculationsProps) => {
    const cartTotal = useMemo(() => Number(cart.totalPrice || 0), [cart.totalPrice]);

    const shippingCharge = useMemo(() => {
        if (!deliveryTime) return 0;
        return SHIPPING_COSTS[deliveryTime] || 0;
    }, [deliveryTime]);

    const totalWithShipping = useMemo(() => {
        return cartTotal + shippingCharge;
    }, [cartTotal, shippingCharge]);

    const formattedCartTotal = useMemo(() => cartTotal.toFixed(2), [cartTotal]);
    const formattedTotalWithShipping = useMemo(() => totalWithShipping.toFixed(2), [totalWithShipping]);

    return {
        cartTotal,
        shippingCharge,
        totalWithShipping,
        formattedCartTotal,
        formattedTotalWithShipping,
    };
};
