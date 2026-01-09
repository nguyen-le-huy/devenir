import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './VisualSearch.module.css';
import Backdrop from '../Backdrop';
import { useLenisControl } from '../../hooks/useLenisControl';
import { findSimilarProducts } from '../../services/imageSearchService';

const VisualSearch = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const imgRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    // Crop states
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState(null);
    const [completedCrop, setCompletedCrop] = useState(null);

    // Lock scroll when modal is open
    useLenisControl(isOpen);

    // Handle file validation
    const validateFile = useCallback((file) => {
        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return 'Please upload a JPEG, PNG, or WebP image.';
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return 'Image size must be less than 10MB.';
        }

        return null;
    }, []);

    // Convert file to base64
    const fileToBase64 = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }, []);

    // Get cropped image as base64
    const getCroppedImage = useCallback(() => {
        if (!imgRef.current || !completedCrop) {
            return previewImage;
        }

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return previewImage;
        }

        // Calculate crop area in actual image dimensions
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        // Set canvas dimensions to cropped area
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw the cropped portion
        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
        );

        // Return as base64 PNG
        return canvas.toDataURL('image/png');
    }, [completedCrop, previewImage]);

    // Handle image load - set default crop to full image
    const handleImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;

        // Set initial crop to center of image
        const cropSize = Math.min(width, height) * 0.8;
        const initialCrop = {
            unit: 'px',
            x: (width - cropSize) / 2,
            y: (height - cropSize) / 2,
            width: cropSize,
            height: cropSize
        };

        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
    }, []);

    // Handle file selection - show crop UI
    const handleFileSelect = useCallback(async (file) => {
        const validationError = validateFile(file);
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
    }, [validateFile, fileToBase64]);

    // Handle search with cropped image
    const handleSearch = useCallback(async () => {
        if (!previewImage) return;

        setIsUploading(true);
        setIsCropping(false);

        try {
            // Get the cropped image (or full image if no crop)
            const imageToSearch = getCroppedImage();


            const result = await findSimilarProducts(imageToSearch, 12);

            if (result.success) {


                // Navigate to VisuallySimilar page with results
                navigate('/visually-similar', {
                    state: {
                        uploadedImage: imageToSearch,
                        results: result.data,
                        count: result.count
                    }
                });

                // Close modal after navigation
                onClose();
            } else {
                setError('No similar products found. Try another image or crop area.');
                setIsCropping(true);
            }
        } catch (err) {
            console.error('❌ Image search failed:', err);
            setError(err.response?.data?.message || 'Search failed. Please try again.');
            setIsCropping(true);
        } finally {
            setIsUploading(false);
        }
    }, [previewImage, getCroppedImage, navigate, onClose]);

    // Handle click on upload area
    const handleClick = useCallback(() => {
        if (!isUploading && !isCropping) {
            fileInputRef.current?.click();
        }
    }, [isUploading, isCropping]);

    // Handle file input change
    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input value to allow re-upload of same file
        e.target.value = '';
    }, [handleFileSelect]);

    // Handle drag events
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isCropping) {
            setIsDragging(true);
        }
    }, [isCropping]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!isCropping) {
            const file = e.dataTransfer.files?.[0];
            if (file) {
                handleFileSelect(file);
            }
        }
    }, [isCropping, handleFileSelect]);

    // Handle back to re-select image
    const handleBack = useCallback(() => {
        setIsCropping(false);
        setPreviewImage(null);
        setCrop(null);
        setCompletedCrop(null);
        setError(null);
    }, []);

    // Handle close and reset state
    const handleClose = useCallback(() => {
        setError(null);
        setPreviewImage(null);
        setIsUploading(false);
        setIsCropping(false);
        setCrop(null);
        setCompletedCrop(null);
        onClose();
    }, [onClose]);

    // Handle re-upload (change image while cropping)
    const handleReUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    if (!isOpen) return null;

    return (
        <>
            <Backdrop isOpen={isOpen} onClick={handleClose} />
            <div className={styles.visualSearchContainer} data-lenis-prevent>
                <div className={styles.header}>
                    <h3>
                        {isCropping ? 'Select Region' : 'Visual Search'}
                    </h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        onClick={handleClose}
                        style={{ cursor: 'pointer' }}
                    >
                        <path d="M6.36875 7.10625L0.904167 12.5708C0.806944 12.6681 0.6875 12.7201 0.545833 12.7271C0.404166 12.734 0.277778 12.6819 0.166667 12.5708C0.0555554 12.4597 0 12.3368 0 12.2021C0 12.0674 0.0555554 11.9444 0.166667 11.8333L5.63125 6.36875L0.166667 0.904167C0.0694443 0.806944 0.0173609 0.6875 0.0104164 0.545833C0.00347196 0.404166 0.0555554 0.277778 0.166667 0.166667C0.277778 0.0555554 0.400694 0 0.535417 0C0.670139 0 0.793056 0.0555554 0.904167 0.166667L6.36875 5.63125L11.8333 0.166667C11.9306 0.0694443 12.0503 0.0173609 12.1927 0.0104164C12.3337 0.00347196 12.4597 0.0555554 12.5708 0.166667C12.6819 0.277778 12.7375 0.400694 12.7375 0.535417C12.7375 0.670139 12.6819 0.793056 12.5708 0.904167L7.10625 6.36875L12.5708 11.8333C12.6681 11.9306 12.7201 12.0503 12.7271 12.1927C12.734 12.3337 12.6819 12.4597 12.5708 12.5708C12.4597 12.6819 12.3368 12.7375 12.2021 12.7375C12.0674 12.7375 11.9444 12.6819 11.8333 12.5708L6.36875 7.10625Z" fill="#0E0E0E" />
                    </svg>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                {/* Crop Mode */}
                {isCropping && previewImage ? (
                    <div className={styles.cropContainer}>
                        <div className={styles.cropArea}>
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                className={styles.reactCrop}
                            >
                                <img
                                    ref={imgRef}
                                    src={previewImage}
                                    alt="Preview"
                                    onLoad={handleImageLoad}
                                    className={styles.cropImage}
                                />
                            </ReactCrop>
                        </div>

                        <div className={styles.cropInstructions}>
                            <p>Drag to select the area you want to search</p>
                        </div>

                        <div className={styles.cropActions}>
                            <button
                                className={styles.backButton}
                                onClick={handleBack}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>
                            <button
                                className={styles.reUploadButton}
                                onClick={handleReUpload}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Change Image
                            </button>
                            <button
                                className={styles.searchButton}
                                onClick={handleSearch}
                                disabled={!completedCrop}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                Search
                            </button>
                        </div>
                    </div>
                ) : isUploading ? (
                    /* Uploading/Searching State */
                    <div className={`${styles.input} ${styles.uploading}`}>
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="Preview"
                                className={styles.previewImage}
                            />
                        )}
                        <div className={styles.loadingContent}>
                            <div className={styles.spinner}></div>
                            <p>Searching for similar products...</p>
                        </div>
                    </div>
                ) : (
                    /* Upload Area */
                    <div
                        className={`${styles.input} ${isDragging ? styles.dragging : ''}`}
                        onClick={handleClick}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 80 80" fill="none">
                            <path d="M31.2566 11.6667H42.0766C45.7433 11.6667 48.6032 11.6667 50.8932 11.8534C53.2199 12.0434 55.1099 12.4367 56.8099 13.3001C59.6331 14.7383 61.9284 17.0336 63.3666 19.8567C64.2333 21.5567 64.6233 23.4467 64.8133 25.7734C64.9999 28.0634 64.9999 30.9201 64.9999 34.5901V34.6667C64.9999 35.1088 64.8243 35.5327 64.5118 35.8453C64.1992 36.1578 63.7753 36.3334 63.3333 36.3334C62.8912 36.3334 62.4673 36.1578 62.1547 35.8453C61.8422 35.5327 61.6666 35.1088 61.6666 34.6667C61.6666 30.9067 61.6666 28.1834 61.4899 26.0467C61.3166 23.9234 60.9832 22.5234 60.3966 21.3701C59.2779 19.1741 57.4926 17.3887 55.2966 16.2701C54.1433 15.6834 52.7433 15.3501 50.6233 15.1767C48.4833 15.0001 45.7599 15.0001 41.9999 15.0001H31.3333C27.5733 15.0001 24.8499 15.0001 22.7133 15.1767C20.5899 15.3501 19.1899 15.6834 18.0366 16.2701C15.8406 17.3887 14.0552 19.1741 12.9366 21.3701C12.3499 22.5234 12.0166 23.9234 11.8433 26.0467C11.6666 28.1834 11.6666 30.9067 11.6666 34.6667V47.3167C12.3336 46.5119 13.0319 45.7335 13.7599 44.9834C14.7499 43.9901 15.7266 43.2167 16.8999 42.7867C18.7479 42.1111 20.7753 42.1111 22.6233 42.7867C23.7966 43.2201 24.7766 43.9867 25.7633 44.9867C26.7299 45.9567 27.8233 47.2701 29.1866 48.9067L29.2366 48.9667C29.3355 49.086 29.4584 49.183 29.5974 49.2515C29.7364 49.3199 29.8883 49.3582 30.0432 49.3639C30.198 49.3696 30.3523 49.3425 30.4959 49.2844C30.6395 49.2263 30.7692 49.1385 30.8766 49.0267L40.9399 38.6067C41.9829 37.4902 43.0681 36.4138 44.1933 35.3801C45.1366 34.5534 46.0533 33.9167 47.1299 33.5601C48.8383 32.9915 50.6849 32.9915 52.3933 33.5601C53.7633 34.0134 54.8933 34.9301 56.1566 36.1434C56.3142 36.2953 56.4403 36.4768 56.5278 36.6774C56.6152 36.878 56.6623 37.0939 56.6663 37.3128C56.6704 37.5316 56.6312 37.7491 56.5512 37.9528C56.4712 38.1565 56.3518 38.3425 56.1999 38.5001C56.048 38.6577 55.8666 38.7838 55.6659 38.8713C55.4653 38.9587 55.2494 39.0058 55.0306 39.0098C54.8117 39.0139 54.5942 38.9747 54.3905 38.8947C54.1868 38.8147 54.0008 38.6953 53.8433 38.5434C52.6433 37.3901 51.9633 36.9267 51.3399 36.7201C50.3153 36.3792 49.2079 36.3792 48.1833 36.7201C47.7066 36.8801 47.1766 37.1967 46.3933 37.8867C45.5933 38.5867 44.6466 39.5667 43.2866 40.9734L33.2766 51.3401C32.8442 51.7889 32.322 52.1414 31.7442 52.3748C31.1663 52.6081 30.5458 52.717 29.923 52.6944C29.3002 52.6717 28.6892 52.5181 28.1298 52.2433C27.5704 51.9686 27.0753 51.5791 26.6766 51.1001C25.2499 49.3901 24.2466 48.1901 23.3966 47.3334C22.5566 46.4867 21.9866 46.1034 21.4766 45.9201C20.368 45.5148 19.1518 45.5148 18.0433 45.9201C17.5366 46.1034 16.9666 46.4867 16.1266 47.3334C15.2766 48.1901 14.2733 49.3901 12.8466 51.1001L12.6399 51.3501C12.1099 51.9834 12.0166 52.1134 11.9499 52.2501C11.8774 52.4039 11.8247 52.5663 11.7933 52.7334C11.7762 52.856 11.7728 52.9801 11.7833 53.1034C11.801 53.399 11.821 53.6823 11.8433 53.9534C12.0166 56.0767 12.3499 57.4767 12.9366 58.6301C14.0552 60.8261 15.8406 62.6114 18.0366 63.7301C19.1899 64.3167 20.5899 64.6501 22.7133 64.8234C24.8499 65.0001 27.5733 65.0001 31.3333 65.0001H46.6666C47.1086 65.0001 47.5325 65.1757 47.8451 65.4882C48.1577 65.8008 48.3333 66.2247 48.3333 66.6667C48.3333 67.1088 48.1577 67.5327 47.8451 67.8453C47.5325 68.1578 47.1086 68.3334 46.6666 68.3334H31.2566C27.5899 68.3334 24.7299 68.3334 22.4399 68.1467C20.1133 67.9567 18.2233 67.5634 16.5233 66.7001C13.7001 65.2619 11.4048 62.9666 9.96659 60.1434C9.07325 58.3901 8.68659 56.4301 8.49992 53.9967L8.49325 53.8934L8.45325 53.2267C8.33325 51.1167 8.33325 48.5601 8.33325 45.4101V34.5901C8.33325 30.9234 8.33325 28.0634 8.51992 25.7734C8.70992 23.4467 9.10325 21.5567 9.96659 19.8567C11.4048 17.0336 13.7001 14.7383 16.5233 13.3001C18.2233 12.4334 20.1133 12.0434 22.4399 11.8534C24.7333 11.6667 27.5866 11.6667 31.2566 11.6667Z" fill="#0E0E0E" />
                            <path d="M63.3334 50.6901V66.6667C63.3334 67.1088 63.1578 67.5327 62.8453 67.8453C62.5327 68.1578 62.1088 68.3334 61.6667 68.3334C61.2247 68.3334 60.8008 68.1578 60.4882 67.8453C60.1757 67.5327 60.0001 67.1088 60.0001 66.6667V50.6901L54.5134 56.1801C54.2005 56.493 53.776 56.6689 53.3334 56.6689C52.8908 56.6689 52.4664 56.493 52.1534 56.1801C51.8405 55.8671 51.6646 55.4427 51.6646 55.0001C51.6646 54.5575 51.8405 54.133 52.1534 53.8201L60.4867 45.4867C60.6416 45.3315 60.8255 45.2084 61.028 45.1244C61.2305 45.0404 61.4475 44.9971 61.6667 44.9971C61.886 44.9971 62.103 45.0404 62.3055 45.1244C62.508 45.2084 62.6919 45.3315 62.8467 45.4867L71.1801 53.8201C71.493 54.133 71.6689 54.5575 71.6689 55.0001C71.6689 55.4427 71.493 55.8671 71.1801 56.1801C70.8671 56.493 70.4427 56.6689 70.0001 56.6689C69.5575 56.6689 69.133 56.493 68.8201 56.1801L63.3334 50.6901ZM30.0001 21.6667C27.7899 21.6667 25.6703 22.5447 24.1075 24.1075C22.5447 25.6703 21.6667 27.7899 21.6667 30.0001C21.6667 32.2102 22.5447 34.3298 24.1075 35.8926C25.6703 37.4554 27.7899 38.3334 30.0001 38.3334C32.2102 38.3334 34.3298 37.4554 35.8926 35.8926C37.4554 34.3298 38.3334 32.2102 38.3334 30.0001C38.3334 27.7899 37.4554 25.6703 35.8926 24.1075C34.3298 22.5447 32.2102 21.6667 30.0001 21.6667ZM25.0001 30.0001C25.0001 28.674 25.5269 27.4022 26.4645 26.4645C27.4022 25.5269 28.674 25.0001 30.0001 25.0001C31.3262 25.0001 32.5979 25.5269 33.5356 26.4645C34.4733 27.4022 35.0001 28.674 35.0001 30.0001C35.0001 31.3262 34.4733 32.5979 33.5356 33.5356C32.5979 34.4733 31.3262 35.0001 30.0001 35.0001C28.674 35.0001 27.4022 34.4733 26.4645 33.5356C25.5269 32.5979 25.0001 31.3262 25.0001 30.0001Z" fill="#0E0E0E" />
                        </svg>
                        <div className={styles.content}>
                            <p><span>Click to upload</span> or Drag & Drop</p>
                            <div className={styles.note}>
                                <p>Supported formats: .jpeg, .png, .webp</p>
                                <p>Maximum size file of 10mb.</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default VisualSearch;
