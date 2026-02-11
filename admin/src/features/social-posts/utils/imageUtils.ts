/**
 * Helper function to optimize image URLs
 * - Handles Cloudinary automatic format and quality optimization
 * - Handles fallback for broken images
 */
export const optimizeImageUrl = (url: string | undefined): string => {
    if (!url) return ''

    // If it's a Cloudinary URL, add optimization parameters
    if (url.includes('cloudinary.com')) {
        // Add f_auto,q_auto for automatic format and quality optimization
        if (!url.includes('/upload/')) return url
        return url.replace('/upload/', '/upload/f_auto,q_auto,w_300/')
    }

    return url
}
