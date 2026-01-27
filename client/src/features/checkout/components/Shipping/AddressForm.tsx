import React from 'react';
import { ShippingAddress } from '@/features/checkout/types';
import styles from '@/features/checkout/pages/Checkout/Checkout.module.css';

interface AddressFormProps {
    formData: ShippingAddress;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onConfirm: (e: React.FormEvent) => void;
}

const AddressForm = ({ formData, onChange, onConfirm }: AddressFormProps) => {
    return (
        <div className={styles.shippingAddress}>
            <div className={styles.shippingTitleHeader}>
                <h2>Where would you like your parcel to be delivered?</h2>
                <p className={styles.requiredField}>*Required field</p>
            </div>
            <form onSubmit={onConfirm}>
                <div className={styles.formItem}>
                    <input
                        type="text"
                        id="firstName"
                        placeholder=" "
                        value={formData.firstName}
                        onChange={onChange}
                    />
                    <label htmlFor="firstName">First name*</label>
                </div>
                <div className={styles.formItem}>
                    <input
                        type="text"
                        id="lastName"
                        placeholder=" "
                        value={formData.lastName}
                        onChange={onChange}
                    />
                    <label htmlFor="lastName">Last name*</label>
                </div>
                <div className={styles.formItem}>
                    <input
                        type="text"
                        id="phoneNumber"
                        placeholder=" "
                        value={formData.phoneNumber}
                        onChange={onChange}
                    />
                    <label htmlFor="phoneNumber">Phone number*</label>
                </div>
                <div className={styles.formItem}>
                    <input
                        type="text"
                        id="address"
                        placeholder=" "
                        value={formData.address}
                        onChange={onChange}
                    />
                    <label htmlFor="address">Address*</label>
                </div>
                <div className={styles.formItem}>
                    <input
                        type="text"
                        id="city"
                        placeholder=" "
                        value={formData.city}
                        onChange={onChange}
                    />
                    <label htmlFor="city">City*</label>
                </div>
                <div className={styles.formItem}>
                    <input
                        type="text"
                        id="district"
                        placeholder=" "
                        value={formData.district}
                        onChange={onChange}
                    />
                    <label htmlFor="district">District*</label>
                </div>
                <div className={styles.formItem}>
                    <input
                        type="text"
                        id="zipCode"
                        placeholder=" "
                        value={formData.zipCode}
                        onChange={onChange}
                    />
                    <label htmlFor="zipCode">Zipcode*</label>
                </div>
            </form>
            <div className={styles.confirmButton} onClick={onConfirm}>
                <p>Confirm Address</p>
            </div>
        </div>
    );
};

export default AddressForm;
