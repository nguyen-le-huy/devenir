import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
}

/**
 * SEO Component
 * Manages document title and meta description dynamically
 * Note: For server-side rendering support, consider migrating to react-helmet-async
 */
const SEO = ({ title, description }: SEOProps) => {
    useEffect(() => {
        // Update Title
        document.title = title;

        // Update Meta Description
        if (description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.setAttribute('name', 'description');
                document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute('content', description);
        }
    }, [title, description]);

    return null;
};

export default SEO;
