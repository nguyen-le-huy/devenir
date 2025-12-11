import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import styles from './CursorTrailer.module.css';

/**
 * CursorTrailer - Hiệu ứng cursor trail với hình ảnh
 * @param {React.RefObject} containerRef - Ref của container cần giới hạn phạm vi
 * @param {number} imageCount - Số lượng hình ảnh (1 đến imageCount)
 * @param {string} imageBasePath - Đường dẫn cơ sở của hình ảnh (ví dụ: '/trailer/trailer')
 * @param {string} imageExtension - Phần mở rộng của hình ảnh (ví dụ: '.png')
 */
const CursorTrailer = ({
    containerRef,
    imageCount = 11,
    imageBasePath = '/trailer/trailer',
    imageExtension = '.png'
}) => {
    const trailerRef = useRef(null);
    const currentImageIndexRef = useRef(0);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const lastImageTimeRef = useRef(Date.now());
    const isInsideRef = useRef(false);

    // Settings (tuned for small 25px images)
    const MOVEMENT_THRESHOLD = 40; // Spawn more frequently for smaller images
    const DELAY_BETWEEN = 40; // Faster spawn rate
    const IMAGE_SIZE = 25; // Width of images (height is auto)

    // Generate image URLs
    const imageUrls = Array.from({ length: imageCount }, (_, i) =>
        `${imageBasePath}${i + 1}${imageExtension}`
    );

    const createImageTrail = useCallback((e) => {
        if (!trailerRef.current || !isInsideRef.current) return;

        // Calculate distance from last spawned image
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Don't spawn if mouse hasn't moved far enough
        if (distance < MOVEMENT_THRESHOLD) return;

        // Don't spawn if not enough time has passed
        const now = Date.now();
        if (now - lastImageTimeRef.current < DELAY_BETWEEN) return;

        // Create new image element
        const img = document.createElement('img');
        img.src = imageUrls[currentImageIndexRef.current];
        img.className = styles.trailImage;
        img.alt = '';

        // Update index to use next image (loops around)
        currentImageIndexRef.current = (currentImageIndexRef.current + 1) % imageUrls.length;

        // Get container bounds for positioning
        const containerRect = containerRef?.current?.getBoundingClientRect();
        if (!containerRect) return;

        // Position the image centered on cursor, relative to container
        const x = e.clientX - containerRect.left - IMAGE_SIZE / 2;
        const y = e.clientY - containerRect.top - IMAGE_SIZE / 2;

        img.style.left = `${x}px`;
        img.style.top = `${y}px`;

        // Add the image to trailer container
        trailerRef.current.appendChild(img);

        // Animate the image appearing
        gsap.fromTo(img,
            {
                opacity: 0,
                scale: 0,
                rotation: gsap.utils.random(-15, 15)
            },
            {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.5)"
            }
        );

        // Animate the image falling down
        gsap.to(img, {
            y: 60, // Rơi xuống 60px
            rotation: gsap.utils.random(-30, 30), // Xoay thêm khi rơi
            duration: 0.6,
            delay: 0.3,
            ease: "power2.in", // Gia tốc như trọng lực
            onComplete: () => img.remove()
        });

        // Save current mouse position & time
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        lastImageTimeRef.current = now;
    }, [imageUrls, containerRef]);

    const handleMouseEnter = useCallback(() => {
        isInsideRef.current = true;
    }, []);

    const handleMouseLeave = useCallback(() => {
        isInsideRef.current = false;
    }, []);

    useEffect(() => {
        const container = containerRef?.current;
        if (!container) return;

        // Add event listeners
        container.addEventListener('mousemove', createImageTrail);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mousemove', createImageTrail);
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [containerRef, createImageTrail, handleMouseEnter, handleMouseLeave]);

    return (
        <div ref={trailerRef} className={styles.imageTrailer} />
    );
};

export default CursorTrailer;
