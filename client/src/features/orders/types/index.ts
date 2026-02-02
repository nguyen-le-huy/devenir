export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

export interface IOrderItem {
    product: string; // Product ID
    name: string;
    quantity: number;
    price: number;
    variant?: string; // Variant ID
    variantName?: string;
    image?: string;
}

export interface IOrder {
    _id: string;
    user: string;
    orderItems: IOrderItem[];
    shippingAddress: {
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
    paymentMethod: string;
    paymentResult?: {
        id: string;
        status: string;
        update_time: string;
        email_address: string;
    };
    totalPrice: number;
    isPaid: boolean;
    paidAt?: string;
    isDelivered: boolean;
    deliveredAt?: string;
    shippedAt?: string;
    estimatedDelivery?: string;
    status: OrderStatus;
    trackingNumber?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IOrderFilters {
    page?: number;
    limit?: number;
    status?: OrderStatus;
}

export interface IOrderListResponse {
    data: IOrder[];
    total: number;
    page: number;
    pages: number;
}
