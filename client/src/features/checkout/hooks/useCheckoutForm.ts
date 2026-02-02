import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ShippingAddress } from '../types';
import { useSaveShippingAddress, useUpdateShippingAddress } from './useShipping';

interface UseCheckoutFormProps {
    savedAddress: ShippingAddress | null;
}

export const useCheckoutForm = ({ savedAddress }: UseCheckoutFormProps) => {
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [formData, setFormData] = useState<ShippingAddress>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        address: "",
        city: "",
        district: "",
        zipCode: ""
    });

    const saveAddressMutation = useSaveShippingAddress();
    const updateAddressMutation = useUpdateShippingAddress();

    // Initialize form with saved address when available
    useEffect(() => {
        if (savedAddress) {
            setFormData(savedAddress);
            // If we have a saved address, we don't need to show the form initially
            // But if the parent logic wants to show it (e.g. edit mode), specific handler will toggle it
        } else {
            // No saved address, show form by default? Or let parent decide.
            // keeping it false by default to match original logic, or true if needed.
            // Original logic: if (savedAddress) setShowAddressForm(false) else setShowAddressForm(true) on delivery change.
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
            return false;
        }

        try {
            if (savedAddress) {
                await updateAddressMutation.mutateAsync(formData);
            } else {
                await saveAddressMutation.mutateAsync(formData);
            }
            setShowAddressForm(false);
            return true;
        } catch (error: any) {
            // Error is already logged in mutation, but we might want to show toast here if mutation doesn't
            console.error("Error saving address:", error);
            toast.error(error.message || "Failed to save address.");
            return false;
        }
    };

    return {
        formData,
        setFormData,
        showAddressForm,
        setShowAddressForm,
        handleInputChange,
        handleConfirmAddress,
        isSaving: saveAddressMutation.isPending || updateAddressMutation.isPending
    };
};
