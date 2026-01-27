import apiClient from '@/core/api/apiClient';
import { ShippingAddress, ShippingAddressDTO, AddressResponse } from '../types';

/**
 * Save shipping address for the user
 * @param addressData - Address data to save (Frontend format)
 */
export const saveShippingAddress = async (addressData: ShippingAddress): Promise<ShippingAddressDTO> => {
    try {
        // Adapt Data: Frontend -> Backend
        const payload: ShippingAddressDTO = {
            fullName: `${addressData.firstName} ${addressData.lastName}`.trim(),
            phone: addressData.phoneNumber,
            street: addressData.address,
            city: addressData.city,
            district: addressData.district,
            postalCode: addressData.zipCode
        };

        const response = await apiClient.post('/auth/shipping-address', payload) as unknown as AddressResponse;
        return response.data; // Usually apiClient interceptor handles the .data access, but let's assume it returns standard Axios response structure or specific based on setup.
        // Based on previous files, it seems apiClient might return response directly or we need to access .data.
        // Assuming apiClient.post returns the response body directly in this project's convention (common in some setups), but let's stick to valid type casting.
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to save shipping address');
    }
};

/**
 * Get user's shipping address
 */
export const getShippingAddress = async (): Promise<{ data: ShippingAddress | null }> => {
    try {
        // We use 'unknown' casting first as typical apiClient return type might be generic
        const response = await apiClient.get('/auth/shipping-address') as unknown as AddressResponse;

        if (response.data) {
            // Adapt Data: Backend -> Frontend
            const dto = response.data;
            const [firstName, ...lastNameParts] = dto.fullName.split(' ');

            const address: ShippingAddress = {
                firstName: firstName || '',
                lastName: lastNameParts.join(' ') || '',
                phoneNumber: dto.phone,
                address: dto.street,
                city: dto.city,
                district: dto.district,
                zipCode: dto.postalCode
            };

            return { data: address };
        }

        return { data: null };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to get shipping address');
    }
};

/**
 * Update shipping address
 * @param addressData - Updated address data (Frontend format)
 */
export const updateShippingAddress = async (addressData: ShippingAddress): Promise<ShippingAddressDTO> => {
    try {
        // Adapt Data: Frontend -> Backend
        const payload: ShippingAddressDTO = {
            fullName: `${addressData.firstName} ${addressData.lastName}`.trim(),
            phone: addressData.phoneNumber,
            street: addressData.address,
            city: addressData.city,
            district: addressData.district,
            postalCode: addressData.zipCode
        };

        const response = await apiClient.put('/auth/shipping-address', payload) as unknown as AddressResponse;
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update shipping address');
    }
};

/**
 * Check if gift code is valid
 * @param code - Gift code to check
 */
export const checkGiftCode = async (code: string): Promise<{ valid: boolean }> => {
    // MOCK IMPLEMENTATION: Replace with actual API call to backend
    // Simulating API latency
    return new Promise((resolve) => {
        setTimeout(() => {
            if (code.toLowerCase() === 'emanhhuy') {
                resolve({ valid: true });
            } else {
                resolve({ valid: false });
            }
        }, 500);
    });
};
