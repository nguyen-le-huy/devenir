import { useState, useRef, useCallback, ChangeEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLenisControl } from '@/shared/hooks/useLenisControl';
import { findSimilarProducts } from '@/features/products/api/imageSearchService';
import {
    validateImageFile,
    fileToBase64,
    getCroppedImageBase64,
    calculateInitialCrop,
} from '@/shared/utils/imageUtils';
import type { Crop } from 'react-image-crop';

/**
 * Visual Search Hook
 * Handles file upload, cropping, and image search functionality
 */

// ============================================
// Types
// ============================================

interface UseVisualSearchReturn {
    // Refs
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    imgRef: React.RefObject<HTMLImageElement | null>;
    // States
    isDragging: boolean;
    isUploading: boolean;
    error: string | null;
    previewImage: string | null;
    isCropping: boolean;
    crop: Crop | undefined;
    completedCrop: Crop | undefined;
    // Setters
    setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    setCompletedCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    // Handlers
    handleImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
    handleSearch: () => Promise<void>;
    handleClick: () => void;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleDragEnter: (e: DragEvent) => void;
    handleDragLeave: (e: DragEvent) => void;
    handleDragOver: (e: DragEvent) => void;
    handleDrop: (e: DragEvent) => void;
    handleBack: () => void;
    handleClose: () => void;
    handleReUpload: () => void;
}

interface VisualSearchResult {
    success: boolean;
    data: unknown[];
    count: number;
}

// ============================================
// Error Messages
// ============================================

const ERROR_MESSAGES = {
    NETWORK: 'Network error. Please check your connection.',
    SERVICE_UNAVAILABLE: 'Visual search service is temporarily unavailable.',
    IMAGE_TOO_LARGE: 'Image is too large. Please try a smaller image.',
    NO_RESULTS: 'No similar products found. Try another image or crop area.',
    CROP_FAILED: 'Failed to crop image',
    SEARCH_FAILED: 'Search failed. Please try again.',
    LOAD_FAILED: 'Failed to load image. Please try again.',
} as const;

// ============================================
// Hook Implementation
// ============================================

export const useVisualSearch = (
    isOpen: boolean,
    onClose: () => void
): UseVisualSearchReturn => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    // UI States
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Crop States
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState<Crop | undefined>(undefined);
    const [completedCrop, setCompletedCrop] = useState<Crop | undefined>(undefined);

    // Lock scroll when modal is open
    useLenisControl(isOpen);

    // Get cropped image
    const getCroppedImage = useCallback(() => {
        return getCroppedImageBase64(imgRef.current, completedCrop ?? null, previewImage);
    }, [completedCrop, previewImage]);

    // Handle image load - set initial crop
    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
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
            setCrop(undefined);
            setCompletedCrop(undefined);
        } catch {
            setError(ERROR_MESSAGES.LOAD_FAILED);
        }
    }, []);

    // Handle search
    const handleSearch = useCallback(async () => {
        if (!previewImage) return;

        setIsUploading(true);
        setIsCropping(false);

        try {
            const imageToSearch = getCroppedImage();

            if (!imageToSearch) {
                throw new Error(ERROR_MESSAGES.CROP_FAILED);
            }

            const result = (await findSimilarProducts(imageToSearch, 12)) as VisualSearchResult;

            if (result.success) {
                navigate('/visually-similar', {
                    state: {
                        uploadedImage: imageToSearch,
                        results: result.data,
                        count: result.count,
                    },
                });
                onClose();
            } else {
                setError(ERROR_MESSAGES.NO_RESULTS);
                setIsCropping(true);
            }
        } catch (err: unknown) {
            const error = err as { message?: string; status?: number };

            if (error.message === 'Network Error') {
                setError(ERROR_MESSAGES.NETWORK);
            } else if (error.status === 503) {
                setError(ERROR_MESSAGES.SERVICE_UNAVAILABLE);
            } else if (error.status === 413) {
                setError(ERROR_MESSAGES.IMAGE_TOO_LARGE);
            } else {
                setError(ERROR_MESSAGES.SEARCH_FAILED);
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

    const handleFileChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
        },
        [handleFileSelect]
    );

    const handleDragEnter = useCallback(
        (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isCropping) setIsDragging(true);
        },
        [isCropping]
    );

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (!isCropping) {
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
            }
        },
        [isCropping, handleFileSelect]
    );

    const handleBack = useCallback(() => {
        setIsCropping(false);
        setPreviewImage(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setError(null);
    }, []);

    const handleClose = useCallback(() => {
        setError(null);
        setPreviewImage(null);
        setIsUploading(false);
        setIsCropping(false);
        setCrop(undefined);
        setCompletedCrop(undefined);
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
        handleReUpload,
    };
};
