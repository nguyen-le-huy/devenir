import apiClient from './api';

/**
 * Save shipping address for the user
 * @param {Object} addressData - Address data to save
 * @returns {Promise<Object>} Response from server
 */
export const saveShippingAddress = async (addressData) => {
    try {
        const response = await apiClient.post('/auth/shipping-address', addressData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to save shipping address');
    }
};

/**
 * Get user's shipping address
 * @returns {Promise<Object>} User's shipping address
 */
export const getShippingAddress = async () => {
    try {
        const response = await apiClient.get('/auth/shipping-address');
        const result = response.data;

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
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to get shipping address');
    }
};

/**
 * Update shipping address
 * @param {Object} addressData - Updated address data
 * @returns {Promise<Object>} Response from server
 */
export const updateShippingAddress = async (addressData) => {
    try {
        const response = await apiClient.put('/auth/shipping-address', addressData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update shipping address');
    }
};
