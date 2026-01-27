// SplitText types (GSAP Premium Plugin)
export interface SplitTextInstance {
    lines: Element[];
    words: Element[];
    chars: Element[];
    revert: () => void;
}

// Extended GSAP Timeline for horizontalLoop
export interface HorizontalLoopTimeline extends gsap.core.Timeline {
    next: (vars?: gsap.TweenVars) => gsap.core.Tween;
    previous: (vars?: gsap.TweenVars) => gsap.core.Tween;
    current: () => number;
    toIndex: (index: number, vars?: gsap.TweenVars) => gsap.core.Tween;
    updateIndex: () => void;
    times: number[];
    refresh: () => void;
}

// Intro Card
export interface IntroCard {
    src: string;
    alt: string;
}

// Partner Logo
export interface PartnerLogo {
    id: number;
    src: string;
    alt: string;
}

// Product Card for NewArrivals
export interface NewArrivalProduct {
    id: string;
    name: string;
    price: number;
    image: string;
    imageHover: string;
    color?: string;
    size?: string;
    sku: string;
}

// Variant data from API
export interface VariantData {
    _id: string;
    productInfo?: {
        name: string;
    };
    price: number;
    mainImage: string;
    hoverImage?: string;
    color?: string;
    size?: string;
    sku: string;
}

// Category data
export interface CategoryData {
    _id: string;
    name: string;
    slug: string;
    parentId?: string | null;
}

// Scarves product
export interface ScarvesProduct {
    id: string;
    name: string;
    price: number;
    image: string;
    imageHover: string;
    sku: string;
}
