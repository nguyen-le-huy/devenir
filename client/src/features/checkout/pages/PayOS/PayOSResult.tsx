import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./PayOSResult.module.css";
import { fetchPayOSOrderStatus } from "@/features/payos";
import { queryKeys } from '@/core/lib/queryClient';
import { logError, handleApiError } from '@/features/checkout/utils';

const PayOSResult = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const orderCode = searchParams.get("orderCode");

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const loadStatus = useCallback(async () => {
        if (!orderCode) {
            setErrorMessage("Missing order reference.");
            setIsLoading(false);
            // Navigate to failed page if no order code
            navigate("/payment-failed", {
                state: {
                    errorMessage: "Missing order reference.",
                    paymentMethod: "PayOS"
                },
                replace: true
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetchPayOSOrderStatus(orderCode);

            // Handle both response structures: { success, data } or direct data
            const orderStatus = response?.data || response;
            const isSuccess = response?.success !== false;

            if (!isSuccess && !orderStatus?.status) {
                throw new Error(response?.message || "Unable to verify payment status.");
            }

            // Check payment status and redirect accordingly
            if (orderStatus?.status === "paid") {
                // Clear cart cache so it refetches with empty cart
                queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });

                // Navigate to success page with order details
                navigate("/payment-successful", {
                    state: {
                        orderCode: orderStatus.orderCode,
                        totalPrice: orderStatus.totalPrice,
                        deliveryWindow: orderStatus.deliveryWindow,
                        paymentMethod: orderStatus.paymentMethod || "PayOS",
                        confirmationEmailSentAt: orderStatus.confirmationEmailSentAt
                    },
                    replace: true
                });
            } else if (orderStatus?.status === "cancelled") {
                // Navigate to failed page
                navigate("/payment-failed", {
                    state: {
                        orderCode: orderStatus.orderCode,
                        errorMessage: "Payment was cancelled.",
                        paymentMethod: orderStatus.paymentMethod || "PayOS"
                    },
                    replace: true
                });
            } else {
                // Still pending - stay on this page and show loading
                setIsLoading(false);
            }
        } catch (error: unknown) {
            logError(error, 'loading PayOS status');
            const errorMsg = handleApiError(error, 'Unable to verify payment status');
            setErrorMessage(errorMsg);
            setIsLoading(false);

            // Navigate to failed page on error
            navigate("/payment-failed", {
                state: {
                    orderCode: orderCode,
                    errorMessage: errorMsg,
                    paymentMethod: "PayOS"
                },
                replace: true
            });
        }
    }, [orderCode, navigate, queryClient]);


    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    // Auto-retry for pending status
    useEffect(() => {
        if (!isLoading && !errorMessage) {
            // If we're here, status is still pending, retry after 3 seconds
            const timer = setTimeout(() => {
                loadStatus();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, errorMessage, loadStatus]);

    return (
        <section className={styles.wrapper}>
            <div className={`${styles.card} ${styles.pending}`}>
                <p className={styles.statusTag}>Awaiting confirmation</p>
                <h1 className={styles.title}>Hold on while we confirm your payment</h1>
                <p className={styles.subtitle}>
                    This usually takes a few seconds. Please wait...
                </p>
                <p className={styles.loader}>Checking payment status…</p>
            </div>
        </section>
    );
};

export default PayOSResult;
