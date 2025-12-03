import { API_BASE_URL } from '../config/api.js';

/**
 * Save shipping address for the user
 * @param {Object} addressData - Address data to save
 * @returns {Promise<Object>} Response from server
 */
export const saveShippingAddress = async (addressData) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/auth/shipping-address`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save shipping address');
    }

    return response.json();
};

/**
 * Get user's shipping address
 * @returns {Promise<Object>} User's shipping address
 */
export const getShippingAddress = async () => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/auth/shipping-address`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get shipping address');
    }

    const result = await response.json();

    // Transform backend data to frontend format
    if (result.data) {
        const [firstName, ...lastNameParts] = result.data.fullName.split(' ');
        return {
            ...result,
            data: {
                firstName: firstName || '',
                lastName: lastNameParts.join(' ') || '',
                phoneNumber: result.data.phone,
                address: result.data.street,
                city: result.data.city,
                district: result.data.district,
                zipCode: result.data.postalCode
            }
        };
    }

    return result;
};

/**
 * Update shipping address
 * @param {Object} addressData - Updated address data
 * @returns {Promise<Object>} Response from server
 */
export const updateShippingAddress = async (addressData) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/auth/shipping-address`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update shipping address');
    }

    return response.json();
};
