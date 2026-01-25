import { memo } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './VisualSearch.module.css';
import Backdrop from '@/shared/components/Backdrop/Backdrop';
import { useVisualSearch } from '@/features/products/hooks/useVisualSearch';

interface VisualSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const VisualSearch = memo(({ isOpen, onClose }: VisualSearchProps) => {
    const {
        fileInputRef,
        imgRef,
        isDragging,
        isUploading,
        error,
        previewImage,
        isCropping,
        crop,
        setCrop,
        setCompletedCrop,
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
    } = useVisualSearch(isOpen, onClose);

    if (!isOpen) return null;

    return (
        <>
            <Backdrop isOpen={isOpen} onClick={handleClose} />
            <div className={styles.visualSearchContainer} data-lenis-prevent>
                <div className={styles.header}>
                    <h3>{isCropping ? 'Select Region' : 'Visual Search'}</h3>
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
                        <path d="M63.3334 50.6901V66.6667C63.3334 67.1088 63.1578 67.5327 62.8453 67.8453C62.5327 68.1578 62.1088 68.3334 61.6667 68.3334C61.2247 68.3334 60.8008 68.1578 60.4882 67.8453C60.1757 67.5327 60.0001 67.1088 60.0001 66.6667V50.6901L54.5134 56.1801C54.2005 56.493 53.776 56.6689 53.3334 56.6689C52.8908 56.6689 52.4664 56.493 52.1534 56.1801C51.8405 55.8671 51.6646 55.4427 51.6646 55.0001C51.6646 54.5575 51.8405 54.133 52.1534 53.8201L60.4867 45.4867C60.6416 45.3315 60.8255 45.2084 61.028 45.1244C61.2305 45.0404 61.4475 44.9971 61.6667 44.9971C61.886 44.9971 62.103 45.0404 62.3055 45.1244C62.508 45.2084 62.6919 45.3315 62.8467 45.4867L71.1801 53.8201C71.493 54.133 71.6689 54.5575 71.6689 55.0001C71.6689 55.4427 71.493 55.8671 71.1801 56.1801C70.8671 56.493 70.4427 56.6689 70.0001 56.6689C69.5575 56.6689 69.133 56.493 68.8201 56.1801L63.3334 50.6901ZM30.0001 21.6667C27.7899 21.6667 25.6703 22.5447 24.1075 24.1075C22.5447 25.6703 21.6667 27.7899 21.6667 30.0001C21.6667 32.2102 22.5447 34.3298 24.1075 35.8926C25.6703 37.4554 27.7899 38.3334 30.0001 38.3334C32.2102 38.3334 34.3298 37.4554 35.8926 35.8926C37.4554 34.3298 38.3334 32.2102 38.3334 30.0001C38.3334 27.7899 37.4554 25.6703 35.8926 24.1075C34.3298 22.5447 32.2102 21.6667 30.0001 21.6667ZM25.0001 30.0001C25.0001 28.674 25.5269 27.4022 26.4645 26.4645C27.4022 25.5269 28.674 25.0001 30.0001 25.0001C31.3262 25.0001 32.5979 25.5269 33.5356 26.4645C34.4733 27.4022 35.0001 28.674 35.0001 30.0001C35.0001 31.3262 34.4733 32.5979 33.5356 33.5356C32.5979 34.4733 31.3262 35.0001 30.0001 35.0001C28.674 35.0001 27.4022 34.4733 26.4645 33.5356C25.5269 32.5979 25.0001 31.3262 25.0001 30.0001Z" fill="#0E0E0E" />
                    </svg>
                    <div className={styles.content}>
                        {!isCropping ? (
                            <div
                                className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
                                onClick={handleClick}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/png,image/webp"
                                    style={{ display: 'none' }}
                                />
                                <p><span>Click to upload</span> or Drag & Drop</p>
                                <div className={styles.note}>
                                    <p>Supported formats: .jpeg, .png, .webp</p>
                                    <p>Maximum size file of 10mb.</p>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.cropArea}>
                                {previewImage && (
                                    <ReactCrop
                                        crop={crop}
                                        onChange={(c) => setCrop(c)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                        aspect={undefined}
                                    >
                                        <img
                                            ref={imgRef}
                                            src={previewImage}
                                            alt="Crop me"
                                            onLoad={handleImageLoad}
                                            style={{ maxHeight: '60vh', maxWidth: '100%' }}
                                        />
                                    </ReactCrop>
                                )}
                                <div className={styles.actions}>
                                    <button className={styles.backButton} onClick={handleBack}>
                                        Back
                                    </button>
                                    <button
                                        className={styles.searchButton}
                                        onClick={handleSearch}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className={styles.error}>
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
});

VisualSearch.displayName = 'VisualSearch';

export default VisualSearch;
