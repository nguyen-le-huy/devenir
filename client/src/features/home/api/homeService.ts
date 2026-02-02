import {
  getLatestVariants,
  getVariantsByCategoryWithChildren
} from '@/features/products/api/productService';
import { getAllCategories } from '@/features/products/api/categoryService';
import { getColorName } from '@/features/products/utils/productUtils';
import type { NewArrivalProduct, ScarvesProduct } from '../types';
import type { ICategory, IEnrichedVariant } from '@/features/products/types';

/**
 * Home Feature API Service
 * Provides data fetching methods specific to home page needs
 * Wraps product/category services to maintain feature isolation
 */
class HomeService {
  /**
   * Fetch latest products for New Arrivals section
   * @param limit - Number of products to fetch (default: 4)
   * @returns Transformed product data for display
   */
  async getLatestProducts(limit: number = 4): Promise<NewArrivalProduct[]> {
    try {
      const variants = await getLatestVariants(limit);

      return variants.map((variant: IEnrichedVariant) => ({
        id: variant._id,
        name: variant.productInfo?.name || 'Unknown Product',
        price: variant.price,
        image: variant.mainImage || '/images/placeholder.png',
        imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
        color: getColorName(variant.color),
        size: variant.size,
        sku: variant.sku,
      }));
    } catch (error) {
      console.error('[HomeService.getLatestProducts] Error:', error);
      throw new Error('Failed to fetch latest products');
    }
  }

  /**
   * Fetch scarves collection products
   * Consolidates logic for finding scarves category and its subcategories
   * @returns Array of scarves products for carousel display
   */
  async getScarvesCollection(): Promise<ScarvesProduct[]> {
    try {
      // Fetch all categories
      const response = await getAllCategories();

      const categories: ICategory[] = response.data || [];

      if (!categories || categories.length === 0) {
        return [];
      }

      // Find parent Scarves category
      const scarvesCategory = categories.find((cat: ICategory) => {
        const name = cat.name?.toLowerCase() || '';
        return name === 'scarves' || name === 'scarf';
      });

      if (!scarvesCategory) {
        return [];
      }

      // Fetch variants from all scarves categories
      const allVariants = await getVariantsByCategoryWithChildren(
        scarvesCategory._id,
        categories
      );

      if (!allVariants || allVariants.length === 0) {
        return [];
      }

      // Transform and limit to 12 products for carousel
      return allVariants.slice(0, 12).map((variant: IEnrichedVariant) => ({
        id: variant._id,
        name: variant.productInfo?.name || 'Scarf',
        price: variant.price,
        image: variant.mainImage || '/images/placeholder.png',
        imageHover: variant.hoverImage || variant.mainImage || '/images/placeholder.png',
        sku: variant.sku,
      }));
    } catch (error) {
      console.error('[HomeService.getScarvesCollection] Error:', error);
      throw new Error('Failed to fetch scarves collection');
    }
  }
}

export const homeService = new HomeService();
