import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';

interface HorizontalLoopConfig {
    repeat?: number;
    paused?: boolean;
    speed?: number;
    snap?: number | boolean;
    paddingRight?: number;
    reversed?: boolean;
    draggable?: boolean;
    [key: string]: any;
}

/**
 * Helper function to create a seamless horizontal loop using GSAP
 * Based on GSAP's horizontalLoop helper
 */
export function horizontalLoop(items: HTMLElement[] | NodeListOf<Element> | string, config: HorizontalLoopConfig = {}) {
    // Ensure we have an array of elements
    const boxes = gsap.utils.toArray(items) as HTMLElement[];
    config = config || {};

    let tl = gsap.timeline({
        repeat: config.repeat,
        paused: config.paused,
        defaults: { ease: "none" },
        onReverseComplete: () =>
            tl.totalTime(tl.rawTime() + tl.duration() * 100)
    }) as any, // Constructing a custom object that extends GSAP timeline
        length = boxes.length,
        startX = boxes[0].offsetLeft,
        times: number[] = [],
        widths: number[] = [],
        xPercents: number[] = [],
        curIndex = 0,
        pixelsPerSecond = (config.speed || 1) * 100,
        snap = config.snap === false ? (v: number) => v : gsap.utils.snap(typeof config.snap === 'number' ? config.snap : 1),
        populateWidths = () =>
            boxes.forEach((el, i) => {
                widths[i] = parseFloat(gsap.getProperty(el, "width", "px") as string);
                xPercents[i] = snap(
                    (parseFloat(gsap.getProperty(el, "x", "px") as string) / widths[i]) * 100 +
                    (gsap.getProperty(el, "xPercent") as number)
                );
            }),
        getTotalWidth = () =>
            boxes[length - 1].offsetLeft +
            (xPercents[length - 1] / 100) * widths[length - 1] -
            startX +
            boxes[length - 1].offsetWidth *
            (gsap.getProperty(boxes[length - 1], "scaleX") as number) +
            (parseFloat(String(config.paddingRight) || "0") || 0),
        totalWidth: number;

    // Helper variables initialized later
    let curX: number, distanceToStart: number, distanceToLoop: number, item: HTMLElement, i: number;

    populateWidths();
    gsap.set(boxes, {
        xPercent: (i) => xPercents[i]
    });
    gsap.set(boxes, { x: 0 });
    totalWidth = getTotalWidth();

    for (i = 0; i < length; i++) {
        item = boxes[i];
        curX = (xPercents[i] / 100) * widths[i];
        distanceToStart = item.offsetLeft + curX - startX;
        distanceToLoop =
            distanceToStart + widths[i] * (gsap.getProperty(item, "scaleX") as number);
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

    function toIndex(index: number, vars?: any) {
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

    tl.next = (vars: any) => toIndex(curIndex + 1, vars);
    tl.previous = (vars: any) => toIndex(curIndex - 1, vars);
    tl.current = () => curIndex;
    tl.toIndex = (index: number, vars: any) => toIndex(index, vars);
    tl.updateIndex = () =>
        (curIndex = Math.round(tl.progress() * (boxes.length - 1)));
    tl.times = times;
    tl.progress(1, true).progress(0, true);

    if (config.reversed) {
        tl.vars.onReverseComplete();
        tl.reverse();
    }

    if (config.draggable && typeof Draggable === "function") {
        let proxy = document.createElement("div"),
            wrap = gsap.utils.wrap(0, 1),
            ratio: number,
            startProgress: number,
            draggable: any,
            dragSnap: number,
            roundFactor: number,
            align = () =>
                tl.progress(
                    wrap(startProgress + (draggable.startX - draggable.x) * ratio)
                ),
            syncIndex = () => tl.updateIndex();

        // Warning: Draggable must be registered in the component using this helper
        draggable = Draggable.create(proxy, {
            trigger: boxes[0].parentElement, // Assume parent is the container
            type: "x",
            onPress() {
                startProgress = tl.progress();
                tl.progress(0);
                // populateWidths();
                // totalWidth = getTotalWidth();
                ratio = 1 / totalWidth;
                dragSnap = totalWidth / boxes.length;
                roundFactor = Math.pow(
                    10,
                    ((dragSnap + "").split(".")[1] || "").length
                );
                tl.progress(startProgress);
            },
            onDrag: align,
            onThrowUpdate: align,
            inertia: false,
            snap: (value: any) => {
                let n =
                    Math.round(parseFloat(value) / dragSnap) * dragSnap * roundFactor;
                return (n - (n % 1)) / roundFactor;
            },
            onRelease: syncIndex,
            onThrowComplete: () => {
                gsap.set(proxy, { x: 0 });
                syncIndex();
            }
        })[0];
    }

    // Allow manual refresh
    tl.refresh = () => {
        populateWidths();
        totalWidth = getTotalWidth();
    };

    return tl;
}
