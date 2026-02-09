/**
 * Product Detail Accordion Configuration
 * Separated from component logic for better maintainability and potential CMS integration.
 */
export const PRODUCT_DETAIL_ACCORDION_ITEMS = [
    {
        id: 'productDetail',
        title: 'Product Detail',
        // Function to dynamically get content from product object
        getContent: (product: any) => product?.description || "Product description is loading..."
    },
    {
        id: 'sizeAndFit',
        title: 'Size & Fit',
        content: '168 x 30cm/66.1 x 11.8in',
        hasButton: true
    },
    {
        id: 'fabricAndCare',
        title: 'Fabric & Care',
        content: `100% cashmere | Specialist dry clean | Made in Scotland`
    }
];
