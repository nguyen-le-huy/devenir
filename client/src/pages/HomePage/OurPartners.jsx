import styles from './OurPartners.module.css';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Draggable } from 'gsap/Draggable';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(SplitText, ScrambleTextPlugin, Draggable, useGSAP);

const OurPartners = () => {
    const titleRef = useRef(null);
    const containerRef = useRef(null);
    const logosContainerRef = useRef(null);
    const loopRef = useRef(null);

    const partners = [
        { id: 1, src: '/images/partner1.svg', alt: 'Partner 1' },
        { id: 2, src: '/images/partner2.svg', alt: 'Partner 2' },
        { id: 3, src: '/images/partner3.svg', alt: 'Partner 3' },
        { id: 4, src: '/images/partner4.svg', alt: 'Partner 4' },
        { id: 5, src: '/images/partner5.svg', alt: 'Partner 5' },
        { id: 6, src: '/images/partner6.svg', alt: 'Partner 6' },
    ];

    // GSAP Horizontal Loop with Drag
    useGSAP(() => {
        const container = logosContainerRef.current;
        if (!container) return;

        const logos = gsap.utils.toArray(container.querySelectorAll(`.${styles.logoItem}`));
        if (logos.length === 0) return;

        // Calculate logo width
        const logoWidth = 250; // max-width from CSS
        const gap = 100;

        // Set initial positions
        gsap.set(logos, {
            x: (i) => i * (logoWidth + gap)
        });

        // Horizontal loop function
        const horizontalLoop = (items, config) => {
            items = gsap.utils.toArray(items);
            config = config || {};

            let tl = gsap.timeline({
                repeat: config.repeat,
                paused: config.paused,
                defaults: { ease: "none" },
                onReverseComplete: () =>
                    tl.totalTime(tl.rawTime() + tl.duration() * 100)
            }),
                length = items.length,
                startX = items[0].offsetLeft,
                times = [],
                widths = [],
                xPercents = [],
                curIndex = 0,
                pixelsPerSecond = (config.speed || 1) * 100,
                snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
                populateWidths = () =>
                    items.forEach((el, i) => {
                        widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
                        xPercents[i] = snap(
                            (parseFloat(gsap.getProperty(el, "x", "px")) / widths[i]) * 100 +
                            gsap.getProperty(el, "xPercent")
                        );
                    }),
                getTotalWidth = () =>
                    items[length - 1].offsetLeft +
                    (xPercents[length - 1] / 100) * widths[length - 1] -
                    startX +
                    items[length - 1].offsetWidth *
                    gsap.getProperty(items[length - 1], "scaleX") +
                    (parseFloat(config.paddingRight) || 0),
                totalWidth,
                curX,
                distanceToStart,
                distanceToLoop,
                item,
                i;

            populateWidths();
            gsap.set(items, {
                xPercent: (i) => xPercents[i]
            });
            gsap.set(items, { x: 0 });
            totalWidth = getTotalWidth();

            for (i = 0; i < length; i++) {
                item = items[i];
                curX = (xPercents[i] / 100) * widths[i];
                distanceToStart = item.offsetLeft + curX - startX;
                distanceToLoop =
                    distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
                tl.to(
                    item,
                    {
                        xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
                        duration: distanceToLoop / pixelsPerSecond
                    },
                    0
                )
                    .fromTo(
                        item,
                        {
                            xPercent: snap(
                                ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
                            )
                        },
                        {
                            xPercent: xPercents[i],
                            duration:
                                (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
                            immediateRender: false
                        },
                        distanceToLoop / pixelsPerSecond
                    )
                    .add("label" + i, distanceToStart / pixelsPerSecond);
                times[i] = distanceToStart / pixelsPerSecond;
            }

            function toIndex(index, vars) {
                vars = vars || {};
                Math.abs(index - curIndex) > length / 2 &&
                    (index += index > curIndex ? -length : length);
                let newIndex = gsap.utils.wrap(0, length, index),
                    time = times[newIndex];
                if (time > tl.time() !== index > curIndex) {
                    vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
                    time += tl.duration() * (index > curIndex ? 1 : -1);
                }
                curIndex = newIndex;
                vars.overwrite = true;
                return tl.tweenTo(time, vars);
            }

            tl.next = (vars) => toIndex(curIndex + 1, vars);
            tl.previous = (vars) => toIndex(curIndex - 1, vars);
            tl.current = () => curIndex;
            tl.toIndex = (index, vars) => toIndex(index, vars);
            tl.updateIndex = () =>
                (curIndex = Math.round(tl.progress() * (items.length - 1)));
            tl.times = times;
            tl.progress(1, true).progress(0, true);

            if (config.reversed) {
                tl.vars.onReverseComplete();
                tl.reverse();
            }

            if (config.draggable && typeof Draggable === "function") {
                let proxy = document.createElement("div"),
                    wrap = gsap.utils.wrap(0, 1),
                    ratio,
                    startProgress,
                    draggable,
                    dragSnap,
                    roundFactor,
                    align = () =>
                        loopRef.current.progress(
                            wrap(startProgress + (draggable.startX - draggable.x) * ratio)
                        ),
                    syncIndex = () => tl.updateIndex();

                draggable = Draggable.create(proxy, {
                    trigger: container,
                    type: "x",
                    onPress() {
                        startProgress = loopRef.current.progress();
                        loopRef.current.progress(0);
                        populateWidths();
                        totalWidth = getTotalWidth();
                        ratio = 1 / totalWidth;
                        dragSnap = totalWidth / items.length;
                        roundFactor = Math.pow(
                            10,
                            ((dragSnap + "").split(".")[1] || "").length
                        );
                        loopRef.current.progress(startProgress);
                    },
                    onDrag: align,
                    onThrowUpdate: align,
                    inertia: false,
                    snap: (value) => {
                        let n =
                            Math.round(parseFloat(value) / dragSnap) * dragSnap * roundFactor;
                        return (n - (n % 1)) / roundFactor;
                    },
                    onRelease: syncIndex,
                    onThrowComplete: () => gsap.set(proxy, { x: 0 }) && syncIndex()
                })[0];
            }

            return tl;
        };

        // Initialize the horizontal loop
        loopRef.current = horizontalLoop(logos, {
            paused: false,
            draggable: true,
            repeat: -1,
            speed: 0.3, // Slower speed for logos
            paddingRight: gap
        });

        return () => {
            if (loopRef.current) {
                loopRef.current.kill();
            }
        };
    }, { scope: logosContainerRef });

    // Title scramble effect
    useEffect(() => {
        const titles = titleRef.current.querySelectorAll('h1');

        // Map text gốc với text target khi hover
        const textMapping = {
            'Our': 'By',
            'Partners': 'HyStudio'
        };

        const cleanupFunctions = [];

        titles.forEach(title => {
            const originalText = title.textContent;
            const targetText = textMapping[originalText] || originalText;
            let split = null;

            const handleMouseEnter = () => {
                // Kill animations cũ nếu có
                if (split?.chars) {
                    gsap.killTweensOf(split.chars);
                }

                // Split text khi hover
                split = new SplitText(title, { type: 'chars', charsClass: 'char' });

                // Tính padding để căn giữa text ngắn hơn
                const originalLength = originalText.length;
                const targetLength = targetText.length;
                const paddedTarget = targetLength < originalLength
                    ? targetText.padEnd(originalLength, ' ')
                    : targetText;

                split.chars.forEach((char, index) => {
                    const targetChar = paddedTarget[index] || ' ';

                    gsap.to(char, {
                        duration: 0.8,
                        delay: index * 0.05,
                        scrambleText: {
                            text: targetChar,
                            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                            revealDelay: 0.3,
                            speed: 0.5
                        }
                    });
                });
            };

            const handleMouseLeave = () => {
                // Kill tất cả animations
                if (split?.chars) {
                    gsap.killTweensOf(split.chars);

                    // Scramble về text gốc
                    split.chars.forEach((char, index) => {
                        const originalChar = originalText[index] || ' ';

                        gsap.to(char, {
                            duration: 0.8,
                            delay: index * 0.05,
                            scrambleText: {
                                text: originalChar,
                                chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                                revealDelay: 0.3,
                                speed: 0.5
                            },
                            onComplete: () => {
                                // Revert về DOM ban đầu sau khi hoàn thành
                                if (index === split.chars.length - 1) {
                                    setTimeout(() => {
                                        if (split) {
                                            split.revert();
                                            title.textContent = originalText;
                                        }
                                    }, 100);
                                }
                            }
                        });
                    });
                }
            };

            title.addEventListener('mouseenter', handleMouseEnter);
            title.addEventListener('mouseleave', handleMouseLeave);

            // Lưu cleanup function
            cleanupFunctions.push(() => {
                title.removeEventListener('mouseenter', handleMouseEnter);
                title.removeEventListener('mouseleave', handleMouseLeave);
                if (split) {
                    split.revert();
                }
            });
        });

        // Cleanup
        return () => {
            cleanupFunctions.forEach(fn => fn());
        };
    }, []);

    return (
        <div className={styles.ourPartners} ref={containerRef}>
            <div className={styles.title} ref={titleRef}>
                <h1>Our</h1>
                <h1>Partners</h1>
            </div>

            <div className={styles.logosContainer} ref={logosContainerRef}>
                {partners.map((partner) => (
                    <div key={partner.id} className={styles.logoItem}>
                        <img
                            src={partner.src}
                            alt={partner.alt}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OurPartners;