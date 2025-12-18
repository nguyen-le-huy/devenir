import styles from './Introduction.module.css';
import gsap from 'gsap';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import SplitText from 'gsap/src/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Draggable);

const introCards = [
    { src: "images/introCard1.webp", alt: "Intro card 1" },
    { src: "images/introCard2.webp", alt: "Intro card 2" },
    { src: "images/introCard3.webp", alt: "Intro card 3" },
    { src: "images/introCard4.webp", alt: "Intro card 4" },
    { src: "images/introCard5.webp", alt: "Intro card 5" },
    { src: "images/introCard6.webp", alt: "Intro card 6" },
];

const Introduction = () => {
    const cardsContainerRef = useRef(null);
    const introContainerRef = useRef(null);
    const introTextRef = useRef(null);
    const loopRef = useRef(null);

    useGSAP(() => {
        const container = cardsContainerRef.current;
        const introContainer = introContainerRef.current;
        const introText = introTextRef.current;

        if (!container || !introContainer || !introText) return;

        // Get all card elements
        const boxes = gsap.utils.toArray(container.querySelectorAll(`.${styles.introCard}`));

        if (!boxes.length) return;

        // Calculate card width based on container
        const containerWidth = container.offsetWidth;
        const cardWidth = Math.min(460, containerWidth * 0.8); // Responsive card width

        // Set initial positions for cards
        gsap.set(boxes, {
            x: (i) => i * (cardWidth + 10) // cardWidth + gap
        });

        // Horizontal loop function (from provided example)
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
                        // populateWidths(); // REMOVED to prevent INP
                        // totalWidth = getTotalWidth(); // REMOVED
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

            // Allow manual refresh
            tl.refresh = () => {
                populateWidths();
                totalWidth = getTotalWidth();
            };

            return tl;
        };

        // Initialize the horizontal loop
        loopRef.current = horizontalLoop(boxes, {
            paused: false,
            draggable: true,
            repeat: -1,
            speed: 0.5, // Adjust speed as needed
            paddingRight: 10 // Gap between cards
        });

        // Handle window resize to update widths
        const handleResize = () => {
            if (loopRef.current && typeof loopRef.current.refresh === 'function') {
                // We need to reset progress to ensure calculations are correct
                const currentProgress = loopRef.current.progress();
                loopRef.current.progress(0);
                loopRef.current.refresh();
                loopRef.current.progress(currentProgress);
            }
        };

        window.addEventListener('resize', handleResize);

        // SplitText animation for title (like ChatWindow)
        let splitInstance = null;

        // Set initial opacity
        gsap.set(introText, { opacity: 1 });

        document.fonts.ready.then(() => {
            splitInstance = new SplitText(introText, {
                type: "words,lines",
                linesClass: "line"
            });

            // Wrap lines for overflow hidden
            splitInstance.lines.forEach(line => {
                const wrapper = document.createElement('div');
                wrapper.style.overflow = 'hidden';
                line.parentNode.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            // Set initial state for lines
            gsap.set(splitInstance.lines, { yPercent: 100, opacity: 0 });

            // ScrollTrigger for text animation
            ScrollTrigger.create({
                trigger: introContainer,
                start: 'top 80%',
                onEnter: () => {
                    if (splitInstance && splitInstance.lines) {
                        gsap.to(splitInstance.lines, {
                            duration: 0.8,
                            yPercent: 0,
                            opacity: 1,
                            stagger: 0.08,
                            ease: "power2.out",
                        });
                    }
                }
            });
        });

        // ScrollTrigger for background color
        ScrollTrigger.create({
            trigger: introContainer,
            start: 'top 20%',
            onEnter: () => {
                gsap.to(introContainer, {
                    backgroundColor: '#5C4439',
                    duration: 0.5
                });
                gsap.to(introText, {
                    color: '#FFFFFF',
                    duration: 0.5
                });
            }
        });

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (splitInstance) {
                splitInstance.revert();
            }
            if (loopRef.current) {
                loopRef.current.kill();
            }
        };

    }, { scope: introContainerRef });

    return (
        <div className={`${styles.introduction}`} ref={introContainerRef}>
            <h1 className={styles.title} ref={introTextRef}>
                Timeless, seasonal and unmistakably Burberry, find the perfect gifts for everyone on your list.
            </h1>
            <div className={styles.introCards} ref={cardsContainerRef}>
                {introCards.map((card, index) => (
                    <div key={index} className={styles.introCard}>
                        <img src={card.src} alt={card.alt} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Introduction;