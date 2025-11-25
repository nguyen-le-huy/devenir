/**
 * SKU Generator & Constants
 * Format: BRAND-CATEGORY-COLOR-SIZE
 * Example: DEV-SM-W-M (Devenir + Sơ Mi + White + Medium)
 */

// Brand codes
export const BRAND_CODES = {
  DEV: "Devenir Collection",
  // Expand as needed
} as const;

// Category codes
export const CATEGORY_CODES = {
  SM: "Áo Sơ Mi",
  TH: "Áo Thun",
  PO: "Áo Polo",
  QT: "Quần Tây",
  QJ: "Quần Jean",
  AK: "Áo Khoác",
} as const;

// Color codes
export const COLOR_CODES = {
  W: { name: "Trắng", hex: "#FFFFFF", code: "W" },
  B: { name: "Đen", hex: "#000000", code: "B" },
  N: { name: "Xanh Navy", hex: "#001F3F", code: "N" },
  GR: { name: "Xám", hex: "#808080", code: "GR" },
  BL: { name: "Xanh Dương", hex: "#0074D9", code: "BL" },
  BG: { name: "Be", hex: "#F5DEB3", code: "BG" },
  BR: { name: "Nâu", hex: "#8B4513", code: "BR" },
} as const;

// Size codes (keep original)
export const SIZE_CODES = {
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
  XXXL: "XXXL",
} as const;

// Type definitions
export type BrandCode = keyof typeof BRAND_CODES;
export type CategoryCode = keyof typeof CATEGORY_CODES;
export type ColorCode = keyof typeof COLOR_CODES;
export type SizeCode = keyof typeof SIZE_CODES;

export interface VariantConfig {
  brand: BrandCode;
  category: CategoryCode;
  color: ColorCode | string;
  size: SizeCode;
}

/**
 * Generate SKU based on product and variant config
 * @example
 * generateSKU({
 *   brand: "DEV",
 *   category: "SM",
 *   color: "W",
 *   size: "M"
 * })
 * // Returns: "DEV-SM-W-M"
 */
export function generateSKU(config: VariantConfig): string {
  const { brand, category, color, size } = config;
  return `${brand}-${category}-${color}-${size}`;
}

/**
 * Parse SKU to extract variant config
 * @example
 * parseSKU("DEV-SM-W-M")
 * // Returns: { brand: "DEV", category: "SM", color: "W", size: "M" }
 */
export function parseSKU(sku: string): VariantConfig | null {
  const parts = sku.split("-");
  if (parts.length !== 4) return null;

  const [brand, category, color, size] = parts;

  // Validate
  if (
    !(brand in BRAND_CODES) ||
    !(category in CATEGORY_CODES) ||
    (!(color in COLOR_CODES) && !/^[0-9A-F]{6}$/i.test(color)) || // Allow hex-like strings (6 chars)
    !(size in SIZE_CODES)
  ) {
    return null;
  }

  return {
    brand: brand as BrandCode,
    category: category as CategoryCode,
    color: color as ColorCode | string,
    size: size as SizeCode,
  };
}

/**
 * Generate multiple SKUs from size and color lists
 * @example
 * generateVariantMatrix({
 *   brand: "DEV",
 *   category: "SM",
 *   sizes: ["S", "M", "L"],
 *   colors: ["W", "B"]
 * })
 * // Returns array of 6 variant configs (3×2)
 */
export function generateVariantMatrix(config: {
  brand: BrandCode;
  category: CategoryCode;
  sizes: SizeCode[];
  colors: (ColorCode | string)[];
}): VariantConfig[] {
  const { brand, category, sizes, colors } = config;
  const matrix: VariantConfig[] = [];

  for (const color of colors) {
    for (const size of sizes) {
      matrix.push({
        brand,
        category,
        color,
        size,
      });
    }
  }

  return matrix;
}

/**
 * Get color info by code
 */
export function getColorInfo(code: ColorCode | string) {
  return COLOR_CODES[code as ColorCode] || (code.startsWith('#') ? { name: code, hex: code } : null);
}

/**
 * Get category name by code
 */
export function getCategoryName(code: CategoryCode) {
  return CATEGORY_CODES[code];
}

/**
 * Get brand name by code
 */
export function getBrandName(code: BrandCode) {
  return BRAND_CODES[code];
}
