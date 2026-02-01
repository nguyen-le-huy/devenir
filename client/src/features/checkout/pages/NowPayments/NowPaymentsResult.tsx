import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import styles from "../PayOS/PayOSResult.module.css"; // Reuse PayOS styles
import { fetchNowPaymentsStatus } from "@/features/nowpayments";
import { cartKeys } from '@/features/cart/hooks/useCart';
import { DELIVERY_TIME_LABELS } from '@/features/checkout/constants';
import { logError, handleApiError } from '@/features/checkout/utils';
import type { PaymentOrderStatus } from '@/features/checkout/types';

const NowPaymentsResult = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");

    const [orderStatus, setOrderStatus] = useState<PaymentOrderStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [countdown, setCountdown] = useState<number | null>(null);

    const loadStatus = useCallback(async (showLoader = true) => {
        if (!orderId) {
            setOrderStatus(null);
            setErrorMessage("Missing order reference.");
            if (showLoader) {
                setIsLoading(false);
            } else {
                setIsRefreshing(false);
            }
            return;
        }

        try {
            if (showLoader) {
                setIsLoading(true);
            } else {
                setIsRefreshing(true);
            }

            const response = await fetchNowPaymentsStatus(orderId);
            if (!response?.success) {
                throw new Error(response?.message || "Unable to verify payment status.");
            }

            setOrderStatus(response.data);
            setErrorMessage("");
        } catch (error: unknown) {
            logError(error, 'loading NowPayments status');
            const errorMsg = handleApiError(error, 'Unable to verify payment status');
            setOrderStatus(null);
            setErrorMessage(errorMsg);
        } finally {
            if (showLoader) {
                setIsLoading(false);
            } else {
                setIsRefreshing(false);
            }
        }
    }, [orderId]);


    useEffect(() => {
        loadStatus(true);
    }, [loadStatus]);

    // Invalidate cart when payment is successful
    useEffect(() => {
        if (orderStatus?.status === "paid") {
            queryClient.invalidateQueries({ queryKey: cartKeys.all });
            setCountdown((prev) => (prev === null ? 8 : prev));
        }
    }, [orderStatus, queryClient]);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            navigate("/");
            return;
        }

        const timer = setTimeout(() => setCountdown((prev) => (prev !== null ? prev - 1 : 0)), 1000);
        return () => clearTimeout(timer);
    }, [countdown, navigate]);

    const statusType = useMemo(() => {
        if (errorMessage) return "failed";
        if (orderStatus?.status === "paid") return "success";
        if (orderStatus?.status === "cancelled") return "failed";
        return "pending";
    }, [errorMessage, orderStatus]);

    const statusCopy = useMemo(() => {
        switch (statusType) {
            case "success":
                return {
                    title: "Payment confirmed",
                    subtitle: "We emailed your receipt and our team is preparing the shipment."
                };
            case "failed":
                return {
                    title: "We couldn't verify the payment",
                    subtitle: errorMessage || "Please refresh the status or contact support if the charge went through."
                };
            default:
                return {
                    title: "Hold on while we confirm your payment",
                    subtitle: "Crypto payments may take a few minutes to confirm on the blockchain."
                };
        }
    }, [statusType, errorMessage]);

    const cardClassName = useMemo(() => {
        if (statusType === "success") return `${styles.card} ${styles.success}`;
        if (statusType === "failed") return `${styles.card} ${styles.failed}`;
        return `${styles.card} ${styles.pending}`;
    }, [statusType]);

    const paymentSummary = useMemo(() => {
        if (!orderStatus) return null;
        return [
            {
                label: "Order code",
                value: orderStatus.orderCode ? `#${orderStatus.orderCode}` : "—"
            },
            {
                label: "Total",
                value: `${orderStatus.totalPrice || 0} USDT`
            },
            {
                label: "Shipping",
                value: DELIVERY_TIME_LABELS[orderStatus.deliveryWindow] || "Home delivery"
            },
            {
                label: "Payment method",
                value: "NowPayments (USDT BSC)"
            }
        ];
    }, [orderStatus]);


    return (
        <section className={styles.wrapper}>
            <div className={cardClassName}>
                <p className={styles.statusTag}>
                    {statusType === "success" && "Paid"}
                    {statusType === "pending" && "Awaiting confirmation"}
                    {statusType === "failed" && "Action required"}
                </p>
                <h1 className={styles.title}>{statusCopy.title}</h1>
                <p className={styles.subtitle}>{statusCopy.subtitle}</p>

                {countdown !== null && statusType === "success" && (
                    <p className={styles.countdown}>Redirecting to the homepage in {countdown}s…</p>
                )}

                {isLoading && <p className={styles.loader}>Checking payment status…</p>}

                {!isLoading && paymentSummary && (
                    <div className={styles.summaryGrid}>
                        {paymentSummary.map((item) => (
                            <div key={item.label} className={styles.summaryItem}>
                                <p className={styles.summaryLabel}>{item.label}</p>
                                <p className={styles.summaryValue}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

                {orderStatus?.confirmationEmailSentAt && statusType === "success" && (
                    <p className={styles.subtitle}>
                        Confirmation email sent on {new Date(orderStatus.confirmationEmailSentAt).toLocaleString()}.
                    </p>
                )}

                <div className={styles.actions}>
                    <button className={styles.primaryAction} onClick={() => navigate("/")}>
                        Back to homepage
                    </button>
                    {statusType !== "success" && (
                        <button
                            className={styles.secondaryAction}
                            onClick={() => loadStatus(false)}
                            disabled={isRefreshing || isLoading}
                        >
                            {isRefreshing ? "Refreshing…" : "Refresh status"}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};

export default NowPaymentsResult;
