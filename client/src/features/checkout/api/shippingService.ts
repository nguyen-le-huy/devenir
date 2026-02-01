/**
 * Shipping API Service
 * Handles all shipping-related API calls
 */

import apiClient from '@/core/api/apiClient';
import type {
    ShippingAddress,
    ShippingAddressDTO,
} from '../types';
import { handleApiError, parseFullName } from '../utils';

/**
 * Transform frontend address format to backend request format
 * Backend expects: firstName, lastName, phoneNumber, address, city, district, zipCode
 * @param address - Frontend address format
 * @returns Backend request format
 */
const transformToBackendRequest = (address: ShippingAddress) => {
    return {
        firstName: address.firstName,
        lastName: address.lastName,
        phoneNumber: address.phoneNumber,
        address: address.address,
        city: address.city,
        district: address.district,
        zipCode: address.zipCode,
    };
};

/**
 * Transform backend DTO to frontend address format
 * Backend returns: fullName, phone, street, postalCode, city, district
 * @param dto - Backend DTO format
 * @returns Frontend address format
 */
const transformFromDTO = (dto: ShippingAddressDTO): ShippingAddress => {
    const { firstName, lastName } = parseFullName(dto.fullName);

    return {
        firstName,
        lastName,
        phoneNumber: dto.phone,
        address: dto.street,
        city: dto.city,
        district: dto.district,
        zipCode: dto.postalCode,
    };
};

/**
 * Save shipping address for the user
 * @param addressData - Address data to save (Frontend format)
 * @returns Saved address in frontend format
 * @throws Error if save fails
 */
export const saveShippingAddress = async (
    addressData: ShippingAddress
): Promise<ShippingAddress> => {
    try {
        const payload = transformToBackendRequest(addressData);

        // Backend returns { success: true, data: { fullName, phone, street, ... } }
        const response = await apiClient.post('/auth/shipping-address', payload);

        // Extract data from response
        const data = (response as { data?: ShippingAddressDTO }).data || response;

        return transformFromDTO(data as ShippingAddressDTO);
    } catch (error: unknown) {
        throw new Error(handleApiError(error, 'Failed to save shipping address'));
    }
};

/**
 * Get user's shipping address
 * @returns User's address or null if not found
 * @throws Error if fetch fails
 */
export const getShippingAddress = async (): Promise<ShippingAddress | null> => {
    try {
        const response = await apiClient.get('/auth/shipping-address');

        // Extract data from response
        const data = (response as { data?: ShippingAddressDTO }).data || response;

        if (data) {
            return transformFromDTO(data as ShippingAddressDTO);
        }

        return null;
    } catch (error: unknown) {
        // If 404, return null (no address saved yet)
        if (typeof error === 'object' && error !== null) {
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 404) {
                return null;
            }
        }

        throw new Error(handleApiError(error, 'Failed to get shipping address'));
    }
};

/**
 * Update shipping address
 * @param addressData - Updated address data (Frontend format)
 * @returns Updated address in frontend format
 * @throws Error if update fails
 */
export const updateShippingAddress = async (
    addressData: ShippingAddress
): Promise<ShippingAddress> => {
    try {
        const payload = transformToBackendRequest(addressData);

        const response = await apiClient.put('/auth/shipping-address', payload);

        // Extract data from response
        const data = (response as { data?: ShippingAddressDTO }).data || response;

        return transformFromDTO(data as ShippingAddressDTO);
    } catch (error: unknown) {
        throw new Error(handleApiError(error, 'Failed to update shipping address'));
    }
};

/**
 * Delete shipping address
 * @throws Error if delete fails
 */
export const deleteShippingAddress = async (): Promise<void> => {
    try {
        await apiClient.delete('/auth/shipping-address');
    } catch (error: unknown) {
        throw new Error(handleApiError(error, 'Failed to delete shipping address'));
    }
};
