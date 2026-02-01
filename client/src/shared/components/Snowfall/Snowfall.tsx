import { useRef, memo, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SnowfallProps {
    snowflakeCount?: number;
    speed?: number;
    minSize?: number;
    maxSize?: number;
    wind?: boolean;
    windSpeed?: number;
}

/**
 * Snowfall Component - Realistic snow animation using SVG and GSAP
 */
const Snowfall = memo(({
    snowflakeCount = 50,
    speed = 1,
    minSize = 10,
    maxSize = 25,
    wind = true,
    windSpeed = 0.5
}: SnowfallProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Create array for rendering snowflakes
    const snowflakes = useMemo(() => Array.from({ length: snowflakeCount }), [snowflakeCount]);

    useGSAP(() => {
        const flakes = gsap.utils.toArray<HTMLElement>('.snowflake');
        const container = containerRef.current;

        if (!container) return;

        let containerWidth = container.offsetWidth;
        let containerHeight = container.offsetHeight;

        const updateDimensions = () => {
            containerWidth = container.offsetWidth;
            containerHeight = container.offsetHeight;
        };

        window.addEventListener('resize', updateDimensions);

        flakes.forEach(flake => {
            // Initial Random Properties
            const size = gsap.utils.random(minSize, maxSize);
            const opacity = gsap.utils.random(0.4, 1);
            const initialX = gsap.utils.random(0, containerWidth);
            // Start above the container (hidden)
            const initialY = gsap.utils.random(-size * 2, -size);

            // Set initial styles
            gsap.set(flake, {
                width: size,
                height: size,
                x: initialX,
                y: initialY,
                opacity: opacity,
                scale: gsap.utils.random(0.8, 1.2)
            });



            // Falling Animation - duration based on container height for smooth effect
            // For small containers like topBar (~35px), use shorter duration (1.5-3s)
            // For larger containers, use longer duration
            const baseDuration = Math.max(1.5, Math.min(containerHeight / 20, 4));
            const fallDuration = gsap.utils.random(baseDuration, baseDuration * 2) / speed;

            gsap.to(flake, {
                y: containerHeight + size,
                duration: fallDuration,
                ease: "none",
                repeat: -1,
                delay: gsap.utils.random(0, fallDuration), // Stagger start times
                onRepeat: () => {
                    // Reset to top with new random X position
                    gsap.set(flake, {
                        x: gsap.utils.random(0, containerWidth),
                        y: -size,
                        opacity: gsap.utils.random(0.4, 1)
                    });
                }
            });

            // Gentle horizontal sway animation (wind effect)
            const swayAmount = gsap.utils.random(10, 30) + (wind ? Math.abs(windSpeed) * 20 : 0);
            const swayDirection = wind ? (windSpeed > 0 ? 1 : -1) : (Math.random() > 0.5 ? 1 : -1);

            gsap.to(flake, {
                x: `+=${swayAmount * swayDirection}`,
                duration: gsap.utils.random(1.5, 3),
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                delay: gsap.utils.random(0, 2)
            });
        });

        return () => window.removeEventListener('resize', updateDimensions);

    }, { scope: containerRef, dependencies: [snowflakeCount, speed, minSize, maxSize, wind, windSpeed] });

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
                overflow: 'hidden'
            }}
        >
            {snowflakes.map((_, index) => (
                <img
                    key={index}
                    src="/snowflake.svg"
                    alt="snowflake"
                    className="snowflake"
                    style={{
                        position: 'absolute',
                        willChange: 'transform',
                        userSelect: 'none'
                    }}
                />
            ))}
        </div>
    );
});

Snowfall.displayName = 'Snowfall';

export default Snowfall;
