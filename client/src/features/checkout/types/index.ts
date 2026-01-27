export interface ShippingAddressDTO {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    district: string;
    postalCode: string;
}

export interface ShippingAddress {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    city: string;
    district: string;
    zipCode: string;
}

export interface AddressResponse {
    success: boolean;
    data: ShippingAddressDTO;
}

export interface RecommendedProduct {
    id: string;
    name: string;
    price: number;
    image: string;
    imageHover: string;
    color: string;
    size: string;
    sku: string;
}

export type ShippingMethod = 'home' | 'store' | '';
export type DeliveryTime = 'standard' | 'next' | 'nominated' | '';
export type PaymentMethodType = 'payos' | 'nowpayments' | '';

export interface GiftCodeStatus {
    code: string;
    applied: boolean;
    error: string;
}
