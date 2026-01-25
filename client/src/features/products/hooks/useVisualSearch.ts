import { useState, useRef, useCallback, ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLenisControl } from '@/shared/hooks/useLenisControl';
import { findSimilarProducts } from '@/features/products/api/imageSearchService';
import {
    validateImageFile,
    fileToBase64,
    getCroppedImageBase64,
    calculateInitialCrop
} from '@/shared/utils/imageUtils';

/**
 * Custom hook for Visual Search logic
 * Handles file upload, cropping, and search functionality
 */
export const useVisualSearch = (isOpen: boolean, onClose: () => void) => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // UI States
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Crop States
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState<any>(null);
    const [completedCrop, setCompletedCrop] = useState<any>(null);

    // Lock scroll when modal is open
    useLenisControl(isOpen);

    // Get cropped image
    const getCroppedImage = useCallback(() => {
        return getCroppedImageBase64(imgRef.current, completedCrop, previewImage);
    }, [completedCrop, previewImage]);

    // Handle image load - set initial crop
    const handleImageLoad = useCallback((e: any) => {
        const { width, height } = e.currentTarget;
        const initialCrop = calculateInitialCrop(width, height);
        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback(async (file: File) => {
        const validationError = validateImageFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);

        try {
            const base64Image = await fileToBase64(file);
            setPreviewImage(base64Image);
            setIsCropping(true);
            setCrop(null);
            setCompletedCrop(null);
        } catch (err) {
            console.error('❌ Failed to load image:', err);
            setError('Failed to load image. Please try again.');
        }
    }, []);

    // Handle search
    const handleSearch = useCallback(async () => {
        if (!previewImage) return;

        setIsUploading(true);
        setIsCropping(false);

        try {
            const imageToSearch = getCroppedImage();
            console.log('🔍 Starting Visual Search...');

            if (!imageToSearch) throw new Error('Failed to crop image');

            const result = await findSimilarProducts(imageToSearch, 12);

            if (result.success) {
                navigate('/visually-similar', {
                    state: {
                        uploadedImage: imageToSearch,
                        results: result.data,
                        count: result.count
                    }
                });
                onClose();
            } else {
                setError('No similar products found. Try another image or crop area.');
                setIsCropping(true);
            }
        } catch (err: any) {
            console.error('❌ Image search failed:', err);

            if (err.message === 'Network Error') {
                setError('Network error. Please check your connection.');
            } else if (err.status === 503) {
                setError('Visual search service is temporarily unavailable.');
            } else if (err.status === 413) {
                setError('Image is too large. Please try a smaller image.');
            } else {
                setError('Search failed. Please try again.');
            }
            setIsCropping(true);
        } finally {
            setIsUploading(false);
        }
    }, [previewImage, getCroppedImage, navigate, onClose]);

    // UI Handlers
    const handleClick = useCallback(() => {
        if (!isUploading && !isCropping) {
            fileInputRef.current?.click();
        }
    }, [isUploading, isCropping]);

    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        e.target.value = '';
    }, [handleFileSelect]);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isCropping) setIsDragging(true);
    }, [isCropping]);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!isCropping) {
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileSelect(file);
        }
    }, [isCropping, handleFileSelect]);

    const handleBack = useCallback(() => {
        setIsCropping(false);
        setPreviewImage(null);
        setCrop(null);
        setCompletedCrop(null);
        setError(null);
    }, []);

    const handleClose = useCallback(() => {
        setError(null);
        setPreviewImage(null);
        setIsUploading(false);
        setIsCropping(false);
        setCrop(null);
        setCompletedCrop(null);
        onClose();
    }, [onClose]);

    const handleReUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
        // Refs
        fileInputRef,
        imgRef,
        // States
        isDragging,
        isUploading,
        error,
        previewImage,
        isCropping,
        crop,
        completedCrop,
        // Setters
        setCrop,
        setCompletedCrop,
        // Handlers
        handleImageLoad,
        handleSearch,
        handleClick,
        handleFileChange,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        handleBack,
        handleClose,
        handleReUpload
    };
};
