import { useRef, useEffect, memo } from 'react';

/**
 * Snowfall Component - Realistic snow animation using HTML5 Canvas
 * 
 * @param {number} snowflakeCount - Number of snowflakes (default: 100)
 * @param {number} speed - Fall speed multiplier (default: 1)
 * @param {number} minSize - Minimum snowflake size in px (default: 1)
 * @param {number} maxSize - Maximum snowflake size in px (default: 3)
 * @param {string} color - Snowflake color (default: 'rgba(255, 255, 255, 0.8)')
 * @param {boolean} wind - Enable wind effect (default: true)
 * @param {number} windSpeed - Wind speed (-2 to 2, default: 0.5)
 */
const Snowfall = memo(({
    snowflakeCount = 100,
    speed = 1,
    minSize = 1,
    maxSize = 3,
    color = 'rgba(255, 255, 255, 0.8)',
    wind = true,
    windSpeed = 0.5
}) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const snowflakesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;

        // Set canvas size
        const setCanvasSize = () => {
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };

        setCanvasSize();

        // Create snowflake class
        class Snowflake {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                // Random position
                this.x = Math.random() * width;
                this.y = initial ? Math.random() * height : -10;

                // Size with slight variation
                this.size = Math.random() * (maxSize - minSize) + minSize;

                // Speed based on size (larger = faster for parallax effect)
                this.speedY = (Math.random() * 1 + 0.5) * speed * (this.size / maxSize + 0.5);
                this.speedX = 0;

                // Opacity based on size (larger = more opaque)
                this.opacity = Math.random() * 0.5 + 0.3 + (this.size / maxSize) * 0.2;

                // Wobble effect
                this.wobbleAngle = Math.random() * Math.PI * 2;
                this.wobbleSpeed = Math.random() * 0.02 + 0.01;
                this.wobbleAmplitude = Math.random() * 1 + 0.5;

                // Wind response (smaller flakes affected more)
                this.windFactor = 1 - (this.size / maxSize) * 0.5;
            }

            update(windOffset) {
                // Wobble movement
                this.wobbleAngle += this.wobbleSpeed;
                const wobble = Math.sin(this.wobbleAngle) * this.wobbleAmplitude;

                // Apply wind
                if (wind) {
                    this.speedX = windOffset * this.windFactor + wobble * 0.3;
                } else {
                    this.speedX = wobble * 0.3;
                }

                // Update position
                this.x += this.speedX;
                this.y += this.speedY;

                // Wrap around horizontally
                if (this.x > width + 10) {
                    this.x = -10;
                } else if (this.x < -10) {
                    this.x = width + 10;
                }

                // Reset when off bottom
                if (this.y > height + 10) {
                    this.reset();
                }
            }

            draw(ctx) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = this.opacity;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Initialize snowflakes
        snowflakesRef.current = Array.from(
            { length: snowflakeCount },
            () => new Snowflake()
        );

        // Wind simulation
        let currentWind = 0;
        let targetWind = windSpeed;
        let windChangeTimer = 0;

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Smoothly interpolate wind
            windChangeTimer++;
            if (windChangeTimer > 200) {
                targetWind = (Math.random() - 0.3) * windSpeed * 2;
                windChangeTimer = 0;
            }
            currentWind += (targetWind - currentWind) * 0.01;

            // Update and draw each snowflake
            snowflakesRef.current.forEach(flake => {
                flake.update(currentWind);
                flake.draw(ctx);
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        animate();

        // Handle resize
        const handleResize = () => {
            setCanvasSize();
            // Redistribute snowflakes on resize
            snowflakesRef.current.forEach(flake => {
                if (flake.x > width) flake.x = Math.random() * width;
            });
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [snowflakeCount, speed, minSize, maxSize, color, wind, windSpeed]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1
            }}
        />
    );
});

Snowfall.displayName = 'Snowfall';

export default Snowfall;
